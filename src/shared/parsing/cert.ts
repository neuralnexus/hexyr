import { base64ToBytes, bytesToHex, toArrayBuffer } from '../encoding';

export interface CertificateInfo {
  subjectCommonName: string | null;
  issuerCommonName: string | null;
  notBefore: string | null;
  notAfter: string | null;
  sanDns: string[];
  sanIp: string[];
  sanEmail: string[];
  sha256: string;
  sha1: string;
}

function toPemBlocks(input: string): string[] {
  const matches = input.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g);
  if (!matches) {
    return [];
  }
  return matches.map((block) =>
    block
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\s+/g, ''),
  );
}

function parseAsnLength(data: Uint8Array, offset: number): { length: number; read: number } {
  const first = data[offset];
  if ((first & 0x80) === 0) {
    return { length: first, read: 1 };
  }
  const count = first & 0x7f;
  let length = 0;
  for (let i = 0; i < count; i += 1) {
    length = (length << 8) | data[offset + 1 + i];
  }
  return { length, read: count + 1 };
}

function parseGeneralizedTime(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 10) {
    return null;
  }
  if (trimmed.endsWith('Z')) {
    if (trimmed.length === 13) {
      const year = Number.parseInt(trimmed.slice(0, 2), 10);
      const fullYear = year >= 50 ? 1900 + year : 2000 + year;
      return `${fullYear}-${trimmed.slice(2, 4)}-${trimmed.slice(4, 6)}T${trimmed.slice(6, 8)}:${trimmed.slice(8, 10)}:${trimmed.slice(10, 12)}Z`;
    }
    if (trimmed.length === 15) {
      return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}T${trimmed.slice(8, 10)}:${trimmed.slice(10, 12)}:${trimmed.slice(12, 14)}Z`;
    }
  }
  return null;
}

function decodePrintable(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function findCnValues(der: Uint8Array): string[] {
  const out: string[] = [];
  for (let i = 0; i < der.length - 6; i += 1) {
    if (der[i] === 0x06 && der[i + 1] === 0x03 && der[i + 2] === 0x55 && der[i + 3] === 0x04 && der[i + 4] === 0x03) {
      const strTag = der[i + 5];
      if ([0x0c, 0x13, 0x16].includes(strTag)) {
        const { length, read } = parseAsnLength(der, i + 6);
        const valueStart = i + 6 + read;
        const valueEnd = valueStart + length;
        if (valueEnd <= der.length) {
          out.push(decodePrintable(der.slice(valueStart, valueEnd)));
        }
      }
    }
  }
  return out;
}

function findValidity(der: Uint8Array): { notBefore: string | null; notAfter: string | null } {
  const times: string[] = [];
  for (let i = 0; i < der.length - 2; i += 1) {
    if (der[i] === 0x17 || der[i] === 0x18) {
      const { length, read } = parseAsnLength(der, i + 1);
      const valueStart = i + 1 + read;
      const valueEnd = valueStart + length;
      if (valueEnd <= der.length) {
        const raw = decodePrintable(der.slice(valueStart, valueEnd));
        const iso = parseGeneralizedTime(raw);
        if (iso) {
          times.push(iso);
        }
      }
    }
    if (times.length >= 2) {
      break;
    }
  }
  return {
    notBefore: times[0] ?? null,
    notAfter: times[1] ?? null,
  };
}

function findSubjectAltNames(der: Uint8Array): { dns: string[]; ip: string[]; email: string[] } {
  const dns: string[] = [];
  const ip: string[] = [];
  const email: string[] = [];

  for (let i = 0; i < der.length - 8; i += 1) {
    if (der[i] === 0x06 && der[i + 1] === 0x03 && der[i + 2] === 0x55 && der[i + 3] === 0x1d && der[i + 4] === 0x11) {
      let cursor = i + 5;
      if (der[cursor] === 0x01) {
        const criticalLen = der[cursor + 1];
        cursor += 2 + criticalLen;
      }
      if (der[cursor] !== 0x04) {
        continue;
      }
      const outerLen = der[cursor + 1];
      const outerStart = cursor + 2;
      const outerEnd = outerStart + outerLen;
      if (outerEnd > der.length || der[outerStart] !== 0x30) {
        continue;
      }
      const seqLen = der[outerStart + 1];
      let p = outerStart + 2;
      const seqEnd = p + seqLen;
      while (p < seqEnd && p + 1 < der.length) {
        const tag = der[p];
        const len = der[p + 1];
        const start = p + 2;
        const end = start + len;
        if (end > der.length) {
          break;
        }
        if (tag === 0x82) {
          dns.push(decodePrintable(der.slice(start, end)));
        } else if (tag === 0x81) {
          email.push(decodePrintable(der.slice(start, end)));
        } else if (tag === 0x87 && len === 4) {
          ip.push(Array.from(der.slice(start, end)).join('.'));
        }
        p = end;
      }
      break;
    }
  }

  return { dns, ip, email };
}

async function digestHex(der: Uint8Array, algorithm: 'SHA-256' | 'SHA-1'): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, toArrayBuffer(der));
  return bytesToHex(new Uint8Array(digest));
}

export async function inspectCertificatePem(input: string): Promise<CertificateInfo[]> {
  const blocks = toPemBlocks(input);
  if (blocks.length === 0) {
    throw new Error('No PEM certificate blocks found');
  }

  const out: CertificateInfo[] = [];
  for (const block of blocks) {
    const der = base64ToBytes(block);
    const cnValues = findCnValues(der);
    const validity = findValidity(der);
    const sans = findSubjectAltNames(der);
    out.push({
      subjectCommonName: cnValues[1] ?? cnValues[0] ?? null,
      issuerCommonName: cnValues[0] ?? null,
      notBefore: validity.notBefore,
      notAfter: validity.notAfter,
      sanDns: sans.dns,
      sanIp: sans.ip,
      sanEmail: sans.email,
      sha256: await digestHex(der, 'SHA-256'),
      sha1: await digestHex(der, 'SHA-1'),
    });
  }

  return out;
}
