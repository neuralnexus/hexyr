import { describe, expect, it } from 'vitest';
import { transformBinaryInput } from '../../src/app/features/binary/BinaryPage';

describe('BinaryPage transform', () => {
  it('encodes short plain-text input instead of treating it as binary', () => {
    expect(transformBinaryInput('1')).toBe('00110001');
    expect(transformBinaryInput('10')).toBe('00110001 00110000');
    expect(transformBinaryInput('101')).toBe('00110001 00110000 00110001');
  });

  it('decodes valid binary byte groups when they round-trip cleanly', () => {
    expect(transformBinaryInput('01000001')).toBe('A');
    expect(transformBinaryInput('01001000 01101001')).toBe('Hi');
  });
});
