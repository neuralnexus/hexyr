import { base64ToText } from '../encoding';
import type { JwtInspection } from '../types';

function safeJsonParse(input: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(input) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function inspectJwt(token: string): JwtInspection {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('JWT must contain exactly three segments');
  }

  const [headerRaw, payloadRaw, signatureRaw] = parts;
  const warnings: string[] = [
    'Decode-only view: this does not verify token signatures.',
  ];

  const headerJson = safeJsonParse(base64ToText(headerRaw));
  const payloadJson = safeJsonParse(base64ToText(payloadRaw));

  if (!headerJson) {
    warnings.push('Header does not decode into valid JSON.');
  }
  if (!payloadJson) {
    warnings.push('Payload does not decode into valid JSON.');
  }

  const alg = headerJson?.alg;
  if (alg === 'none') {
    warnings.push('alg=none detected. Treat this token as untrusted.');
  }
  if (!signatureRaw) {
    warnings.push('Signature segment is empty.');
  }

  return {
    headerRaw,
    payloadRaw,
    signatureRaw,
    headerJson,
    payloadJson,
    warnings,
  };
}
