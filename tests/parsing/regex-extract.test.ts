import { describe, expect, it } from 'vitest';
import { extractStructuredWithRegex } from '../../src/shared/parsing';

describe('regex extractor', () => {
  it('extracts named groups', () => {
    const result = extractStructuredWithRegex('user=alice ip=10.0.0.1', 'user=(?<u>\\w+) ip=(?<ip>[0-9.]+)');
    expect(result.matches[0]).toEqual({ u: 'alice', ip: '10.0.0.1' });
  });
});
