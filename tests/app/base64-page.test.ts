import { describe, expect, it } from 'vitest';
import { transformBase64Input } from '../../src/app/features/base64/Base64Page';

describe('Base64Page transform', () => {
  it('encodes short plain-text input instead of decoding it', () => {
    expect(transformBase64Input('j')).toBe('ag==');
    expect(transformBase64Input('jo')).toBe('am8=');
    expect(transformBase64Input('joh')).toBe('am9o');
    expect(transformBase64Input('john')).toBe('am9obg==');
  });

  it('decodes valid short base64 input', () => {
    expect(transformBase64Input('YQ==')).toBe('a');
    expect(transformBase64Input('am8=')).toBe('jo');
  });

  it('decodes unpadded base64 when it round-trips cleanly', () => {
    expect(transformBase64Input('SGVsbG8')).toBe('Hello');
  });
});
