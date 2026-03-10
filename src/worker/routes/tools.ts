import { Hono } from 'hono';
import { verifyWebhookSignature } from '../../shared/crypto';
import {
  convertTimestamp,
  convertStructured,
  formatByKind,
  formatStructured,
  formatZoneFile,
  inspectHar,
  inspectId,
  lintHttpPolicies,
  minifyByKind,
  parseSetCookieHeaders,
  parseZoneFile,
  redactHarForExport,
  validateByKind,
  type FormatterKind,
  type StructuredFormat,
} from '../../shared/parsing';

export const toolsRoute = new Hono();

const DNS_JSON_ENDPOINT = 'https://cloudflare-dns.com/dns-query';

type DnsAnswer = {
  name?: string;
  type?: number;
  TTL?: number;
  data?: string;
};

async function dohQuery(name: string, type: string): Promise<{ status: number; answers: DnsAnswer[] }> {
  const url = new URL(DNS_JSON_ENDPOINT);
  url.searchParams.set('name', name);
  url.searchParams.set('type', type);

  const response = await fetch(url.toString(), {
    headers: {
      accept: 'application/dns-json',
    },
  });
  const body = (await response.json()) as { Status?: number; Answer?: DnsAnswer[] };
  return {
    status: body.Status ?? 0,
    answers: body.Answer ?? [],
  };
}

function cleanTarget(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Target is required');
  const withoutProto = trimmed.replace(/^https?:\/\//i, '');
  return withoutProto.replace(/\/.*$/, '').replace(/\.$/, '');
}

function isIpv4(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((x) => /^\d+$/.test(x) && Number.parseInt(x, 10) >= 0 && Number.parseInt(x, 10) <= 255);
}

function toArpa(ipv4: string): string {
  return `${ipv4.split('.').reverse().join('.')}.in-addr.arpa`;
}

async function rdapLookup(target: string): Promise<unknown> {
  const isIp = isIpv4(target);
  const tld = target.includes('.') ? target.split('.').at(-1)?.toLowerCase() ?? '' : '';

  const urls = isIp
    ? [
        `https://rdap.arin.net/registry/ip/${target}`,
        `https://www.rdap.net/ip/${target}`,
        `https://rdap.org/ip/${target}`,
      ]
    : [
        ...(tld === 'com' || tld === 'net' ? [`https://rdap.verisign.com/${tld}/v1/domain/${target}`] : []),
        `https://www.rdap.net/domain/${target}`,
        `https://rdap.org/domain/${target}`,
      ];

  let lastStatus = 0;
  for (const url of urls) {
    const res = await fetch(url, {
      headers: {
        accept: 'application/rdap+json, application/json',
        'user-agent': 'hexyr-dns-toolkit/1.0',
      },
    });
    if (res.ok) {
      return res.json();
    }
    lastStatus = res.status;
  }
  throw new Error(`RDAP lookup failed (${lastStatus || 'unknown'})`);
}

async function timedFetch(url: string): Promise<{ ok: boolean; status: number; responseTimeMs: number; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), 5000);
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal });
    return {
      ok: res.ok,
      status: res.status,
      responseTimeMs: Date.now() - start,
      finalUrl: res.url,
    };
  } finally {
    clearTimeout(timer);
  }
}

function summarizeAnswers(answers: DnsAnswer[]): Array<{ name: string; ttl: number; data: string; type: number }> {
  return answers.map((answer) => ({
    name: answer.name ?? '',
    ttl: answer.TTL ?? 0,
    data: answer.data ?? '',
    type: answer.type ?? 0,
  }));
}

