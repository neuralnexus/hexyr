import { describe, expect, it } from 'vitest';
import { inspectCertificatePem } from '../../src/shared/parsing';

describe('certificate parser', () => {
  it('errors on missing PEM blocks', async () => {
    await expect(inspectCertificatePem('not a cert')).rejects.toThrow(/No PEM certificate blocks/);
  });
});
