import { describe, expect, it } from 'vitest';
import { parseAsn1 } from '../../src/shared/parsing';

describe('asn1 parser', () => {
  it('parses simple sequence', () => {
    const nodes = parseAsn1('3003020105');
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0].constructed).toBe(true);
    expect(nodes[0].children.length).toBeGreaterThan(0);
  });
});
