import { describe, expect, it } from 'vitest';
import { verifyWebhookSignature } from '../../src/shared/crypto';

describe('webhook signature verifier', () => {
  it('verifies github sha256 signatures', async () => {
    const payload = '{"ok":true}';
    const secret = 'supersecret';
    const first = await verifyWebhookSignature({
      provider: 'github',
      payload,
      secret,
      signatureHeader: 'sha256=00',
    });

    const second = await verifyWebhookSignature({
      provider: 'github',
      payload,
      secret,
      signatureHeader: `sha256=${first.expected}`,
    });

    expect(second.valid).toBe(true);
  });
});
