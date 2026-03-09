import { base64ToBytes, isValidHex, normalizeHexInput } from '../encoding';
import type { FormatCandidate, KnownFormat } from '../types';

function isLikelyJson(input: string): boolean {
  const trimmed = input.trim();
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return false;
  }
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function isLikelyBinary(input: string): boolean {
  const cleaned = input.replace(/\s+/g, '');
  return cleaned.length > 8 && cleaned.length % 8 === 0 && /^[01]+$/.test(cleaned);
}

export function isLikelyBase64(input: string): boolean {
  const cleaned = input.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/_-]+=*$/.test(cleaned) || cleaned.length < 8) {
    return false;
  }
  try {
    base64ToBytes(cleaned);
    return true;
  } catch {
    return false;
  }
}

function isLikelyJwt(input: string): boolean {
  const parts = input.trim().split('.');
  if (parts.length !== 3) {
    return false;
  }
  return parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part));
}

function isLikelyUrlEncoded(input: string): boolean {
  const hasEscapes = /%[0-9a-fA-F]{2}/.test(input);
  const hasPlusSpace = /\+/.test(input);
  return hasEscapes || hasPlusSpace;
}

function classifyBase64Variant(input: string): KnownFormat {
  return /[-_]/.test(input) ? 'base64url' : 'base64';
}

export function detectFormats(input: string): FormatCandidate[] {
  const value = input.trim();
  if (!value) {
    return [{ format: 'unknown', confidence: 1, reason: 'No input provided.' }];
  }

  const candidates: FormatCandidate[] = [];

  const normalizedHex = normalizeHexInput(value);
  if (isValidHex(value) || (normalizedHex.length >= 8 && /^[0-9a-fA-F]+$/.test(normalizedHex))) {
    candidates.push({
      format: 'hex',
      confidence: normalizedHex.length % 2 === 0 ? 0.92 : 0.65,
      reason:
        normalizedHex.length % 2 === 0
          ? 'Contains only hex characters and even byte pairs.'
          : 'Looks like hex, but byte alignment appears odd.',
    });
  }

  if (isLikelyBase64(value)) {
    const variant = classifyBase64Variant(value);
    candidates.push({
      format: variant,
      confidence: 0.86,
      reason:
        variant === 'base64url'
          ? 'Uses URL-safe base64 alphabet with - and _.'
          : 'Matches base64 alphabet and decodes cleanly.',
    });
  }

  if (isLikelyBinary(value)) {
    candidates.push({
      format: 'binary',
      confidence: 0.9,
      reason: 'Contains only 0 and 1 and groups into bytes.',
    });
  }

  if (isLikelyJwt(value)) {
    candidates.push({
      format: 'jwt',
      confidence: 0.93,
      reason: 'Three dot-separated URL-safe base64 segments.',
    });
  }

  if (isLikelyJson(value)) {
    candidates.push({
      format: 'json',
      confidence: 0.9,
      reason: 'Parses as valid JSON.',
    });
  }

  if (isLikelyUrlEncoded(value)) {
    candidates.push({
      format: 'urlencoded',
      confidence: 0.68,
      reason: 'Contains URL encoded patterns like %xx or +.',
    });
  }

  candidates.push({
    format: 'text',
    confidence: 0.55,
    reason: 'Treat as UTF-8 text by default.',
  });

  return candidates.sort((a, b) => b.confidence - a.confidence);
}
