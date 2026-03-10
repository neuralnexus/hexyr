import { describe, expect, it } from 'vitest';
import { lintHttpPolicies } from '../../src/shared/parsing';

describe('policy linter', () => {
  it('flags wildcard origin with credentials', () => {
    const result = lintHttpPolicies('access-control-allow-origin: *\naccess-control-allow-credentials: true');
    expect(result.issues.some((x) => x.area === 'CORS' && x.severity === 'error')).toBe(true);
  });
});
