import { describe, expect, it } from 'vitest';
import { binaryToBytes, bytesToBinary } from '../../src/shared/encoding';

describe('binary validation', () => {
  it('parses valid byte groups', () => {
    const bytes = binaryToBytes('01000001 01000010');
    expect(bytes[0]).toBe(65);
    expect(bytes[1]).toBe(66);
    expect(bytesToBinary(bytes)).toBe('01000001 01000010');
  });

  it('throws on malformed binary', () => {
    expect(() => binaryToBytes('01012')).toThrow(/groups of 8/);
  });
});
