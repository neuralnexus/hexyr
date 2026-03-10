import { bytesToHex, textToBytes } from '../encoding';

export type HmacAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export async function hmacSign(
  message: string,
  key: string,
  algorithm: HmacAlgorithm,
): Promise<{ hex: string; base64: string }> {
  const imported = await crypto.subtle.importKey(
    'raw',
    textToBytes(key),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', imported, textToBytes(message)));
  return {
    hex: bytesToHex(signature),
    base64: toBase64(signature),
  };
}

async function sha256Hex(input: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', textToBytes(input)));
  return bytesToHex(digest);
}

async function hmacSha256Raw(key: Uint8Array, message: string): Promise<Uint8Array> {
  const imported = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', imported, textToBytes(message));
  return new Uint8Array(signature);
}

export interface SigV4Input {
  method: string;
  url: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  headers?: Record<string, string>;
  payload: string;
  isoDate?: string;
}

export interface SigV4Output {
  amzDate: string;
  credentialScope: string;
  canonicalRequest: string;
  stringToSign: string;
  authorizationHeader: string;
}

function normalizeDate(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

export async function signAwsSigV4(input: SigV4Input): Promise<SigV4Output> {
  const method = input.method.toUpperCase();
  const url = new URL(input.url);
  const amzDate = normalizeDate(input.isoDate);
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeadersMap: Record<string, string> = {
    host: url.host,
    'x-amz-date': amzDate,
    ...(input.headers ?? {}),
  };

  const lowerHeaders = Object.entries(canonicalHeadersMap)
    .map(([k, v]) => [k.toLowerCase().trim(), v.trim()] as const)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalHeaders = `${lowerHeaders.map(([k, v]) => `${k}:${v}`).join('\n')}\n`;
  const signedHeaders = lowerHeaders.map(([k]) => k).join(';');
  const canonicalQuery = [...url.searchParams.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const payloadHash = await sha256Hex(input.payload);

  const canonicalRequest = [
    method,
    url.pathname || '/',
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

  const kDate = await hmacSha256Raw(textToBytes(`AWS4${input.secretAccessKey}`), dateStamp);
  const kRegion = await hmacSha256Raw(kDate, input.region);
  const kService = await hmacSha256Raw(kRegion, input.service);
  const kSigning = await hmacSha256Raw(kService, 'aws4_request');
  const signature = bytesToHex(await hmacSha256Raw(kSigning, stringToSign));

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    amzDate,
    credentialScope,
    canonicalRequest,
    stringToSign,
    authorizationHeader,
  };
}
