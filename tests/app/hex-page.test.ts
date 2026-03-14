import { describe, expect, it } from 'vitest';
import { transformHexInput } from '../../src/app/features/hex/HexPage';

describe('HexPage transform', () => {
  it('encodes short plain-text input instead of decoding it', () => {
    expect(transformHexInput('ab')).toBe('6162');
    expect(transformHexInput('beef')).toBe('62656566');
  });

  it('decodes valid hex when it round-trips to readable text', () => {
    expect(transformHexInput('4869')).toBe('Hi');
    expect(transformHexInput('48 65 6c 6c 6f')).toBe('Hello');
  });
});
