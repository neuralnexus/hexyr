import { describe, expect, it } from 'vitest';
import {
  parseRecipeDefinition,
  runRecipe,
  serializeRecipeDefinition,
} from '../../src/shared/analysis';

describe('local recipe pipeline', () => {
  it('runs deterministic multi-step transforms with an audit trace', () => {
    const result = runRecipe(' { "hello": "world" } ', ['trim', 'json-minify', 'base64url-encode']);
    expect(result.error).toBeNull();
    expect(result.output).toBe('eyJoZWxsbyI6IndvcmxkIn0');
    expect(result.trace.map((step) => step.operation)).toEqual([
      'trim',
      'json-minify',
      'base64url-encode',
    ]);
  });

  it('round-trips compressed UTF-8 content', () => {
    const encoded = runRecipe('Hello, 世界!', ['gzip-base64']);
    expect(encoded.error).toBeNull();
    const decoded = runRecipe(encoded.output, ['gunzip-base64']);
    expect(decoded.output).toBe('Hello, 世界!');
  });

  it('stops at the failing step without running later transforms', () => {
    const result = runRecipe('not-json', ['json-format', 'base64-encode']);
    expect(result.failedStep).toBe(0);
    expect(result.trace).toEqual([]);
    expect(result.error).toMatch(/json format/i);
    expect(runRecipe('zz41', ['hex-decode']).error).toMatch(/non-hex/i);
  });

  it('validates portable versioned recipe definitions', () => {
    const definition = parseRecipeDefinition(
      '{"version":1,"name":"Decode","steps":["base64-decode","json-format"]}',
    );
    expect(definition.steps).toEqual(['base64-decode', 'json-format']);
    expect(parseRecipeDefinition(serializeRecipeDefinition(definition))).toEqual(definition);
    expect(() => parseRecipeDefinition('{"version":2,"name":"Future","steps":[]}')).toThrow(
      /version/i,
    );
    expect(() =>
      parseRecipeDefinition('{"version":1,"name":"Unsafe","steps":["execute"]}'),
    ).toThrow(/unsupported/i);
  });
});
