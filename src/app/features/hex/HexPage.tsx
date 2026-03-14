import { ToolWorkspace } from '../../components/ToolWorkspace';
import {
  bytesToHex,
  bytesToText,
  hexToBytes,
  isReadableText,
  isValidHex,
  normalizeHexInput,
  textToBytes,
} from '../../../shared/encoding';

function tryDecodeHex(input: string): Uint8Array | null {
  if (!isValidHex(input)) {
    return null;
  }

  try {
    const bytes = hexToBytes(input);
    const compact = normalizeHexInput(input);
    return bytesToHex(bytes) === compact.toLowerCase() && isReadableText(bytesToText(bytes))
      ? bytes
      : null;
  } catch {
    return null;
  }
}

export function transformHexInput(input: string): string {
  const decodedBytes = tryDecodeHex(input);
  return decodedBytes ? bytesToText(decodedBytes) : bytesToHex(textToBytes(input));
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
