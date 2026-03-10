export interface HarAnomaly {
  kind: 'slow' | 'error' | 'missing-header' | 'cookie-risk';
  message: string;
  entryIndex: number;
  url: string;
}

export interface HarInspectResult {
  entryCount: number;
  hosts: string[];
  methods: Record<string, number>;
  statusBuckets: Record<string, number>;
  requestHeaders: Record<string, number>;
  responseHeaders: Record<string, number>;
  cookies: string[];
  anomalies: HarAnomaly[];
}

interface HarEntryLike {
  request?: {
    method?: string;
    url?: string;
    headers?: Array<{ name?: string; value?: string }>;
    cookies?: Array<{ name?: string; value?: string }>;
  };
  response?: {
    status?: number;
    headers?: Array<{ name?: string; value?: string }>;
    cookies?: Array<{ name?: string; value?: string }>;
  };
  time?: number;
  timings?: {
    wait?: number;
    receive?: number;
    send?: number;
  };
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function collectHeaders(map: Record<string, number>, headers?: Array<{ name?: string }>) {
  for (const header of headers ?? []) {
    const name = (header.name ?? '').trim().toLowerCase();
    if (name) bump(map, name);
  }
}

function bucketStatus(status: number): string {
  if (status < 200) return '1xx';
  if (status < 300) return '2xx';
  if (status < 400) return '3xx';
  if (status < 500) return '4xx';
  return '5xx';
}

export function inspectHar(harText: string): HarInspectResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(harText);
  } catch {
    throw new Error('HAR must be valid JSON');
  }

  const entries =
    typeof parsed === 'object' && parsed !== null && 'log' in parsed
      ? (((parsed as { log?: { entries?: HarEntryLike[] } }).log?.entries ?? []) as HarEntryLike[])
      : [];

  const hosts = new Set<string>();
  const methods: Record<string, number> = {};
  const statusBuckets: Record<string, number> = {};
  const requestHeaders: Record<string, number> = {};
  const responseHeaders: Record<string, number> = {};
  const cookies = new Set<string>();
  const anomalies: HarAnomaly[] = [];

  entries.forEach((entry, index) => {
    const req = entry.request ?? {};
    const res = entry.response ?? {};
    const method = (req.method ?? 'UNKNOWN').toUpperCase();
    bump(methods, method);

    const urlText = req.url ?? '';
    let host = '';
    try {
      host = new URL(urlText).host;
      if (host) hosts.add(host);
    } catch {
      host = '';
    }

    const status = typeof res.status === 'number' ? res.status : 0;
    if (status > 0) bump(statusBuckets, bucketStatus(status));

    collectHeaders(requestHeaders, req.headers);
    collectHeaders(responseHeaders, res.headers);

    for (const cookie of req.cookies ?? []) {
      if (cookie.name) cookies.add(cookie.name);
    }
    for (const cookie of res.cookies ?? []) {
      if (cookie.name) cookies.add(cookie.name);
    }

    const totalTime = typeof entry.time === 'number' ? entry.time : 0;
    if (totalTime > 2000) {
      anomalies.push({
        kind: 'slow',
        message: `Slow request (${Math.round(totalTime)}ms)`,
        entryIndex: index,
        url: urlText,
      });
    }

    if (status >= 400) {
      anomalies.push({
        kind: 'error',
        message: `HTTP ${status} response`,
        entryIndex: index,
        url: urlText,
      });
    }

    const respHeaderNames = new Set((res.headers ?? []).map((h) => (h.name ?? '').toLowerCase()));
    if (!respHeaderNames.has('content-security-policy') && urlText.startsWith('https://')) {
      anomalies.push({
        kind: 'missing-header',
        message: 'Missing Content-Security-Policy on HTTPS response',
        entryIndex: index,
        url: urlText,
      });
    }

    const setCookie = (res.headers ?? []).find((h) => (h.name ?? '').toLowerCase() === 'set-cookie')?.value ?? '';
    if (setCookie && !/httponly/i.test(setCookie)) {
      anomalies.push({
        kind: 'cookie-risk',
        message: 'Set-Cookie missing HttpOnly flag',
        entryIndex: index,
        url: urlText,
      });
    }
  });

  return {
    entryCount: entries.length,
    hosts: [...hosts].sort(),
    methods,
    statusBuckets,
    requestHeaders,
    responseHeaders,
    cookies: [...cookies].sort(),
    anomalies,
  };
}

export function redactHarForExport(harText: string): string {
  const parsed = JSON.parse(harText) as {
    log?: {
      entries?: Array<{
        request?: { headers?: Array<{ name?: string; value?: string }>; url?: string };
        response?: { headers?: Array<{ name?: string; value?: string }> };
      }>;
    };
  };

  for (const entry of parsed.log?.entries ?? []) {
    for (const header of entry.request?.headers ?? []) {
      const name = (header.name ?? '').toLowerCase();
      if (name === 'authorization' || name === 'cookie' || name === 'x-api-key') {
        header.value = '[REDACTED]';
      }
    }
    for (const header of entry.response?.headers ?? []) {
      const name = (header.name ?? '').toLowerCase();
      if (name === 'set-cookie') {
        header.value = '[REDACTED]';
      }
    }
    if (entry.request?.url) {
      entry.request.url = entry.request.url.replace(/([?&](?:token|key|apikey|api_key|signature)=)[^&]+/gi, '$1[REDACTED]');
    }
  }

  return JSON.stringify(parsed, null, 2);
}
