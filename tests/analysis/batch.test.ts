import { describe, expect, it } from 'vitest';
import { batchRowsToCsv, runBatchTransform } from '../../src/shared/analysis';

describe('batch transform', () => {
  it('transforms rows and generates csv', () => {
    const rows = runBatchTransform('a\nb', 'text-to-base64');
    expect(rows[0].output).toBe('YQ==');
    const csv = batchRowsToCsv(rows);
    expect(csv).toContain('index,input,output,error');
  });
});
