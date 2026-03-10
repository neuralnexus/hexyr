import { bytesToHex, textToBytes } from '../encoding';

export type WebhookProvider = 'stripe' | 'github' | 'slack';

export interface WebhookVerifyInput {
  provider: WebhookProvider;
  payload: string;
  secret: string;
  signatureHeader: string;
  timestampHeader?: string;
}

export interface WebhookVerifyResult {
  provider: WebhookProvider;
  valid: boolean;
  algorithm: string;
  expected: string;
  received: string;
  details: string[];
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacHex(message: string, secret: string, hash: 'SHA-1' | 'SHA-256'): Promise<string> {
  const key = await crypto.subtle.importKey('raw', textToBytes(secret), { name: 'HMAC', hash }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, textToBytes(message));
  return bytesToHex(new Uint8Array(sig));
}

function parseStripeSig(header: string): { timestamp: string; signatures: string[] } {
  const chunks = header.split(',').map((x) => x.trim()).filter(Boolean);
  const timestamp = chunks.find((x) => x.startsWith('t='))?.slice(2) ?? '';
  const signatures = chunks.filter((x) => x.startsWith('v1=')).map((x) => x.slice(3));
  return { timestamp, signatures };
}

export async function verifyWebhookSignature(input: WebhookVerifyInput): Promise<WebhookVerifyResult> {
  const details: string[] = [];
  if (!input.secret) throw new Error('Secret is required');
  if (!input.signatureHeader.trim()) throw new Error('Signature header is required');

  if (input.provider === 'stripe') {
    const parsed = parseStripeSig(input.signatureHeader);
    if (!parsed.timestamp || parsed.signatures.length === 0) {
      throw new Error('Stripe signature header must include t= and v1= entries');
    }
    const expected = await hmacHex(`${parsed.timestamp}.${input.payload}`, input.secret, 'SHA-256');
    const valid = parsed.signatures.some((sig) => safeEqual(sig.toLowerCase(), expected.toLowerCase()));
    details.push('Computed using HMAC-SHA256 over "timestamp.payload"');
    return {
      provider: 'stripe',
      valid,
      algorithm: 'HMAC-SHA256',
      expected,
      received: parsed.signatures[0] ?? '',
      details,
    };
  }

  if (input.provider === 'github') {
    const header = input.signatureHeader.trim();
    const [prefix, value] = header.split('=', 2);
    if (!prefix || !value) throw new Error('GitHub signature header must look like sha256=<hex>');
    const algo = prefix.toLowerCase() === 'sha1' ? 'SHA-1' : 'SHA-256';
    const expected = await hmacHex(input.payload, input.secret, algo);
    const valid = safeEqual(value.toLowerCase(), expected.toLowerCase());
    details.push(`Computed with ${algo} using raw request body`);
    return {
      provider: 'github',
      valid,
      algorithm: `HMAC-${algo}`,
      expected,
      received: value,
      details,
    };
  }

  const timestamp = input.timestampHeader?.trim();
  if (!timestamp) throw new Error('Slack verification requires timestampHeader');
  const expected = await hmacHex(`v0:${timestamp}:${input.payload}`, input.secret, 'SHA-256');
  const received = input.signatureHeader.trim().replace(/^v0=/i, '');
  const valid = safeEqual(received.toLowerCase(), expected.toLowerCase());
  details.push('Computed using HMAC-SHA256 over "v0:timestamp:payload"');
  return {
    provider: 'slack',
    valid,
    algorithm: 'HMAC-SHA256',
    expected,
    received,
    details,
  };
}
