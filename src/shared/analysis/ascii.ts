export type AsciiTextFont = 'block' | 'slant' | 'shadow' | 'outline' | 'double' | 'mini';

export interface AsciiTextOptions {
  font?: AsciiTextFont;
  onChar?: string;
  offChar?: string;
}

export interface AsciiImageOptions {
  charset?: string;
  invert?: boolean;
}

const GLYPHS: Record<string, string[]> = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '#  ##', '#   #', ' ####'],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['#####', '   # ', '   # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '#   #', '#  ##', ' ####'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  '0': [' ### ', '#  ##', '# # #', '##  #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '   # ', '  #  ', '#####'],
  '3': ['#### ', '    #', ' ### ', '    #', '#### '],
  '4': ['#   #', '#   #', '#####', '    #', '    #'],
  '5': ['#####', '#    ', '#### ', '    #', '#### '],
  '6': [' ### ', '#    ', '#### ', '#   #', ' ### '],
  '7': ['#####', '   # ', '  #  ', ' #   ', '#    '],
  '8': [' ### ', '#   #', ' ### ', '#   #', ' ### '],
  '9': [' ### ', '#   #', ' ####', '    #', ' ### '],
  '?': [' ### ', '#   #', '  ## ', '     ', '  #  '],
  '!': ['  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '.': ['     ', '     ', '     ', '     ', '  #  '],
  '-': ['     ', '     ', ' ### ', '     ', '     '],
  ':': ['     ', '  #  ', '     ', '  #  ', '     '],
  '/': ['    #', '   # ', '  #  ', ' #   ', '#    '],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

function glyphFor(char: string): string[] {
  return GLYPHS[char] ?? GLYPHS['?'];
}

function blockText(input: string, onChar: string, offChar: string): string {
  const chars = input.toUpperCase().split('');
  const rows = Array.from({ length: 5 }, () => '');
  for (const char of chars) {
    const glyph = glyphFor(char);
    for (let i = 0; i < 5; i += 1) {
      const mapped = glyph[i].replace(/#/g, onChar).replace(/ /g, offChar);
      rows[i] += `${mapped}${offChar}`;
    }
  }
  return rows.join('\n').replace(/\s+$/gm, '');
}

function applySlant(block: string): string {
  return block
    .split('\n')
    .map((line, idx) => `${' '.repeat(idx)}${line}`)
    .join('\n');
}

function applyDouble(block: string): string {
  return block
    .split('\n')
    .map((line) => line.split('').map((char) => char + char).join(''))
    .join('\n');
}

function applyShadow(block: string, shadowChar: string): string {
  const lines = block.split('\n');
  const width = Math.max(...lines.map((line) => line.length));
  const out = lines.map((line) => line.padEnd(width, ' ').split(''));
  for (let y = lines.length - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      if (out[y][x] !== ' ') {
        if (y + 1 < out.length && x + 1 < width && out[y + 1][x + 1] === ' ') out[y + 1][x + 1] = shadowChar;
      }
    }
  }
  return out.map((line) => line.join('')).join('\n');
}

function applyOutline(block: string, outlineChar: string): string {
  const lines = block.split('\n');
  const width = Math.max(...lines.map((line) => line.length));
  const grid = lines.map((line) => line.padEnd(width, ' ').split(''));
  const out = grid.map((line) => [...line]);
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (grid[y][x] !== ' ') continue;
      const near = deltas.some(([dy, dx]) => {
        const ny = y + dy;
        const nx = x + dx;
        return ny >= 0 && ny < grid.length && nx >= 0 && nx < width && grid[ny][nx] !== ' ';
      });
      if (near) out[y][x] = outlineChar;
    }
  }
  return out.map((line) => line.join('')).join('\n');
}

export function generateAsciiText(input: string, options: AsciiTextOptions = {}): string {
  const onChar = (options.onChar ?? '#')[0] ?? '#';
  const offChar = (options.offChar ?? ' ')[0] ?? ' ';
  const font = options.font ?? 'block';

  if (font === 'mini') {
    return input
      .split('')
      .map((char) => (char === ' ' ? '  ' : `${onChar}${char.toUpperCase()}`))
      .join(' ');
  }

  const base = blockText(input, onChar, offChar);
  if (font === 'slant') return applySlant(base);
  if (font === 'double') return applyDouble(base);
  if (font === 'shadow') return applyShadow(base, '.');
  if (font === 'outline') return applyOutline(base, onChar);
  return base;
}

export function imageDataToAscii(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: AsciiImageOptions = {},
): string {
  const charset = options.charset && options.charset.length > 0 ? options.charset : ' .:-=+*#%@';
  const invert = options.invert ?? false;

  const lines: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let row = '';
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3] / 255;
      const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) * a;
      const normalized = invert ? luma : 255 - luma;
      const charIdx = Math.max(0, Math.min(charset.length - 1, Math.round((normalized / 255) * (charset.length - 1))));
      row += charset[charIdx];
    }
    lines.push(row);
  }
  return lines.join('\n');
}
