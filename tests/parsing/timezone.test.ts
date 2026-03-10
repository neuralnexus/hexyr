import { describe, expect, it } from 'vitest';
import { convertTimestamp, getPopularTimezones } from '../../src/shared/parsing';

describe('timezone lab', () => {
  it('converts unix timestamp to multiple zones', () => {
    const result = convertTimestamp('1704067200', ['UTC', 'America/New_York']);
    expect(result.unixSeconds).toBe(1704067200);
    expect(result.zones.length).toBe(2);
  });

  it('supports timezone aliases like IST, CET, Ukraine, and New Zealand', () => {
    const result = convertTimestamp('1704067200', ['IST', 'CET', 'Ukraine', 'New Zealand']);
    expect(result.zones.map((z) => z.zone)).toEqual(['IST', 'CET', 'Ukraine', 'New Zealand']);
  });

  it('includes requested presets in popular timezone defaults', () => {
    const zones = getPopularTimezones();
    expect(zones).toContain('IST');
    expect(zones).toContain('CET');
    expect(zones).toContain('Ukraine');
    expect(zones).toContain('New Zealand');
  });
});
