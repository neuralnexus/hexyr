import { ToolWorkspace } from '../../components/ToolWorkspace';
import {
  binaryToBytes,
  bytesToBinary,
  bytesToText,
  isReadableText,
  isValidBinary,
  textToBytes,
} from '../../../shared/encoding';

function tryDecodeBinary(input: string): Uint8Array | null {
  if (!isValidBinary(input)) {
    return null;
  }

  const compact = input.replace(/\s+/g, '').trim();

  try {
    const bytes = binaryToBytes(compact);
    return bytesToBinary(bytes).replace(/\s+/g, '') === compact &&
      isReadableText(bytesToText(bytes))
      ? bytes
      : null;
  } catch {
    return null;
  }
}

export function transformBinaryInput(input: string): string {
  const decodedBytes = tryDecodeBinary(input);
  return decodedBytes ? bytesToText(decodedBytes) : bytesToBinary(textToBytes(input));
}

export function BinaryPage() {
  return (
    <ToolWorkspace
      title="Text and Binary"
      description="Convert between UTF-8 text and binary bit groups."
      transform={transformBinaryInput}
    />
  );
}
