import { describe, expect, it } from 'vitest';
import {
  buildBinaryDiffRows,
  compareByteArrays,
  comparePayloads,
  decodeDiffPayload,
} from '../../src/shared/analysis';

describe('diff mode helper', () => {
  it('computes similarity and first diff', () => {
    const result = comparePayloads('48656c6c6f', '48656c7051', 'hex');
    expect(result.leftLength).toBe(5);
    expect(result.rightLength).toBe(5);
    expect(result.firstDiffOffset).toBe(3);
    expect(result.changedBytes).toBe(2);
    expect(result.runs.map((run) => run.status)).toEqual(['equal', 'changed']);
    expect(result.preview.length).toBeGreaterThan(0);
  });

  it('distinguishes changed and one-sided bytes', () => {
    const result = compareByteArrays(
      new Uint8Array([1, 2, 3, 4]),
      new Uint8Array([1, 9, 3, 4, 5]),
    );
    expect(result).toMatchObject({
      equalBytes: 3,
      changedBytes: 1,
      rightOnlyBytes: 1,
      leftOnlyBytes: 0,
      firstDiffOffset: 1,
    });
    expect(result.changeOffsets).toEqual([1, 4]);
  });

  it('rejects malformed explicit encodings instead of silently treating them as text', () => {
    expect(() => decodeDiffPayload('not hex', 'hex')).toThrow(/complete byte pairs/i);
    expect(() => decodeDiffPayload('zz11', 'hex')).toThrow(/non-hex/i);
    expect(() => decodeDiffPayload('***', 'base64')).toThrow(/malformed/i);
  });

  it('builds synchronized addressable rows', () => {
    const rows = buildBinaryDiffRows(
      new Uint8Array([1, 2]),
      new Uint8Array([1, 3, 4]),
      0,
      3,
      2,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].cells[1]).toMatchObject({
      offset: 1,
      left: 2,
      right: 3,
      status: 'changed',
    });
    expect(rows[1].cells[0].status).toBe('right-only');
  });
});
