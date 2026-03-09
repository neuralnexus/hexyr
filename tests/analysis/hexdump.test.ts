import { describe, expect, it } from 'vitest';
import { formatHexdump } from '../../src/shared/analysis/hexdump';

describe('hexdump formatter', () => {
  it('formats offsets, bytes, and ascii preview', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x78, 0x79, 0x72]);
    const dump = formatHexdump(bytes, { bytesPerLine: 16, uppercase: true, offsetBase: 16 });
    expect(dump).toContain('00000000');
    expect(dump).toContain('48 65 78 79 72');
    expect(dump).toContain('Hexyr');
  });
});