async function runDnsTool(tool: string, targetRaw: string, requesterIp: string): Promise<unknown> {
  const target = cleanTarget(targetRaw);
  const lookupMap: Record<string, string> = {
    'A Lookup': 'A',
    'AAAA Lookup': 'AAAA',
    'CNAME Lookup': 'CNAME',
    'MX Lookup': 'MX',
    'NS Lookup': 'NS',
    'SOA Lookup': 'SOA',
    'SRV Lookup': 'SRV',
    'TXT Lookup': 'TXT',
    'CAA Lookup': 'CAA',
    'CERT Lookup': 'CERT',
    'DNSKEY Lookup': 'DNSKEY',
    'DS Lookup': 'DS',
    'NSEC Lookup': 'NSEC',
    'NSEC3PARAM Lookup': 'NSEC3PARAM',
    'RRSIG Lookup': 'RRSIG',
    'IPSECKEY Lookup': 'IPSECKEY',
    'LOC Lookup': 'LOC',
  };

  if (tool in lookupMap) {
    const result = await dohQuery(target, lookupMap[tool]);
    return { tool, target, status: result.status, answers: summarizeAnswers(result.answers) };
  }

  if (tool === 'DNS Lookup') {
    const types = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'];
    const rows = await Promise.all(types.map(async (type) => ({ type, ...(await dohQuery(target, type)) })));
    return {
      tool,
      target,
      lookups: rows.map((row) => ({ type: row.type, status: row.status, answers: summarizeAnswers(row.answers) })),
    };
  }

  if (tool === 'SPF Record Lookup') {
    const txt = await dohQuery(target, 'TXT');
    const spf = txt.answers.filter((a) => (a.data ?? '').toLowerCase().includes('v=spf1'));
    return { tool, target, status: txt.status, answers: summarizeAnswers(spf) };
  }

  if (tool === 'DMARC Lookup') {
    const result = await dohQuery(`_dmarc.${target}`, 'TXT');
    return { tool, target, status: result.status, answers: summarizeAnswers(result.answers) };
  }

  if (tool === 'DKIM Lookup') {
    const hostname = target.includes('._domainkey.') ? target : `selector1._domainkey.${target}`;
    const result = await dohQuery(hostname, 'TXT');
    return {
      tool,
      target,
      queriedHost: hostname,
      note: target.includes('._domainkey.') ? undefined : 'Provide explicit selector._domainkey.domain for exact DKIM lookup',
      status: result.status,
      answers: summarizeAnswers(result.answers),
    };
  }

  if (tool === 'BIMI Lookup') {
    const result = await dohQuery(`default._bimi.${target}`, 'TXT');
    return { tool, target, status: result.status, answers: summarizeAnswers(result.answers) };
  }

  if (tool === 'MTA-STS Lookup') {
    const txt = await dohQuery(`_mta-sts.${target}`, 'TXT');
    let policyText: string | null = null;
    try {
      const policyRes = await fetch(`https://mta-sts.${target}/.well-known/mta-sts.txt`);
      if (policyRes.ok) {
        policyText = await policyRes.text();
      }
    } catch {
      policyText = null;
    }
    return { tool, target, txtStatus: txt.status, txtAnswers: summarizeAnswers(txt.answers), policyText };
  }

  if (tool === 'TLSRPT Lookup') {
    const result = await dohQuery(`_smtp._tls.${target}`, 'TXT');
    return { tool, target, status: result.status, answers: summarizeAnswers(result.answers) };
  }

  if (tool === 'Reverse Lookup') {
    if (!isIpv4(target)) {
      throw new Error('Reverse lookup currently expects an IPv4 input');
    }
    const result = await dohQuery(toArpa(target), 'PTR');
    return { tool, target, status: result.status, answers: summarizeAnswers(result.answers) };
  }

  if (tool === 'Whois Lookup' || tool === 'ARIN Lookup' || tool === 'ASN Lookup') {
    const rdap = await rdapLookup(target);
    return { tool, target, rdap };
  }

  if (tool === 'DNS Check' || tool === 'Domain Health') {
    const [a, mx, ns, soa, txt, dmarc] = await Promise.all([
      dohQuery(target, 'A'),
      dohQuery(target, 'MX'),
      dohQuery(target, 'NS'),
      dohQuery(target, 'SOA'),
      dohQuery(target, 'TXT'),
      dohQuery(`_dmarc.${target}`, 'TXT'),
    ]);
    const hasSpf = txt.answers.some((x) => (x.data ?? '').toLowerCase().includes('v=spf1'));
    return {
      tool,
      target,
      checks: {
        A: a.answers.length,
        MX: mx.answers.length,
        NS: ns.answers.length,
        SOA: soa.answers.length,
        DMARC: dmarc.answers.length,
        SPF: hasSpf,
      },
      warnings: [
        mx.answers.length === 0 ? 'No MX records found' : null,
        dmarc.answers.length === 0 ? 'No DMARC TXT record found at _dmarc' : null,
        hasSpf ? null : 'No SPF TXT record found',
      ].filter(Boolean),
    };
  }

  if (tool === 'HTTP Lookup' || tool === 'HTTPS Lookup') {
    const scheme = tool.startsWith('HTTPS') ? 'https' : 'http';
    const start = Date.now();
    const res = await fetch(`${scheme}://${target}`, { redirect: 'follow' });
    return {
      tool,
      target,
      status: res.status,
      ok: res.ok,
      responseTimeMs: Date.now() - start,
      finalUrl: res.url,
    };
  }

  if (tool === 'What Is My IP?') {
    return { tool, ip: requesterIp };
  }

  if (tool === 'Blacklist Check' || tool === 'Blocklist Check') {
    let ip = target;
    if (!isIpv4(ip)) {
      const a = await dohQuery(target, 'A');
      ip = (a.answers[0]?.data ?? '').trim();
    }
    if (!isIpv4(ip)) {
      throw new Error('Could not resolve target to IPv4 for DNSBL check');
    }
    const listed = await dohQuery(`${ip.split('.').reverse().join('.')}.zen.spamhaus.org`, 'A');
    return {
      tool,
      target,
      queriedIp: ip,
      listed: listed.answers.length > 0,
      status: listed.status,
      answers: summarizeAnswers(listed.answers),
      note: 'Checks Spamhaus ZEN only in this build',
    };
  }

  if (tool === 'Ping') {
    const a = await dohQuery(target, 'A');
    const http = await timedFetch(`https://${target}`);
    return {
      tool,
      target,
      resolvedIp: a.answers[0]?.data ?? null,
      responseTimeMs: http.responseTimeMs,
      httpStatus: http.status,
      ok: http.ok,
      note: 'ICMP is unavailable in Workers; this is HTTPS reachability latency.',
      localCommand: `ping -c 4 ${target}`,
    };
  }

  if (tool === 'Trace') {
    const hops: Array<{ host: string; type: string; next?: string }> = [];
    let current = target;
    for (let i = 0; i < 8; i += 1) {
      const cname = await dohQuery(current, 'CNAME');
      if (cname.answers.length === 0) break;
      const next = (cname.answers[0]?.data ?? '').replace(/\.$/, '');
      if (!next) break;
      hops.push({ host: current, type: 'CNAME', next });
      current = next;
    }
    const a = await dohQuery(current, 'A');
    hops.push({ host: current, type: 'A', next: a.answers[0]?.data });
    return {
      tool,
      target,
      hops,
      note: 'DNS alias trace only; packet-level traceroute is unavailable in Workers.',
      localCommand: `traceroute ${target}`,
    };
  }

  if (tool === 'TCP Lookup') {
    const checks = await Promise.all(
      [80, 443].map(async (port) => {
        const scheme = port === 443 ? 'https' : 'http';
        const result = await timedFetch(`${scheme}://${target}:${port}`);
        return { port, ...result };
      }),
    );
    return {
      tool,
      target,
      checks,
      note: 'Workers cannot open raw TCP sockets in this tool path; using HTTP(S) probe.',
      localCommand: `nc -vz ${target} 25 53 80 443`,
    };
  }

  if (tool === 'Test Email Server') {
    const mx = await dohQuery(target, 'MX');
    const servers = await Promise.all(
      mx.answers.map(async (answer) => {
        const data = answer.data ?? '';
        const host = data.split(/\s+/).at(-1)?.replace(/\.$/, '') ?? '';
        const a = host ? await dohQuery(host, 'A') : { status: 0, answers: [] as DnsAnswer[] };
        return {
          mx: data,
          host,
          resolvedIp: a.answers[0]?.data ?? null,
        };
      }),
    );
    return {
      tool,
      target,
      mxCount: mx.answers.length,
      servers,
      note: 'SMTP handshake probing is not available in this runtime; returns MX + resolution diagnostics.',
      localCommand: `swaks --server $(dig +short MX ${target} | head -1 | awk '{print $2}') --timeout 10`,
    };
  }

  if (tool === 'Email Deliverability') {
    const [mx, spfTxt, dmarc, tlsRpt, mtaSts] = await Promise.all([
      dohQuery(target, 'MX'),
      dohQuery(target, 'TXT'),
      dohQuery(`_dmarc.${target}`, 'TXT'),
      dohQuery(`_smtp._tls.${target}`, 'TXT'),
      dohQuery(`_mta-sts.${target}`, 'TXT'),
    ]);
    const spf = spfTxt.answers.filter((x) => (x.data ?? '').toLowerCase().includes('v=spf1'));
    return {
      tool,
      target,
      signals: {
        mxRecords: mx.answers.length,
        hasSpf: spf.length > 0,
        hasDmarc: dmarc.answers.length > 0,
        hasTlsRpt: tlsRpt.answers.length > 0,
        hasMtaSts: mtaSts.answers.length > 0,
      },
      details: {
        mx: summarizeAnswers(mx.answers),
        spf: summarizeAnswers(spf),
        dmarc: summarizeAnswers(dmarc.answers),
        tlsRpt: summarizeAnswers(tlsRpt.answers),
        mtaSts: summarizeAnswers(mtaSts.answers),
      },
    };
  }

  if (tool === 'Ping' || tool === 'Trace' || tool === 'TCP Lookup' || tool === 'Test Email Server' || tool === 'Email Deliverability') {
    return {
      tool,
      target,
      status: 'unsupported',
      note: 'Unsupported in browser/Workers runtime for deep probing. Run equivalent network checks locally from shell.',
      localCommand: `dig ${target} && nslookup ${target}`,
    };
  }

  throw new Error(`Unknown DNS tool: ${tool}`);
}

