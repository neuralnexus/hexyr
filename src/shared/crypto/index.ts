import { bytesToHex, textToBytes } from '../encoding';
import { md5Hex } from './md5';

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export async function hashText(input: string, algorithm: HashAlgorithm): Promise<string> {
  if (algorithm === 'MD5') {
    return md5Hex(input);
  }
  const data = textToBytes(input);
  const digest = await crypto.subtle.digest(algorithm, data);
  return bytesToHex(new Uint8Array(digest));
}

export async function hmacText(
  message: string,
  key: string,
  algorithm: Exclude<HashAlgorithm, 'MD5' | 'SHA-1'> = 'SHA-256',
): Promise<string> {
  const imported = await crypto.subtle.importKey(
    'raw',
    textToBytes(key),
    {
      name: 'HMAC',
      hash: algorithm,
    },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', imported, textToBytes(message));
  return bytesToHex(new Uint8Array(signature));
}

export async function md5LegacyNotice(): Promise<string> {
  return 'MD5 is supported for legacy compatibility only and must not be used for modern security guarantees.';
}

export * from './signing';
export * from './webhook';
