import { base64ToBytes, bytesToBase64, bytesToText, textToBytes } from '../encoding';
import pako from 'pako';

export type CompressionFormat = 'gzip' | 'deflate' | 'brotli';
export type RuntimeCompressionFormat = 'gzip' | 'deflate';

function hasCompressionStream(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

async function runStream(
  input: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  await writer.write(input as unknown as BufferSource);
  await writer.close();
  const response = new Response(stream.readable);
  const arr = await response.arrayBuffer();
  return new Uint8Array(arr);
}

function resolveFormat(format: CompressionFormat): 'gzip' | 'deflate' | 'deflate-raw' {
  if (format === 'brotli') {
    return 'deflate';
  }
  return format;
}

export function getSupportedCompressionFormats(): RuntimeCompressionFormat[] {
  if (!hasCompressionStream()) {
    return ['gzip', 'deflate'];
  }
  const supported: RuntimeCompressionFormat[] = [];
  (['gzip', 'deflate'] as const).forEach((format) => {
    try {
      void new CompressionStream(format);
      void new DecompressionStream(format);
      supported.push(format);
    } catch {
      // unsupported format
    }
  });
  return supported;
}

export async function compressText(input: string, format: CompressionFormat): Promise<string> {
  if (format === 'brotli') {
    throw new Error('Brotli compression is not supported in this MVP runtime path.');
  }
  if (!hasCompressionStream()) {
    const bytes = textToBytes(input);
    const compressed = format === 'gzip' ? pako.gzip(bytes) : pako.deflate(bytes);
    return bytesToBase64(compressed);
  }
  const stream = new CompressionStream(resolveFormat(format));
  const result = await runStream(textToBytes(input), stream);
  return bytesToBase64(result);
}

export async function decompressBase64(input: string, format: CompressionFormat): Promise<string> {
  if (format === 'brotli') {
    throw new Error('Brotli decompression is not supported in this MVP runtime path.');
  }
  if (!hasCompressionStream()) {
    const bytes = base64ToBytes(input);
    const decompressed = format === 'gzip' ? pako.ungzip(bytes) : pako.inflate(bytes);
    return bytesToText(decompressed);
  }
  const stream = new DecompressionStream(resolveFormat(format));
  const bytes = base64ToBytes(input);
  const result = await runStream(bytes, stream);
  return bytesToText(result);
}

export async function decompressBase64Auto(input: string): Promise<{ format: RuntimeCompressionFormat; text: string }> {
  const bytes = base64ToBytes(input);
  const detected = detectCompression(bytes);
  const order: RuntimeCompressionFormat[] =
    detected === 'gzip' ? ['gzip', 'deflate'] : detected === 'deflate' ? ['deflate', 'gzip'] : ['gzip', 'deflate'];

  let lastError: Error | null = null;
  for (const fmt of order) {
    try {
      const text = await decompressBase64(input, fmt);
      return { format: fmt, text };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown decompression error');
    }
  }

  throw lastError ?? new Error('Unable to decompress payload as gzip or deflate');
}

export function detectCompression(bytes: Uint8Array): CompressionFormat | 'unknown' {
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return 'gzip';
  }
  if (bytes.length >= 2 && bytes[0] === 0x78) {
    return 'deflate';
  }
  return 'unknown';
}
