import { describe, expect, it } from 'vitest';
import { inspectBytes } from '../../src/shared/analysis';

describe('byte inspectors', () => {
  it('returns heuristic output for compact binary bytes', () => {
    const inspected = inspectBytes('82a1616101');
    expect(inspected.cbor.length).toBeGreaterThan(0);
    expect(inspected.messagePack.length).toBeGreaterThan(0);
    expect(inspected.protobuf.length).toBeGreaterThan(0);
  });
});
