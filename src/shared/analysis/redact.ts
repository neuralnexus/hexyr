const JWT_PATTERN = /\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*\b/g;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const IPV4_PATTERN = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const API_KEY_PATTERN = /\b(?:sk|pk|api|key|token)[_-]?[A-Za-z0-9]{12,}\b/gi;

function maskMiddle(value: string, visible = 4): string {
  if (value.length <= visible * 2) {
    return '*'.repeat(value.length);
  }
  return `${value.slice(0, visible)}***${value.slice(-visible)}`;
}

export interface RedactionReport {
  redactedText: string;
  counts: {
    jwt: number;
    email: number;
    ipv4: number;
    apiKey: number;
  };
}

export function redactSensitiveText(input: string): RedactionReport {
  const counts = { jwt: 0, email: 0, ipv4: 0, apiKey: 0 };
  let out = input;

  out = out.replace(JWT_PATTERN, (match) => {
    counts.jwt += 1;
    return `[JWT:${maskMiddle(match, 6)}]`;
  });

  out = out.replace(EMAIL_PATTERN, (match) => {
    counts.email += 1;
    const [local, domain] = match.split('@');
    return `${local.slice(0, 1)}***@${domain}`;
  });

  out = out.replace(IPV4_PATTERN, (match) => {
    counts.ipv4 += 1;
    const chunks = match.split('.');
    return `${chunks[0]}.${chunks[1]}.x.x`;
  });

  out = out.replace(API_KEY_PATTERN, (match) => {
    counts.apiKey += 1;
    return `[KEY:${maskMiddle(match, 3)}]`;
  });

  return {
    redactedText: out,
    counts,
  };
}
