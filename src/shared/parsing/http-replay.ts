export interface ReplayTemplate {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  fetchTemplate: string;
  curlTemplate: string;
}

function parseRawHttp(input: string): ReplayTemplate {
  const lines = input.split(/\r?\n/);
  const requestLine = lines[0] ?? '';
  const [method = 'GET', path = '/'] = requestLine.split(' ');
  const headers: Record<string, string> = {};
  let i = 1;
  for (; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      break;
    }
    const idx = line.indexOf(':');
    if (idx > 0) {
      headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  const body = lines.slice(i).join('\n');
  const host = headers.Host ?? headers.host ?? 'example.com';
  const url = `https://${host}${path}`;

  return buildReplayTemplate(method, url, headers, body);
}

function parseCurl(input: string): ReplayTemplate {
  const method = (input.match(/-X\s+(\w+)/i)?.[1] ?? 'GET').toUpperCase();
  const url = input.match(/https?:\/\/[^\s'"\\]+/i)?.[0] ?? 'https://example.com';
  const headers: Record<string, string> = {};
  for (const match of input.matchAll(/-H\s+['"]([^:'"]+):\s*([^'"]+)['"]/g)) {
    headers[match[1]] = match[2];
  }
  const body = input.match(/(?:--data|-d)\s+['"]([\s\S]*?)['"]/i)?.[1] ?? '';

  return buildReplayTemplate(method, url, headers, body);
}

function buildReplayTemplate(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string,
): ReplayTemplate {
  const headerJson = JSON.stringify(headers, null, 2);
  const fetchTemplate = `await fetch(${JSON.stringify(url)}, {\n  method: ${JSON.stringify(method)},\n  headers: ${headerJson},\n  body: ${JSON.stringify(body)}\n});`;
  const curlParts = [`curl -X ${method}`, JSON.stringify(url)];
  Object.entries(headers).forEach(([k, v]) => {
    curlParts.push(`-H ${JSON.stringify(`${k}: ${v}`)}`);
  });
  if (body) {
    curlParts.push(`--data ${JSON.stringify(body)}`);
  }

  return {
    method,
    url,
    headers,
    body,
    fetchTemplate,
    curlTemplate: curlParts.join(' '),
  };
}

export function parseHttpReplayTemplate(input: string): ReplayTemplate {
  const trimmed = input.trim();
  if (trimmed.startsWith('curl ')) {
    return parseCurl(trimmed);
  }
  return parseRawHttp(trimmed);
}
