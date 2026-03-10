import { inspectCertificatePem } from './cert';

export interface TlsChainReportItem {
  index: number;
  subject: string | null;
  issuer: string | null;
  notBefore: string | null;
  notAfter: string | null;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  hostnameMatch: boolean;
  ocspHint: string;
  crlHint: string;
}

export interface TlsChainReport {
  chainLooksLinked: boolean;
  hostname: string;
  warnings: string[];
  certificates: TlsChainReportItem[];
}

function matchesHostname(hostname: string, names: string[]): boolean {
  const lowerHost = hostname.toLowerCase();
  return names.some((name) => {
    const lower = name.toLowerCase();
    if (lower === lowerHost) return true;
    if (lower.startsWith('*.')) {
      const suffix = lower.slice(1);
      return lowerHost.endsWith(suffix) && lowerHost.split('.').length >= suffix.split('.').length;
    }
    return false;
  });
}

export async function verifyTlsChainPem(pemChain: string, hostname: string): Promise<TlsChainReport> {
  const certs = await inspectCertificatePem(pemChain);
  const warnings: string[] = [];
  const now = Date.now();

  const certificates: TlsChainReportItem[] = certs.map((cert, index) => {
    const notAfterMs = cert.notAfter ? Date.parse(cert.notAfter) : Number.NaN;
    const isExpired = Number.isFinite(notAfterMs) ? notAfterMs < now : false;
    const daysUntilExpiry = Number.isFinite(notAfterMs)
      ? Math.floor((notAfterMs - now) / (1000 * 60 * 60 * 24))
      : null;

    const names = [...cert.sanDns, ...(cert.subjectCommonName ? [cert.subjectCommonName] : [])];
    const hostnameMatch = index === 0 ? matchesHostname(hostname, names) : true;

    return {
      index,
      subject: cert.subjectCommonName,
      issuer: cert.issuerCommonName,
      notBefore: cert.notBefore,
      notAfter: cert.notAfter,
      isExpired,
      daysUntilExpiry,
      hostnameMatch,
      ocspHint:
        'OCSP URL parsing is heuristic-only in this MVP. Verify via external trust toolchain if needed.',
      crlHint: 'CRL distribution point parsing is heuristic-only in this MVP.',
    };
  });

  let chainLooksLinked = true;
  for (let i = 0; i < certificates.length - 1; i += 1) {
    const current = certificates[i];
    const next = certificates[i + 1];
    if (current.issuer && next.subject && current.issuer !== next.subject) {
      chainLooksLinked = false;
      warnings.push(`Certificate ${i + 1} issuer does not match certificate ${i + 2} subject.`);
    }
  }

  if (!certificates[0]?.hostnameMatch) {
    warnings.push('Leaf certificate does not appear to match the requested hostname.');
  }
  for (const cert of certificates) {
    if (cert.isExpired) {
      warnings.push(`Certificate ${cert.index + 1} appears expired.`);
    } else if (typeof cert.daysUntilExpiry === 'number' && cert.daysUntilExpiry <= 30) {
      warnings.push(`Certificate ${cert.index + 1} expires soon (${cert.daysUntilExpiry} days).`);
    }
  }

  return {
    chainLooksLinked,
    hostname,
    warnings,
    certificates,
  };
}