toolsRoute.get('/tools', (c) => {
  return c.json({
    ok: true,
    endpoints: [
      '/api/tools/dns',
      '/api/tools/webhook-verify',
      '/api/tools/har-inspect',
      '/api/tools/cookie-analyze',
      '/api/tools/id-inspect',
      '/api/tools/time-convert',
      '/api/tools/policy-lint',
      '/api/tools/format',
      '/api/tools/dns-tool',
    ],
  });
});

toolsRoute.post('/tools/dns-tool', async (c) => {
  const body = (await c.req.json()) as { tool?: string; target?: string };
  const tool = body.tool?.trim() ?? '';
  const target = body.target?.trim() ?? '';
  if (!tool || !target) {
    return c.json({ ok: false, error: 'Both tool and target are required' }, 400);
  }
  const requesterIp = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  try {
    const result = await runDnsTool(tool, target, requesterIp);
    return c.json({ ok: true, result });
  } catch (err) {
    return c.json({ ok: false, error: err instanceof Error ? err.message : 'DNS tool execution failed' }, 400);
  }
});

toolsRoute.post('/tools/dns', async (c) => {
  const body = (await c.req.json()) as { zoneText?: string; format?: boolean };
  const zoneText = body.zoneText ?? '';
  const parsed = parseZoneFile(zoneText);
  return c.json({
    ok: true,
    parsed,
    formatted: body.format ? formatZoneFile(parsed.records, parsed.origin, parsed.defaultTtl) : undefined,
  });
});

