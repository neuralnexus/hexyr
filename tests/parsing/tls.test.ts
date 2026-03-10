import { describe, expect, it } from 'vitest';
import { verifyTlsChainPem } from '../../src/shared/parsing';

describe('tls verifier', () => {
  it('errors on invalid pem chain', async () => {
    await expect(verifyTlsChainPem('invalid', 'example.com')).rejects.toThrow();
  });
});
