import { describe, expect, it } from 'vitest';
import { explainHexDump, suggestDecodingStrategies } from '../../src/shared/explainers';

describe('deterministic explainers', () => {
  it('explains odd-length hex', () => {
    expect(explainHexDump('abc')).toMatch(/odd length/i);
  });

  it('suggests strategies from format heuristics', () => {
    expect(suggestDecodingStrategies('SGVsbG8=')).toMatch(/base64/i);
    expect(suggestDecodingStrategies('01000001')).toMatch(/binary/i);
  });
});
