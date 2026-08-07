import { describe, expect, it } from 'vitest';
import {
  buildHexdumpRows,
  decodeByteInput,
  findByteSequence,
  formatHexdump,
  getByteColorToken,
  summarizeBytes,
} from '../../src/shared/analysis/hexdump';

describe('hexdump formatter', () => {
  it('formats offsets, bytes, and ascii preview', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x78, 0x79, 0x72]);
    const dump = formatHexdump(bytes, { bytesPerLine: 16, uppercase: true, offsetBase: 16 });
    expect(dump).toContain('00000000');
    expect(dump).toContain('48 65 78 79 72');
    expect(dump).toContain('Hexyr');
  });

  it('builds addressable rows for rich rendering', () => {
    const rows = buildHexdumpRows(new Uint8Array([0, 0x41, 0xff]), {
      bytesPerLine: 2,
      uppercase: false,
      offsetBase: 16,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].cells[1]).toMatchObject({
      index: 1,
      ascii: 'A',
      hex: '41',
      nibble: '4',
      semanticGroup: 'printable',
    });
    expect(rows[1].offsetLabel).toBe('00000002');
  });

  it('rejects invalid line widths', () => {
    expect(() =>
      buildHexdumpRows(new Uint8Array([1]), {
        bytesPerLine: 0,
        uppercase: false,
        offsetBase: 16,
      }),
    ).toThrow(/positive integer/i);
  });
});

describe('hexdump input decoding', () => {
  it('supports explicit encodings without relying on heuristics', () => {
    expect(Array.from(decodeByteInput('4869', 'hex').bytes)).toEqual([0x48, 0x69]);
    expect(Array.from(decodeByteInput('SGk=', 'base64').bytes)).toEqual([0x48, 0x69]);
    expect(Array.from(decodeByteInput('01001000', 'binary').bytes)).toEqual([0x48]);
    expect(Array.from(decodeByteInput('4869', 'text').bytes)).toEqual([0x34, 0x38, 0x36, 0x39]);
  });

  it('reports the encoding selected by auto detection', () => {
    expect(decodeByteInput('de ad be ef', 'auto').detectedEncoding).toBe('hex');
    expect(decodeByteInput('01001000', 'auto').detectedEncoding).toBe('binary');
    expect(decodeByteInput('hello', 'auto').detectedEncoding).toBe('text');
  });
});

describe('hexdump analysis helpers', () => {
  it('summarizes entropy and byte distribution', () => {
    const summary = summarizeBytes(new Uint8Array([0, 0, 0x41, 0xff]));
    expect(summary).toMatchObject({
      byteCount: 4,
      nullCount: 2,
      printableCount: 1,
      uniqueCount: 3,
    });
    expect(summary.mostCommon[0]).toEqual({ value: 0, count: 2 });
  });

  it('finds overlapping byte sequences', () => {
    expect(findByteSequence(new Uint8Array([1, 1, 1]), new Uint8Array([1, 1]))).toEqual([0, 1]);
  });

  it('uses special tokens for null and ff bytes', () => {
    expect(getByteColorToken(0, 'nibble')).toBe('var(--byte-00)');
    expect(getByteColorToken(0xff, 'nibble')).toBe('var(--byte-ff)');
    expect(getByteColorToken(0x41, 'nibble')).toBe('var(--byte-4)');
    expect(getByteColorToken(0x41, 'none')).toBeNull();
  });
});
