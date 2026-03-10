import { base64ToBytes, textToBytes } from '../encoding';
import type { AnalysisStats, ByteFrequencyBucket, MagicByteMatch } from '../types';

export function computeStats(input: string): AnalysisStats {
  const bytes = textToBytes(input);
  return {
    byteCount: bytes.length,
    charCount: input.length,
    bitLength: bytes.length * 8,
    lineCount: input.length === 0 ? 0 : input.split(/\r\n|\n|\r/).length,
  };
}

export function estimateEntropy(input: Uint8Array): number {
  if (input.length === 0) {
    return 0;
  }
  const frequencies = new Array(256).fill(0);
  for (const byte of input) {
    frequencies[byte] += 1;
  }
  let entropy = 0;
  for (const count of frequencies) {
    if (count === 0) {
      continue;
    }
    const p = count / input.length;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(4));
}

export function getByteFrequency(input: Uint8Array): ByteFrequencyBucket[] {
  const map = new Array(256).fill(0);
  for (const byte of input) {
    map[byte] += 1;
  }
  return map
    .map((count, value) => ({ value, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

const MAGIC_NUMBERS: Array<{ signature: number[]; match: MagicByteMatch }> = [
  {
    signature: [0x89, 0x50, 0x4e, 0x47],
    match: {
      name: 'PNG',
      mime: 'image/png',
      extension: '.png',
      description: 'Portable Network Graphics image',
    },
  },
  {
    signature: [0xff, 0xd8, 0xff],
    match: {
      name: 'JPEG',
      mime: 'image/jpeg',
      extension: '.jpg',
      description: 'Joint Photographic Experts Group image',
    },
  },
  {
    signature: [0x47, 0x49, 0x46, 0x38],
    match: {
      name: 'GIF',
      mime: 'image/gif',
      extension: '.gif',
      description: 'Graphics Interchange Format image',
    },
  },
  {
    signature: [0x25, 0x50, 0x44, 0x46],
    match: {
      name: 'PDF',
      mime: 'application/pdf',
      extension: '.pdf',
      description: 'Portable Document Format file',
    },
  },
  {
    signature: [0x50, 0x4b, 0x03, 0x04],
    match: {
      name: 'ZIP',
      mime: 'application/zip',
      extension: '.zip',
      description: 'ZIP archive',
    },
  },
  {
    signature: [0x7f, 0x45, 0x4c, 0x46],
    match: {
      name: 'ELF',
      mime: 'application/x-elf',
      extension: '.elf',
      description: 'Executable and Linkable Format binary',
    },
  },
  {
    signature: [0x4d, 0x5a],
    match: {
      name: 'PE',
      mime: 'application/vnd.microsoft.portable-executable',
      extension: '.exe',
      description: 'Windows Portable Executable',
    },
  },
];

export function detectMagicBytes(input: Uint8Array): MagicByteMatch | null {
  for (const candidate of MAGIC_NUMBERS) {
    const ok = candidate.signature.every((byte, idx) => input[idx] === byte);
    if (ok) {
      return candidate.match;
    }
  }
  return null;
}

export function base64PaddingStatus(input: string): string {
  const clean = input.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/_-]+=*$/.test(clean)) {
    return 'Invalid base64 alphabet';
  }
  if (clean.length % 4 === 0) {
    return clean.endsWith('=') ? 'Has explicit padding' : 'No padding needed';
  }
  return 'Missing padding';
}

export function base64UrlHint(input: string): string {
  return /[-_]/.test(input) ? 'Likely base64url variant' : 'Standard base64 alphabet likely';
}

export function extractHexColors(input: string): string[] {
  const matches = input.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g);
  return matches ? Array.from(new Set(matches)) : [];
}

export function bytesFromBestEffort(input: string): Uint8Array {
  try {
    return base64ToBytes(input);
  } catch {
    return textToBytes(input);
  }
}

export * from './bytes-inspector';
export * from './ascii';
export * from './compression';
export * from './diff';
export * from './batch';
export * from './hexdump';
export * from './redact';
