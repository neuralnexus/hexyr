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
import {
  assertSafeOutboundUrl,
  isIpv4,
  isPublicIpv4,
  isPublicIpv6,
  normalizeNetworkTarget,
  reverseIpv4,
} from '../utils/networkSafety';

export const toolsRoute = new Hono();

const DNS_JSON_ENDPOINT = 'https://cloudflare-dns.com/dns-query';
const MAX_JSON_BODY_BYTES = 1024 * 1024;
const MAX_REMOTE_RESPONSE_BYTES = 2 * 1024 * 1024;

class ToolRequestError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413 | 415,
  ) {
    super(message);
  }
}

async function readBytesLimited(
  stream: ReadableStream<Uint8Array> | null,
  limit: number,
): Promise<Uint8Array> {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel('response too large');
        throw new ToolRequestError(`Payload exceeds the ${limit.toLocaleString()} byte limit.`, 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function readJsonBody<T>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('application/json')) {
    throw new ToolRequestError('Content-Type must be application/json.', 415);
  }
  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    throw new ToolRequestError('JSON request body exceeds the 1 MiB limit.', 413);
  }
  const bytes = await readBytesLimited(request.body, MAX_JSON_BODY_BYTES);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    throw new ToolRequestError('Request body must contain valid JSON.', 400);
  }
}

async function readRemoteJson(response: Response): Promise<unknown> {
  const bytes = await readBytesLimited(response.body, MAX_REMOTE_RESPONSE_BYTES);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new Error('Remote service returned malformed JSON.');
  }
}

async function readRemoteText(response: Response): Promise<string> {
  return new TextDecoder().decode(await readBytesLimited(response.body, MAX_REMOTE_RESPONSE_BYTES));
}

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
  const body = (await readRemoteJson(response)) as { Status?: number; Answer?: DnsAnswer[] };
  return {
    status: body.Status ?? 0,
    answers: body.Answer ?? [],
  };
}

function toArpa(ipv4: string): string {
  return `${reverseIpv4(ipv4)}.in-addr.arpa`;
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
      return readRemoteJson(res);
    }
    lastStatus = res.status;
  }
  throw new Error(`RDAP lookup failed (${lastStatus || 'unknown'})`);
}

async function safeFetch(
  rawUrl: string,
): Promise<{ response: Response; responseTimeMs: number; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), 5000);
  const start = Date.now();
  try {
    let url = assertSafeOutboundUrl(rawUrl);
    for (let redirects = 0; redirects <= 5; redirects += 1) {
      if (!isIpv4(url.hostname)) {
        const [ipv4, ipv6] = await Promise.all([
          dohQuery(url.hostname, 'A'),
          dohQuery(url.hostname, 'AAAA'),
        ]);
        const unsafeIpv4 = ipv4.answers
          .map((answer) => answer.data?.trim() ?? '')
          .filter(isIpv4)
          .find((address) => !isPublicIpv4(address));
        const ipv6Addresses = ipv6.answers
          .map((answer) => answer.data?.trim() ?? '')
          .filter((address) => address.includes(':'));
        const unsafeIpv6 = ipv6Addresses.find((address) => !isPublicIpv6(address));
        if (unsafeIpv4 || unsafeIpv6) {
          throw new Error('Target resolves to a private or reserved network address.');
        }
      }
      const response = await fetch(url.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': 'hexyr-network-probe/1.0' },
      });
      if (response.status < 300 || response.status >= 400) {
        return {
          response,
          responseTimeMs: Date.now() - start,
          finalUrl: url.toString(),
        };
      }
      const location = response.headers.get('location');
      if (!location) {
        return {
          response,
          responseTimeMs: Date.now() - start,
          finalUrl: url.toString(),
        };
      }
      url = assertSafeOutboundUrl(new URL(location, url).toString());
    }
    throw new Error('Probe exceeded the five-redirect limit.');
  } finally {
    clearTimeout(timer);
  }
}

