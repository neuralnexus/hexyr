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
    ],
  });
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
