import { describe, expect, it } from 'vitest';
import { detectCompression } from '../../src/shared/analysis';

describe('compression helper detection', () => {
  it('detects gzip and deflate signatures', () => {
    expect(detectCompression(new Uint8Array([0x1f, 0x8b, 0x08]))).toBe('gzip');
    expect(detectCompression(new Uint8Array([0x78, 0x9c, 0x01]))).toBe('deflate');
    expect(detectCompression(new Uint8Array([0, 1, 2]))).toBe('unknown');
  });
});
