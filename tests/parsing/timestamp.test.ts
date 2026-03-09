import { describe, expect, it } from 'vitest';
import { intToIpv4, ipv4ToInt, isoToUnix, unixToIso } from '../../src/shared/parsing';

describe('timestamp and network parsing', () => {
  it('converts unix to iso and back', () => {
    const unix = 1_700_000_000;
    const iso = unixToIso(unix);
    expect(isoToUnix(iso)).toBe(unix);
  });

  it('converts ipv4 and integer', () => {
    expect(ipv4ToInt('127.0.0.1')).toBe(2130706433);
    expect(intToIpv4(2130706433)).toBe('127.0.0.1');
  });
});
