import { describe, expect, it } from 'vitest';
import {
  base64PaddingStatus,
  base64UrlHint,
  bytesFromBestEffort,
  computeStats,
  extractHexColors,
  getByteFrequency,
} from '../../src/shared/analysis';

describe('analysis helper coverage', () => {
  it('computes text stats', () => {
    const stats = computeStats('a\nb');
    expect(stats.charCount).toBe(3);
    expect(stats.lineCount).toBe(2);
    expect(stats.bitLength).toBe(stats.byteCount * 8);
  });

  it('reports base64 padding and hint', () => {
    expect(base64PaddingStatus('SGVsbG8=')).toMatch(/padding|needed/i);
    expect(base64UrlHint('SGVsbG8_')).toMatch(/base64url/i);
  });

  it('extracts unique hex colors', () => {
    const colors = extractHexColors('a #FFAA00 and #FFAA00 and #10203040');
    expect(colors).toEqual(['#FFAA00', '#10203040']);
  });

  it('computes byte frequency and best-effort bytes', () => {
    const freq = getByteFrequency(new Uint8Array([1, 1, 2]));
    expect(freq[0]).toEqual({ value: 1, count: 2 });
    expect(bytesFromBestEffort('SGVsbG8=').length).toBe(5);
  });
});
