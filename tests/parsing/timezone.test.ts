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
    expect(result.zones.map((z) => z.zone)).toEqual([
      'Asia/Kolkata',
      'Europe/Berlin',
      'Europe/Kyiv',
      'Pacific/Auckland',
    ]);
  });

  it('includes requested presets in popular timezone defaults', () => {
    const zones = getPopularTimezones();
    expect(zones).toContain('Asia/Kolkata');
    expect(zones).toContain('Europe/Berlin');
    expect(zones).toContain('Europe/Kyiv');
    expect(zones).toContain('Pacific/Auckland');
    expect(zones).toContain('Asia/Dubai');
    expect(zones).toContain('Australia/Sydney');
    expect(zones).toContain('Asia/Hong_Kong');
    expect(zones).toContain('America/Chicago');
    expect(zones).toContain('Asia/Seoul');
  });
});
