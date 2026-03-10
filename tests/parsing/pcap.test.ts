import { describe, expect, it } from 'vitest';
import { parsePcapLite } from '../../src/shared/parsing';

function samplePcapHex(): string {
  const globalHeader =
    'a1b2c3d4' + // magic
    '0200' + // major
    '0400' + // minor
    '00000000' + // thiszone
    '00000000' + // sigfigs
    'ffff0000' + // snaplen
    '01000000'; // linktype ethernet

  const packetHeader =
    '01000000' + // ts sec
    '00000000' + // ts usec
    '2a000000' + // incl len (42)
    '2a000000'; // orig len

  const frame =
    'ffffffffffff0011223344550800' + // ethernet + ipv4 ethertype
    '4500001c0000000040110000' + // ipv4 header (protocol UDP)
    'c0a80101c0a80102' + // src/dst ip
    '1f90003500080000'; // udp header

  return globalHeader + packetHeader + frame;
}

describe('pcap lite parser', () => {
  it('extracts packet summaries from basic pcap', () => {
    const parsed = parsePcapLite(samplePcapHex());
    expect(parsed.packetCount).toBe(1);
    expect(parsed.packets[0].srcIp).toBe('192.168.1.1');
    expect(parsed.packets[0].dstIp).toBe('192.168.1.2');
    expect(parsed.packets[0].protocol).toBe('UDP');
  });
});
