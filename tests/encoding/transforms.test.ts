import { describe, expect, it } from 'vitest';
import {
  base64ToText,
  bytesToText,
  htmlDecode,
  htmlEncode,
  inspectUnicode,
  textToBase64,
  textToBytes,
  urlDecode,
  urlEncode,
} from '../../src/shared/encoding';

describe('encoding transforms', () => {
  it('round-trips text/base64', () => {
    const b64 = textToBase64('hello world');
    expect(base64ToText(b64)).toBe('hello world');
  });

  it('encodes and decodes URL content', () => {
    const encoded = urlEncode('hello world?x=1&y=2');
    expect(encoded).toContain('%3F');
    expect(urlDecode(encoded)).toBe('hello world?x=1&y=2');
  });

  it('encodes and decodes HTML entities', () => {
    const encoded = htmlEncode('<a href="/">Matt & Team</a>');
    expect(encoded).toContain('&lt;');
    expect(htmlDecode(encoded)).toBe('<a href="/">Matt & Team</a>');
  });

  it('inspects unicode details', () => {
    const inspected = inspectUnicode('A🙂');
    expect(inspected.codePoints[0]).toBe('U+41');
    expect(inspected.codePoints[1]).toBe('U+1F642');
    expect(inspected.utf8Bytes.length).toBeGreaterThan(2);
  });

  it('converts text to bytes and back', () => {
    const bytes = textToBytes('Hexyr');
    expect(bytesToText(bytes)).toBe('Hexyr');
  });
});
