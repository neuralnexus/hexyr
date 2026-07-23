const BLOCKED_HOST_SUFFIXES = [
  'localhost',
  '.localhost',
  '.local',
  '.internal',
  '.home',
  '.lan',
  '.onion',
  '.invalid',
  '.test',
];

function parseIpv4(value: string): number[] | null {
  const parts = value.split('.');
  if (
    parts.length !== 4 ||
    parts.some(
      (part) =>
        !/^(0|[1-9]\d{0,2})$/.test(part) ||
        Number.parseInt(part, 10) < 0 ||
        Number.parseInt(part, 10) > 255,
    )
  ) {
    return null;
  }
  return parts.map((part) => Number.parseInt(part, 10));
}

export function isIpv4(value: string): boolean {
  return parseIpv4(value) !== null;
}

export function isPublicIpv4(value: string): boolean {
  const parts = parseIpv4(value);
  if (!parts) return false;
  const [a, b, c, d] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a === 255 && b === 255 && c === 255 && d === 255) return false;
  return true;
}

export function isPublicIpv6(value: string): boolean {
  const normalized = value
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .split('%')[0];
  if (!normalized.includes(':')) return false;
  if (normalized === '::' || normalized === '::1') return false;
  if (/^f[cd]/.test(normalized)) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  if (normalized.startsWith('ff')) return false;
  if (normalized.startsWith('::ffff:')) return false;
  if (normalized.startsWith('2001:db8:')) return false;
  if (normalized.startsWith('100:')) return false;
  return /^[0-9a-f:]+$/.test(normalized);
}

function validateHostname(hostname: string): void {
  if (!hostname || hostname.length > 253) throw new Error('Target hostname is invalid.');
  if (hostname.includes(':')) throw new Error('IPv6 literals are not supported by this probe.');
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(suffix))) {
    throw new Error('Local and private hostnames are not allowed.');
  }
  if (isIpv4(hostname)) {
    if (!isPublicIpv4(hostname))
      throw new Error('Private and reserved IP addresses are not allowed.');
    return;
  }
  if (!hostname.includes('.')) throw new Error('Target must be a fully qualified public hostname.');
  const labels = hostname.split('.');
  if (
    labels.some(
      (label) =>
        !label || label.length > 63 || !/^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/i.test(label),
    )
  ) {
    throw new Error('Target hostname contains an invalid label.');
  }
}

export function normalizeNetworkTarget(raw: string): string {
  const trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed.length > 2048 ||
    Array.from(trimmed).some((character) => {
      const code = character.charCodeAt(0);
      return code < 0x20 || code === 0x7f;
    }) ||
    /\s/.test(trimmed)
  ) {
    throw new Error('Target is missing or malformed.');
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error('Only HTTP and HTTPS target URLs are accepted.');
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error('Target is not a valid hostname or URL.');
  }
  if (url.username || url.password) throw new Error('Target URLs may not contain credentials.');
  if (url.port) throw new Error('Custom target ports are not allowed.');
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  validateHostname(hostname);
  return hostname;
}

export function assertSafeOutboundUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Probe URL is malformed.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS probes are allowed.');
  }
  if (url.username || url.password) throw new Error('Probe URLs may not contain credentials.');
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new Error('Only standard HTTP and HTTPS ports are allowed.');
  }
  validateHostname(url.hostname.toLowerCase().replace(/\.$/, ''));
  return url;
}

export function reverseIpv4(value: string): string {
  if (!isIpv4(value)) throw new Error('A valid IPv4 address is required.');
  return value.split('.').reverse().join('.');
}
