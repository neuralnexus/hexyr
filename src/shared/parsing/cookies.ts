export interface CookieRecord {
  name: string;
  value: string;
  attributes: Record<string, string | true>;
  warnings: string[];
}

export interface CookieAnalysisResult {
  cookies: CookieRecord[];
  errors: string[];
}

function parseExpires(value: string): number | null {
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
}

export function parseSetCookieHeaders(input: string): CookieAnalysisResult {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^set-cookie:\s*/i, ''));

  const cookies: CookieRecord[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    const parts = line.split(';').map((x) => x.trim()).filter(Boolean);
    const first = parts.shift();
    if (!first || !first.includes('=')) {
      errors.push(`Invalid Set-Cookie line: ${line}`);
      continue;
    }

    const split = first.indexOf('=');
    const name = first.slice(0, split).trim();
    const value = first.slice(split + 1).trim();
    const attributes: Record<string, string | true> = {};

    for (const part of parts) {
      const eq = part.indexOf('=');
      if (eq === -1) {
        attributes[part.toLowerCase()] = true;
      } else {
        const attrName = part.slice(0, eq).trim().toLowerCase();
        const attrValue = part.slice(eq + 1).trim();
        attributes[attrName] = attrValue;
      }
    }

    const warnings: string[] = [];
    if (!('secure' in attributes)) warnings.push('Missing Secure flag');
    if (!('httponly' in attributes)) warnings.push('Missing HttpOnly flag');

    const sameSite = typeof attributes.samesite === 'string' ? attributes.samesite.toLowerCase() : '';
    if (!sameSite) {
      warnings.push('Missing SameSite attribute');
    } else if (!['strict', 'lax', 'none'].includes(sameSite)) {
      warnings.push(`Unknown SameSite value: ${String(attributes.samesite)}`);
    } else if (sameSite === 'none' && !('secure' in attributes)) {
      warnings.push('SameSite=None must include Secure');
    }

    if (typeof attributes.expires === 'string') {
      const exp = parseExpires(attributes.expires);
      if (exp === null) {
        warnings.push('Invalid Expires date');
      } else if (exp < Date.now()) {
        warnings.push('Cookie already expired');
      }
    }

    if (typeof attributes['max-age'] === 'string' && !/^-?\d+$/.test(attributes['max-age'])) {
      warnings.push('Invalid Max-Age attribute');
    }

    cookies.push({ name, value, attributes, warnings });
  }

  return { cookies, errors };
}
