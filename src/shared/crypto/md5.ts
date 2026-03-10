function leftRotate(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c));
}

function toWordArray(input: Uint8Array): number[] {
  const bitLen = input.length * 8;
  const withPaddingLen = (((input.length + 8) >> 6) + 1) * 64;
  const padded = new Uint8Array(withPaddingLen);
  padded.set(input);
  padded[input.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(withPaddingLen - 8, bitLen >>> 0, true);
  view.setUint32(withPaddingLen - 4, Math.floor(bitLen / 0x100000000), true);

  const words: number[] = [];
  for (let i = 0; i < withPaddingLen; i += 4) {
    words.push(view.getUint32(i, true));
  }
  return words;
}

function toHexLE(num: number): string {
  const b0 = num & 0xff;
  const b1 = (num >>> 8) & 0xff;
  const b2 = (num >>> 16) & 0xff;
  const b3 = (num >>> 24) & 0xff;
  return [b0, b1, b2, b3].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const words = toWordArray(bytes);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let i = 0; i < words.length; i += 16) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let j = 0; j < 64; j += 1) {
      let f: number;
      let g: number;

      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      const sum = (a + f + K[j] + words[i + g]) >>> 0;
      b = (b + leftRotate(sum, S[j])) >>> 0;
      a = temp;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return `${toHexLE(a0)}${toHexLE(b0)}${toHexLE(c0)}${toHexLE(d0)}`;
}
