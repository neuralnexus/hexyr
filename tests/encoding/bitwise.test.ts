import { describe, expect, it } from 'vitest';
import { bitwiseBinary, bitwiseNot, shiftLeft, shiftRight, swapEndianness } from '../../src/shared/encoding';

describe('bitwise helpers', () => {
  it('applies AND/OR/XOR', () => {
    expect(bitwiseBinary('ff', '0f', 'AND')).toBe('00001111');
    expect(bitwiseBinary('f0', '0f', 'OR')).toBe('11111111');
    expect(bitwiseBinary('ff', '0f', 'XOR')).toBe('11110000');
  });

  it('applies NOT and shifts', () => {
    expect(bitwiseNot('0f')).toBe('f0');
    expect(shiftLeft('01', 1)).toBe('02');
    expect(shiftRight('02', 1)).toBe('01');
  });

  it('swaps endianness', () => {
    expect(swapEndianness('a1b2c3')).toBe('c3b2a1');
  });
});
