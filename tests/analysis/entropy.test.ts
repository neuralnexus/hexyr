import { describe, expect, it } from 'vitest';
import { detectMagicBytes, estimateEntropy } from '../../src/shared/analysis';

describe('analysis helpers', () => {
  it('computes low entropy for repeated bytes', () => {
    const bytes = new Uint8Array(100).fill(0x41);
    expect(estimateEntropy(bytes)).toBeLessThan(1);
  });

  it('detects PNG magic bytes', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(detectMagicBytes(png)?.name).toBe('PNG');
  });
});
