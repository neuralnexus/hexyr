import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, isValidHex, normalizeHexInput } from '../../src/shared/encoding';

describe('hex encoding helpers', () => {
  it('normalizes and validates hex', () => {
    expect(normalizeHexInput('0xAA bb cc')).toBe('AAbbcc');
    expect(isValidHex('AA bb cc')).toBe(true);
    expect(isValidHex('abc')).toBe(false);
  });

  it('round-trips bytes and hex', () => {
    const bytes = hexToBytes('48656c6c6f');
    expect(bytesToHex(bytes)).toBe('48656c6c6f');
  });

  it('throws on odd-length hex', () => {
    expect(() => hexToBytes('abc')).toThrow(/even number/);
  });
});
