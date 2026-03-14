import { ToolWorkspace } from '../../components/ToolWorkspace';
import { binaryToBytes, bytesToBinary, bytesToText, textToBytes } from '../../../shared/encoding';

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

function shouldDecodeBinary(input: string): boolean {
  const compact = input.replace(/\s+/g, '');
  if (!compact || !/^[01]+$/.test(compact) || compact.length % 8 !== 0) {
    return false;
  }

  try {
    const bytes = binaryToBytes(compact);
    return (
      bytesToBinary(bytes).replace(/\s+/g, '') === compact && isReadableText(bytesToText(bytes))
    );
  } catch {
    return false;
  }
}

export function transformBinaryInput(input: string): string {
  return shouldDecodeBinary(input)
    ? bytesToText(binaryToBytes(input))
    : bytesToBinary(textToBytes(input));
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
