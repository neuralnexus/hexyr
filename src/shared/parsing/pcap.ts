import { base64ToBytes, hexToBytes, isValidHex } from '../encoding';

export interface PcapPacketSummary {
  index: number;
  timestampSeconds: number;
  capturedLength: number;
  originalLength: number;
  ethernetType: string | null;
  srcIp: string | null;
  dstIp: string | null;
  protocol: string | null;
  srcPort: number | null;
  dstPort: number | null;
  payloadHexPreview: string;
}

export interface PcapLiteResult {
  packetCount: number;
  littleEndian: boolean;
  packets: PcapPacketSummary[];
}

function inputToBytes(input: string): Uint8Array {
  const trimmed = input.trim();
  if (!trimmed) return new Uint8Array();
  if (isValidHex(trimmed)) return hexToBytes(trimmed);
  try {
    return base64ToBytes(trimmed);
  } catch {
    return new TextEncoder().encode(trimmed);
  }
}

function readU16(bytes: Uint8Array, offset: number, little: boolean): number {
  if (offset + 2 > bytes.length) return 0;
  return little ? bytes[offset] | (bytes[offset + 1] << 8) : (bytes[offset] << 8) | bytes[offset + 1];
}

function readU32(bytes: Uint8Array, offset: number, little: boolean): number {
  if (offset + 4 > bytes.length) return 0;
  if (little) {
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
  }
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function parseIpv4Header(frame: Uint8Array): {
  srcIp: string | null;
  dstIp: string | null;
  protocol: string | null;
  srcPort: number | null;
  dstPort: number | null;
  payloadOffset: number;
} {
  if (frame.length < 34) {
    return { srcIp: null, dstIp: null, protocol: null, srcPort: null, dstPort: null, payloadOffset: 0 };
  }
  const ihl = (frame[14] & 0x0f) * 4;
  if (ihl < 20 || frame.length < 14 + ihl) {
    return { srcIp: null, dstIp: null, protocol: null, srcPort: null, dstPort: null, payloadOffset: 0 };
  }
  const protocolByte = frame[23];
  const srcIp = `${frame[26]}.${frame[27]}.${frame[28]}.${frame[29]}`;
  const dstIp = `${frame[30]}.${frame[31]}.${frame[32]}.${frame[33]}`;
  const l4 = 14 + ihl;
  let srcPort: number | null = null;
  let dstPort: number | null = null;
  let protocol: string | null = null;

  if (protocolByte === 6 && frame.length >= l4 + 4) {
    protocol = 'TCP';
    srcPort = (frame[l4] << 8) | frame[l4 + 1];
    dstPort = (frame[l4 + 2] << 8) | frame[l4 + 3];
  } else if (protocolByte === 17 && frame.length >= l4 + 4) {
    protocol = 'UDP';
    srcPort = (frame[l4] << 8) | frame[l4 + 1];
    dstPort = (frame[l4 + 2] << 8) | frame[l4 + 3];
  } else if (protocolByte === 1) {
    protocol = 'ICMP';
  }

  return {
    srcIp,
    dstIp,
    protocol,
    srcPort,
    dstPort,
    payloadOffset: l4,
  };
}

function toHexPreview(bytes: Uint8Array, limit = 24): string {
  return Array.from(bytes.slice(0, limit), (b) => b.toString(16).padStart(2, '0')).join(' ');
}

export function parsePcapLite(input: string): PcapLiteResult {
  const bytes = inputToBytes(input);
  if (bytes.length < 24) {
    throw new Error('Input too short for PCAP global header');
  }

  const magic = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const littleEndian = magic === 0xa1b2c3d4;
  const bigEndian = magic === 0xd4c3b2a1;
  if (!littleEndian && !bigEndian) {
    throw new Error('Unsupported PCAP magic bytes (expect classic PCAP)');
  }

  const le = littleEndian;
  const packets: PcapPacketSummary[] = [];
  let cursor = 24;
  let index = 0;
  while (cursor + 16 <= bytes.length && packets.length < 512) {
    const tsSec = readU32(bytes, cursor, le);
    const inclLen = readU32(bytes, cursor + 8, le);
    const origLen = readU32(bytes, cursor + 12, le);
    cursor += 16;
    if (inclLen === 0 || cursor + inclLen > bytes.length) {
      break;
    }
    const frame = bytes.slice(cursor, cursor + inclLen);
    cursor += inclLen;

    const etherType = frame.length >= 14 ? readU16(frame, 12, false).toString(16).padStart(4, '0') : null;
    let srcIp: string | null = null;
    let dstIp: string | null = null;
    let protocol: string | null = null;
    let srcPort: number | null = null;
    let dstPort: number | null = null;
    let payloadHexPreview = toHexPreview(frame);

    if (etherType === '0800') {
      const ipv4 = parseIpv4Header(frame);
      srcIp = ipv4.srcIp;
      dstIp = ipv4.dstIp;
      protocol = ipv4.protocol;
      srcPort = ipv4.srcPort;
      dstPort = ipv4.dstPort;
      payloadHexPreview = toHexPreview(frame.slice(ipv4.payloadOffset));
    }

    packets.push({
      index,
      timestampSeconds: tsSec,
      capturedLength: inclLen,
      originalLength: origLen,
      ethernetType: etherType,
      srcIp,
      dstIp,
      protocol,
      srcPort,
      dstPort,
      payloadHexPreview,
    });
    index += 1;
  }

  return {
    packetCount: packets.length,
    littleEndian: le,
    packets,
  };
}