toolsRoute.post('/tools/webhook-verify', async (c) => {
  const body = (await c.req.json()) as {
    provider: 'stripe' | 'github' | 'slack';
    payload: string;
    secret: string;
    signatureHeader: string;
    timestampHeader?: string;
  };
  const result = await verifyWebhookSignature(body);
  return c.json({ ok: true, result });
});

toolsRoute.post('/tools/har-inspect', async (c) => {
  const body = (await c.req.json()) as { harText?: string; redactionExport?: boolean };
  const harText = body.harText ?? '';
  const report = inspectHar(harText);
  return c.json({
    ok: true,
    report,
    redacted: body.redactionExport ? redactHarForExport(harText) : undefined,
  });
});

toolsRoute.post('/tools/cookie-analyze', async (c) => {
  const body = (await c.req.json()) as { setCookieText?: string };
  return c.json({ ok: true, result: parseSetCookieHeaders(body.setCookieText ?? '') });
});

toolsRoute.post('/tools/id-inspect', async (c) => {
  const body = (await c.req.json()) as { id?: string };
  return c.json({ ok: true, result: inspectId(body.id ?? '') });
});

toolsRoute.post('/tools/time-convert', async (c) => {
  const body = (await c.req.json()) as { input?: string; zones?: string[]; sourceZone?: string };
  const result = convertTimestamp(body.input ?? '', body.zones, body.sourceZone);
  return c.json({ ok: true, result });
});

toolsRoute.post('/tools/policy-lint', async (c) => {
  const body = (await c.req.json()) as { rawHeaders?: string };
  return c.json({ ok: true, result: lintHttpPolicies(body.rawHeaders ?? '') });
});

toolsRoute.post('/tools/format', async (c) => {
  const body = (await c.req.json()) as {
    input?: string;
    format?: StructuredFormat;
    kind?: FormatterKind;
    from?: StructuredFormat;
    to?: StructuredFormat;
    mode?: 'format' | 'minify' | 'validate';
  };
  const input = body.input ?? '';
  const format: StructuredFormat = body.format === 'yaml' || body.format === 'toml' ? body.format : 'json';
  const kind: FormatterKind = body.kind ?? format;
  const mode = body.mode ?? 'format';

  if (mode === 'format' && body.from && body.to) {
    const from: StructuredFormat = body.from === 'yaml' || body.from === 'toml' ? body.from : 'json';
    const to: StructuredFormat = body.to === 'yaml' || body.to === 'toml' ? body.to : 'json';
    return c.json({ ok: true, mode: 'convert', from, to, output: convertStructured(input, from, to) });
  }

  if (mode === 'validate') {
    return c.json({ ok: true, result: validateByKind(input, kind) });
  }

  if (mode === 'minify') {
    return c.json({ ok: true, kind, mode, output: minifyByKind(input, kind) });
  }

  if (kind === 'json' || kind === 'yaml' || kind === 'toml') {
    return c.json({ ok: true, kind, mode, output: formatStructured(input, kind) });
  }
  return c.json({ ok: true, kind, mode, output: formatByKind(input, kind) });
});
