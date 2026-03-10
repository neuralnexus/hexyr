export function unixToIso(timestamp: number): string {
  const ts = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(ts).toISOString();
}

export function isoToUnix(input: string): number {
  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) {
    throw new Error('Invalid date input');
  }
  return Math.floor(parsed / 1000);
}

export function ipv4ToInt(ipv4: string): number {
  const chunks = ipv4.split('.').map((x) => Number.parseInt(x, 10));
  if (chunks.length !== 4 || chunks.some((x) => Number.isNaN(x) || x < 0 || x > 255)) {
    throw new Error('Invalid IPv4 input');
  }
  return ((chunks[0] << 24) | (chunks[1] << 16) | (chunks[2] << 8) | chunks[3]) >>> 0;
}

export function intToIpv4(input: number): string {
  if (!Number.isInteger(input) || input < 0 || input > 0xffffffff) {
    throw new Error('Integer out of IPv4 range');
  }
  return [
    (input >>> 24) & 255,
    (input >>> 16) & 255,
    (input >>> 8) & 255,
    input & 255,
  ].join('.');
}

export * from './jwt';
export * from './cert';
export * from './query';
export * from './pcap';
export * from './tls';
export * from './asn1';
export * from './http-replay';
export * from './regex-extract';
export * from './schema';
export * from './dns';
export * from './har';
export * from './cookies';
export * from './ids';
export * from './timezone';
export * from './policy';
export * from './format';
