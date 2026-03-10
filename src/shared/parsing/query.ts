type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function tokenize(path: string): string[] {
  return path
    .replace(/^\$\.?/, '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
}

function descend(value: JsonValue, token: string): JsonValue[] {
  if (token === '*') {
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === 'object') {
      return Object.values(value);
    }
    return [];
  }

  if (Array.isArray(value)) {
    const index = Number.parseInt(token, 10);
    if (Number.isNaN(index) || index < 0 || index >= value.length) {
      return [];
    }
    return [value[index]];
  }

  if (value && typeof value === 'object' && token in value) {
    return [value[token]];
  }
  return [];
}

function runPath(json: JsonValue, path: string): JsonValue[] {
  const tokens = tokenize(path);
  let current: JsonValue[] = [json];
  for (const token of tokens) {
    current = current.flatMap((node) => descend(node, token));
  }
  return current;
}

export function runJsonPath(jsonText: string, path: string): JsonValue[] {
  if (!path.trim().startsWith('$')) {
    throw new Error('JSONPath must begin with $');
  }
  const parsed = JSON.parse(jsonText) as JsonValue;
  return runPath(parsed, path);
}

export function runJmesPath(jsonText: string, expression: string): JsonValue[] {
  const parsed = JSON.parse(jsonText) as JsonValue;
  return runPath(parsed, expression);
}
