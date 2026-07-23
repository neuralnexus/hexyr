import { describe, expect, it } from 'vitest';
import { inspectBinaryStructure } from '../../src/shared/analysis';

function concat(...parts: number[][]): Uint8Array {
  return new Uint8Array(parts.flat());
}

function be32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

describe('binary structure inspector', () => {
  it('maps PNG chunks and IHDR metadata', () => {
    const ihdr = [
      ...be32(13),
      0x49,
      0x48,
      0x44,
      0x52,
      ...be32(16),
      ...be32(8),
      8,
      6,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ];
    const iend = [...be32(0), 0x49, 0x45, 0x4e, 0x44, 0, 0, 0, 0];
    const result = inspectBinaryStructure(
      concat([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], ihdr, iend),
    );

    expect(result.format).toBe('png');
    expect(result.metadata).toMatchObject({ width: 16, height: 8, chunks: 2 });
    expect(result.regions.map((region) => region.label)).toEqual([
      'PNG signature',
      'IHDR chunk',
      'IEND chunk',
    ]);
    expect(result.warnings).toEqual([]);
  });

  it('reports truncated PNG chunks without reading beyond the input', () => {
    const bytes = concat(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      [...be32(64), 0x49, 0x44, 0x41, 0x54, 1, 2, 3],
    );
    const result = inspectBinaryStructure(bytes);
    expect(result.warnings.join(' ')).toMatch(/beyond the end/i);
    expect(result.regions.at(-1)?.length).toBe(bytes.length - 8);
  });

  it('maps ZIP local entries and central directory records', () => {
    const name = Array.from(new TextEncoder().encode('a.txt'));
    const local = [
      0x50,
      0x4b,
      0x03,
      0x04,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      3,
      0,
      0,
      0,
      3,
      0,
      0,
      0,
      name.length,
      0,
      0,
      0,
      ...name,
      1,
      2,
      3,
    ];
    const eocd = [0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = inspectBinaryStructure(concat(local, eocd));
    expect(result.format).toBe('zip');
    expect(result.metadata.files).toBe(1);
    expect(result.regions[0].label).toBe('File: a.txt');
    expect(result.regions.at(-1)?.label).toBe('End of central directory');
  });

  it('recognizes ELF and PE headers safely', () => {
    const elf = new Uint8Array(64);
    elf.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0]);
    expect(inspectBinaryStructure(elf)).toMatchObject({
      format: 'elf',
      metadata: { class: 'ELF64', byteOrder: 'little-endian' },
    });

    const pe = new Uint8Array(128);
    pe.set([0x4d, 0x5a]);
    new DataView(pe.buffer).setUint32(0x3c, 64, true);
    pe.set([0x50, 0x45, 0, 0], 64);
    expect(inspectBinaryStructure(pe).format).toBe('pe');
  });

  it('returns an explicit unknown result for opaque bytes', () => {
    expect(inspectBinaryStructure(new Uint8Array([1, 2, 3]))).toMatchObject({
      format: 'unknown',
      regions: [],
    });
  });
});
