import { describe, expect, it } from 'vitest';
import { hmacSign, signAwsSigV4 } from '../../src/shared/crypto';

describe('request signing helpers', () => {
  it('signs generic HMAC payloads', async () => {
    const signed = await hmacSign('hello', 'secret', 'SHA-256');
    expect(signed.hex.length).toBe(64);
    expect(signed.base64.length).toBeGreaterThan(20);
  });

  it('builds AWS SigV4 authorization header', async () => {
    const signed = await signAwsSigV4({
      method: 'GET',
      url: 'https://example.amazonaws.com/',
      region: 'us-east-1',
      service: 'execute-api',
      accessKeyId: 'AKIDEXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
      payload: '',
      isoDate: '2024-01-01T00:00:00.000Z',
    });
    expect(signed.authorizationHeader).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(signed.credentialScope).toContain('/us-east-1/execute-api/aws4_request');
  });
});
