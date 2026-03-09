import { describe, expect, it } from 'vitest';
import { inspectJwt } from '../../src/shared/parsing';

describe('JWT parsing', () => {
  it('decodes structural fields', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwiZXhwIjo0NzAwMDAwMDAwfQ.signature';
    const inspected = inspectJwt(token);
    expect(inspected.headerJson?.alg).toBe('HS256');
    expect(inspected.payloadJson?.sub).toBe('1234');
    expect(inspected.warnings[0]).toMatch(/does not verify/);
  });

  it('flags alg=none', () => {
    const token =
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIn0.';
    const inspected = inspectJwt(token);
    expect(inspected.warnings.join(' ')).toMatch(/alg=none/);
  });
});
