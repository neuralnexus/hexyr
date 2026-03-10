import { describe, expect, it } from 'vitest';
import { comparePayloads } from '../../src/shared/analysis';

describe('diff mode helper', () => {
  it('computes similarity and first diff', () => {
    const result = comparePayloads('48656c6c6f', '48656c7051', 'hex');
    expect(result.leftLength).toBe(5);
    expect(result.rightLength).toBe(5);
    expect(result.firstDiffOffset).toBeGreaterThanOrEqual(0);
    expect(result.preview.length).toBeGreaterThan(0);
  });
});
