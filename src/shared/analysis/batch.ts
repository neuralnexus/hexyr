import { base64ToText, bytesToBinary, bytesToHex, textToBase64, textToBytes, urlDecode, urlEncode } from '../encoding';

export type BatchTransformKind =
  | 'text-to-hex'
  | 'text-to-base64'
  | 'base64-to-text'
  | 'text-to-binary'
  | 'url-encode'
  | 'url-decode';

export interface BatchRow {
  index: number;
  input: string;
  output: string;
  error: string | null;
}

function applyTransform(input: string, kind: BatchTransformKind): string {
  switch (kind) {
    case 'text-to-hex':
      return bytesToHex(textToBytes(input));
    case 'text-to-base64':
      return textToBase64(input);
    case 'base64-to-text':
      return base64ToText(input);
    case 'text-to-binary':
      return bytesToBinary(textToBytes(input));
    case 'url-encode':
      return urlEncode(input);
    case 'url-decode':
      return urlDecode(input);
    default:
      return input;
  }
}

export function runBatchTransform(input: string, kind: BatchTransformKind): BatchRow[] {
  const lines = input.split(/\r?\n/);
  return lines.map((line, index) => {
    if (!line.trim()) {
      return { index, input: line, output: '', error: null };
    }
    try {
      return {
        index,
        input: line,
        output: applyTransform(line, kind),
        error: null,
      };
    } catch (err) {
      return {
        index,
        input: line,
        output: '',
        error: err instanceof Error ? err.message : 'Transform failed',
      };
    }
  });
}

export function batchRowsToCsv(rows: BatchRow[]): string {
  const esc = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = ['index,input,output,error'];
  rows.forEach((row) => {
    lines.push([String(row.index), esc(row.input), esc(row.output), esc(row.error ?? '')].join(','));
  });
  return lines.join('\n');
}
