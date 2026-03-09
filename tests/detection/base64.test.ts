import { describe, expect, it } from 'vitest';
import { isLikelyBase64, detectFormats } from '../../src/shared/detection';

describe('base64 detection', () => {
  it('detects valid base64', () => {
    expect(isLikelyBase64('SGVsbG8=')).toBe(true);
  });

  it('rejects invalid base64', () => {
    expect(isLikelyBase64('###notbase64###')).toBe(false);
  });

  it('detects base64url variant', () => {
    const top = detectFormats('SGVsbG8_').find((item) => item.format === 'base64url');
    expect(top).toBeTruthy();
  });
});
