import { describe, expect, it } from 'vitest';
import { formatZoneFile, parseZoneFile } from '../../src/shared/parsing';

describe('dns toolkit', () => {
  it('parses basic zone records and ttl warnings', () => {
    const result = parseZoneFile('$TTL 20\n@ IN A 192.0.2.10');
    expect(result.records.length).toBe(1);
    expect(result.warnings.some((x) => x.includes('very low'))).toBe(true);
  });

  it('formats records back into zone text', () => {
    const parsed = parseZoneFile('$ORIGIN example.com.\n$TTL 300\nwww IN A 192.0.2.2');
    const text = formatZoneFile(parsed.records, parsed.origin, parsed.defaultTtl);
    expect(text).toContain('$ORIGIN example.com.');
    expect(text).toContain('www IN A 192.0.2.2');
  });
});
