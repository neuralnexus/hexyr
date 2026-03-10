import { describe, expect, it } from 'vitest';
import { convertTimestamp } from '../../src/shared/parsing';

describe('timezone lab', () => {
  it('converts unix timestamp to multiple zones', () => {
    const result = convertTimestamp('1704067200', ['UTC', 'America/New_York']);
    expect(result.unixSeconds).toBe(1704067200);
    expect(result.zones.length).toBe(2);
  });
});
