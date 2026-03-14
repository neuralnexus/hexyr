import { ToolWorkspace } from '../../components/ToolWorkspace';
import { bytesToText, hexToBytes, textToBytes, bytesToHex } from '../../../shared/encoding';

function isReadableText(value: string): boolean {
  if (value.includes('\uFFFD')) {
    return false;
  }

  for (const char of value) {
    const code = char.charCodeAt(0);
    if (
      (code >= 0 && code <= 8) ||
      (code >= 11 && code <= 12) ||
      (code >= 14 && code <= 31) ||
      code === 127
    ) {
      return false;
    }
  }

  return true;
}

function shouldDecodeHex(input: string): boolean {
  const compact = input.replace(/\s+/g, '');
  if (!compact || !/^[0-9a-fA-F]+$/.test(compact) || compact.length % 2 !== 0) {
    return false;
  }

  try {
    const bytes = hexToBytes(compact);
    return bytesToHex(bytes) === compact.toLowerCase() && isReadableText(bytesToText(bytes));
  } catch {
    return false;
  }
}

export function transformHexInput(input: string): string {
  return shouldDecodeHex(input) ? bytesToText(hexToBytes(input)) : bytesToHex(textToBytes(input));
}

export function HexPage() {
  return (
    <ToolWorkspace
      title="Text and Hex"
      description="Convert between UTF-8 text and hexadecimal bytes."
      transform={transformHexInput}
    />
  );
}
