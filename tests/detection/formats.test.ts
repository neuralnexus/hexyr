import { describe, expect, it } from 'vitest';
import { detectFormats } from '../../src/shared/detection';

describe('format detection coverage', () => {
  it('detects json and text', () => {
    const formats = detectFormats('{"ok":true}').map((item) => item.format);
    expect(formats).toContain('json');
    expect(formats).toContain('text');
  });

  it('detects jwt', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.signature';
    const top = detectFormats(token)[0];
    expect(top.format).toBe('jwt');
  });

  it('detects binary and urlencoded', () => {
    expect(detectFormats('01000001 01000010').some((item) => item.format === 'binary')).toBe(true);
    expect(detectFormats('hello%20world').some((item) => item.format === 'urlencoded')).toBe(true);
  });
});