async function timedFetch(
  url: string,
): Promise<{ ok: boolean; status: number; responseTimeMs: number; finalUrl: string }> {
  const result = await safeFetch(url);
  return {
    ok: result.response.ok,
    status: result.response.status,
    responseTimeMs: result.responseTimeMs,
    finalUrl: result.finalUrl,
  };
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
  if (tool === 'What Is My IP?') {
    return { tool, ip: requesterIp };
  }
  const target = normalizeNetworkTarget(targetRaw);
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
      const policy = await safeFetch(`https://mta-sts.${target}/.well-known/mta-sts.txt`);
      if (policy.response.ok) {
        policyText = await readRemoteText(policy.response);
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
    const result = await timedFetch(`${scheme}://${target}`);
    return {
      tool,
      target,
      status: result.status,
      ok: result.ok,
      responseTimeMs: result.responseTimeMs,
      finalUrl: result.finalUrl,
    };
  }

  if (tool === 'Blacklist Check' || tool === 'Blocklist Check') {
    let ip = target;
    if (!isIpv4(ip)) {
      const a = await dohQuery(target, 'A');
      ip = (a.answers[0]?.data ?? '').trim();
    }
    if (!isPublicIpv4(ip)) {
      throw new Error('Could not resolve target to IPv4 for DNSBL check');
    }
    const listed = await dohQuery(`${reverseIpv4(ip)}.zen.spamhaus.org`, 'A');
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

toolsRoute.onError((error, c) => {
  if (error instanceof ToolRequestError) {
    if (error.status === 413) return c.json({ ok: false, error: error.message }, 413);
    if (error.status === 415) return c.json({ ok: false, error: error.message }, 415);
    return c.json({ ok: false, error: error.message }, 400);
  }
  return c.json({ ok: false, error: 'Tool request failed.' }, 500);
});

toolsRoute.post('/tools/dns-tool', async (c) => {
  const body = await readJsonBody<{ tool?: string; target?: string }>(c.req.raw);
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
  const body = await readJsonBody<{ zoneText?: string; format?: boolean }>(c.req.raw);
  const zoneText = body.zoneText ?? '';
  const parsed = parseZoneFile(zoneText);
  return c.json({
    ok: true,
    parsed,
    formatted: body.format ? formatZoneFile(parsed.records, parsed.origin, parsed.defaultTtl) : undefined,
  });
});

toolsRoute.post('/tools/webhook-verify', async (c) => {
  const body = await readJsonBody<{
    provider: 'stripe' | 'github' | 'slack';
    payload: string;
    secret: string;
    signatureHeader: string;
    timestampHeader?: string;
  }>(c.req.raw);
  const result = await verifyWebhookSignature(body);
  return c.json({ ok: true, result });
});

toolsRoute.post('/tools/har-inspect', async (c) => {
  const body = await readJsonBody<{ harText?: string; redactionExport?: boolean }>(c.req.raw);
  const harText = body.harText ?? '';
  const report = inspectHar(harText);
  return c.json({
    ok: true,
    report,
    redacted: body.redactionExport ? redactHarForExport(harText) : undefined,
  });
});

toolsRoute.post('/tools/cookie-analyze', async (c) => {
  const body = await readJsonBody<{ setCookieText?: string }>(c.req.raw);
  return c.json({ ok: true, result: parseSetCookieHeaders(body.setCookieText ?? '') });
});

toolsRoute.post('/tools/id-inspect', async (c) => {
  const body = await readJsonBody<{ id?: string }>(c.req.raw);
  return c.json({ ok: true, result: inspectId(body.id ?? '') });
});

toolsRoute.post('/tools/time-convert', async (c) => {
  const body = await readJsonBody<{ input?: string; zones?: string[]; sourceZone?: string }>(
    c.req.raw,
  );
  const result = convertTimestamp(body.input ?? '', body.zones, body.sourceZone);
  return c.json({ ok: true, result });
});

toolsRoute.post('/tools/policy-lint', async (c) => {
  const body = await readJsonBody<{ rawHeaders?: string }>(c.req.raw);
  return c.json({ ok: true, result: lintHttpPolicies(body.rawHeaders ?? '') });
});

toolsRoute.post('/tools/format', async (c) => {
  const body = await readJsonBody<{
    input?: string;
    format?: StructuredFormat;
    kind?: FormatterKind;
    from?: StructuredFormat;
    to?: StructuredFormat;
    mode?: 'format' | 'minify' | 'validate';
  }>(c.req.raw);
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
