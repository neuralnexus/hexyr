export interface ToolDef {
  label: string;
  route: string;
  key: string;
  group: 'Core' | 'Inspect' | 'Crypto' | 'Utilities';
}

export const TOOL_DEFS: ToolDef[] = [
  { key: 'inspect', label: 'Universal Inspector', route: '/inspect', group: 'Inspect' },
  { key: 'diff', label: 'Diff Mode', route: '/tool/diff', group: 'Inspect' },
  { key: 'cert', label: 'X.509 Inspector', route: '/tool/cert', group: 'Inspect' },
  { key: 'query', label: 'JSON Query', route: '/tool/query', group: 'Inspect' },
  { key: 'bytes', label: 'CBOR/MsgPack/PB', route: '/tool/bytes', group: 'Inspect' },
  { key: 'pcap', label: 'PCAP-lite', route: '/tool/pcap', group: 'Inspect' },
  { key: 'hex', label: 'Hex', route: '/tool/hex', group: 'Core' },
  { key: 'base64', label: 'Base64', route: '/tool/base64', group: 'Core' },
  { key: 'binary', label: 'Binary', route: '/tool/binary', group: 'Core' },
  { key: 'url', label: 'URL', route: '/tool/url', group: 'Core' },
  { key: 'html', label: 'HTML Entities', route: '/tool/html', group: 'Core' },
  { key: 'unicode', label: 'Unicode', route: '/tool/unicode', group: 'Core' },
  { key: 'jwt', label: 'JWT Inspector', route: '/tool/jwt', group: 'Inspect' },
  { key: 'hexdump', label: 'Hexdump', route: '/tool/hexdump', group: 'Inspect' },
  { key: 'hash', label: 'Hash + HMAC', route: '/tool/hash', group: 'Crypto' },
  { key: 'signer', label: 'HTTP Signer', route: '/tool/signer', group: 'Crypto' },
  { key: 'bitwise', label: 'Bitwise + Byte', route: '/tool/bitwise', group: 'Utilities' },
];
