export interface PolicyIssue {
  area: 'CSP' | 'CORS' | 'Security-Headers';
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface PolicyLintResult {
  headers: Record<string, string>;
  issues: PolicyIssue[];
}

function parseHeaders(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(':')) continue;
    const idx = trimmed.indexOf(':');
    const name = trimmed.slice(0, idx).trim().toLowerCase();
    const value = trimmed.slice(idx + 1).trim();
    if (!name) continue;
    out[name] = value;
  }
  return out;
}

export function lintHttpPolicies(rawHeaders: string): PolicyLintResult {
  const headers = parseHeaders(rawHeaders);
  const issues: PolicyIssue[] = [];

  const csp = headers['content-security-policy'] ?? '';
  if (!csp) {
    issues.push({ area: 'CSP', severity: 'warning', message: 'Missing Content-Security-Policy header' });
  } else {
    if (/unsafe-inline/i.test(csp)) {
      issues.push({ area: 'CSP', severity: 'warning', message: 'CSP includes unsafe-inline' });
    }
    if (!/default-src/i.test(csp)) {
      issues.push({ area: 'CSP', severity: 'info', message: 'CSP missing default-src directive' });
    }
  }

  const acao = headers['access-control-allow-origin'];
  const acac = headers['access-control-allow-credentials'];
  if (acao === '*' && (acac ?? '').toLowerCase() === 'true') {
    issues.push({
      area: 'CORS',
      severity: 'error',
      message: 'CORS has wildcard origin with credentials enabled',
    });
  } else if (!acao) {
    issues.push({ area: 'CORS', severity: 'info', message: 'No Access-Control-Allow-Origin header present' });
  }

  if ((headers['strict-transport-security'] ?? '').length === 0) {
    issues.push({ area: 'Security-Headers', severity: 'warning', message: 'Missing Strict-Transport-Security' });
  }
  if ((headers['x-content-type-options'] ?? '').toLowerCase() !== 'nosniff') {
    issues.push({ area: 'Security-Headers', severity: 'warning', message: 'Set X-Content-Type-Options: nosniff' });
  }
  if (!headers['x-frame-options'] && !csp.includes('frame-ancestors')) {
    issues.push({ area: 'Security-Headers', severity: 'warning', message: 'Missing clickjacking protection (X-Frame-Options or frame-ancestors)' });
  }
  if (!headers['referrer-policy']) {
    issues.push({ area: 'Security-Headers', severity: 'info', message: 'Missing Referrer-Policy' });
  }
  if (!headers['permissions-policy']) {
    issues.push({ area: 'Security-Headers', severity: 'info', message: 'Missing Permissions-Policy' });
  }

  return { headers, issues };
}
