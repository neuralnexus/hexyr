import { describe, expect, it } from 'vitest';
import { hashText, hmacText } from '../../src/shared/crypto';

describe('crypto helpers', () => {
  it('hashes with MD5 for legacy compatibility', async () => {
    const digest = await hashText('abc', 'MD5');
    expect(digest).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('hashes with SHA-256', async () => {
    const digest = await hashText('abc', 'SHA-256');
    expect(digest).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('computes HMAC-SHA256', async () => {
    const mac = await hmacText('hello', 'secret', 'SHA-256');
    expect(mac.length).toBe(64);
  });
});
