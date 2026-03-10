import { inspectJwt } from './jwt';

function validateType(value: unknown, type: string): boolean {
  if (type === 'array') return Array.isArray(value);
  if (type === 'null') return value === null;
  return typeof value === type;
}

export function validateJsonSchemaSimple(dataText: string, schemaText: string): string[] {
  const errors: string[] = [];
  let data: Record<string, unknown>;
  let schema: Record<string, unknown>;
  try {
    data = JSON.parse(dataText) as Record<string, unknown>;
    schema = JSON.parse(schemaText) as Record<string, unknown>;
  } catch {
    return ['Data or schema is not valid JSON'];
  }

  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  const properties =
    schema.properties && typeof schema.properties === 'object'
      ? (schema.properties as Record<string, Record<string, unknown>>)
      : {};

  for (const key of required) {
    if (!(key in data)) {
      errors.push(`Missing required field: ${key}`);
    }
  }

  for (const [key, rule] of Object.entries(properties)) {
    if (!(key in data)) continue;
    const expectedType = typeof rule.type === 'string' ? rule.type : null;
    if (expectedType && !validateType(data[key], expectedType)) {
      errors.push(`Field ${key} expected type ${expectedType}`);
    }
  }

  return errors;
}

export function validateJwtClaimsPolicy(token: string, policyText: string): string[] {
  let policy: { requiredClaims?: string[]; issuer?: string; audience?: string };
  try {
    policy = JSON.parse(policyText) as { requiredClaims?: string[]; issuer?: string; audience?: string };
  } catch {
    return ['Policy must be valid JSON'];
  }

  const jwt = inspectJwt(token);
  if (!jwt.payloadJson) {
    return ['JWT payload could not be parsed as JSON'];
  }

  const errors: string[] = [];
  for (const claim of policy.requiredClaims ?? []) {
    if (!(claim in jwt.payloadJson)) {
      errors.push(`Missing required JWT claim: ${claim}`);
    }
  }
  if (policy.issuer && jwt.payloadJson.iss !== policy.issuer) {
    errors.push('Issuer claim does not match policy');
  }
  if (policy.audience && jwt.payloadJson.aud !== policy.audience) {
    errors.push('Audience claim does not match policy');
  }
  return errors;
}

export function validateOpenApiSnippet(input: string): string[] {
  const errors: string[] = [];
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(input) as Record<string, unknown>;
  } catch {
    return ['OpenAPI snippet must be valid JSON'];
  }

  if (!('openapi' in parsed) && !('swagger' in parsed)) {
    errors.push('Missing `openapi` or `swagger` version field');
  }
  if (!parsed.paths || typeof parsed.paths !== 'object') {
    errors.push('Missing `paths` object');
  }
  if (!parsed.info || typeof parsed.info !== 'object') {
    errors.push('Missing `info` object');
  }

  return errors;
}
