import { describe, expect, it } from 'vitest';
import { runJmesPath, runJsonPath } from '../../src/shared/parsing';

const SAMPLE = JSON.stringify({ items: [{ id: 1 }, { id: 2 }], meta: { total: 2 } });

describe('query playground helpers', () => {
  it('runs JSONPath subset', () => {
    expect(runJsonPath(SAMPLE, '$.items.*.id')).toEqual([1, 2]);
  });

  it('runs JMESPath-like subset', () => {
    expect(runJmesPath(SAMPLE, 'items.*.id')).toEqual([1, 2]);
  });
});
