import { describe, expect, it } from 'vitest';
import { validateJsonSchemaSimple, validateOpenApiSnippet } from '../../src/shared/parsing';

describe('schema validators', () => {
  it('validates json schema required fields', () => {
    const errors = validateJsonSchemaSimple('{"a":1}', '{"required":["a","b"]}');
    expect(errors.some((x) => x.includes('b'))).toBe(true);
  });

  it('validates openapi snippet basics', () => {
    const errors = validateOpenApiSnippet('{"openapi":"3.0.0","info":{},"paths":{}}');
    expect(errors.length).toBe(0);
  });
});
