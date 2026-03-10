import { describe, expect, it } from 'vitest';
import { redactSensitiveText } from '../../src/shared/analysis';

describe('redaction mode', () => {
  it('masks common sensitive patterns', () => {
    const input = 'token=sk_ABCDEF1234567890 email=a@b.com ip=10.20.30.40';
    const result = redactSensitiveText(input);
    expect(result.counts.apiKey).toBeGreaterThan(0);
    expect(result.counts.email).toBe(1);
    expect(result.counts.ipv4).toBe(1);
    expect(result.redactedText).not.toContain('10.20.30.40');
  });
});
