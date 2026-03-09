import { bytesToHex } from '../encoding';

export interface HexdumpOptions {
  bytesPerLine: number;
  uppercase: boolean;
  offsetBase: 10 | 16;
}

const PRINTABLE_MIN = 32;
const PRINTABLE_MAX = 126;

export function formatHexdump(input: Uint8Array, options: HexdumpOptions): string {
  const lines: string[] = [];

  for (let i = 0; i < input.length; i += options.bytesPerLine) {
    const slice = input.slice(i, i + options.bytesPerLine);
    const offset = options.offsetBase === 16 ? i.toString(16).padStart(8, '0') : i.toString(10);
    const hex = bytesToHex(slice, options.uppercase)
      .match(/.{1,2}/g)
      ?.join(' ') ?? '';
    const ascii = Array.from(slice)
      .map((byte) => (byte >= PRINTABLE_MIN && byte <= PRINTABLE_MAX ? String.fromCharCode(byte) : '.'))
      .join('');
    lines.push(`${offset}  ${hex.padEnd(options.bytesPerLine * 3 - 1, ' ')}  ${ascii}`);
  }

  return lines.join('\n');
}
