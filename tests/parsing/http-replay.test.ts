import { describe, expect, it } from 'vitest';
import { parseHttpReplayTemplate } from '../../src/shared/parsing';

describe('http replay parser', () => {
  it('parses raw request and curl', () => {
    const raw = parseHttpReplayTemplate('GET /x HTTP/1.1\nHost: example.com\n\n');
    expect(raw.url).toBe('https://example.com/x');

    const curl = parseHttpReplayTemplate("curl -X POST 'https://api.example.com/v1' -H 'Authorization: Bearer x' -d '{\"a\":1}'");
    expect(curl.method).toBe('POST');
    expect(curl.url).toContain('api.example.com');
  });
});
