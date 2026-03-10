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

  it('maps short aliases to canonical IANA zones', () => {
    const result = convertTimestamp('1704067200', ['PST', 'EST', 'LON', 'CST']);
    expect(result.zones.map((z) => z.zone)).toEqual([
      'America/Los_Angeles',
      'America/New_York',
      'Europe/London',
      'America/Chicago',
    ]);
  });

  it('supports additional common aliases', () => {
    const result = convertTimestamp('1704067200', ['UTC', 'HK', 'UAE', 'KOREA']);
    expect(result.zones.map((z) => z.zone)).toEqual(['UTC', 'Asia/Hong_Kong', 'Asia/Dubai', 'Asia/Seoul']);
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

  it('parses natural language single time expressions', () => {
    const result = convertTimestamp('noon India time', ['UTC', 'Asia/Kolkata']);
    expect(result.interpretedInput).toContain('Asia/Kolkata');
    expect(result.zones.length).toBe(2);
  });

  it('parses natural language time ranges', () => {
    const result = convertTimestamp('8-11am Pacific', ['America/Los_Angeles', 'UTC']);
    expect(result.range).toBeTruthy();
    expect(result.zones[0].rangeTime).toBeTruthy();
  });
});
