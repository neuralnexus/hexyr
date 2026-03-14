import { ToolWorkspace } from '../../components/ToolWorkspace';
import { base64ToBytes, bytesToBase64, bytesToText, textToBase64 } from '../../../shared/encoding';

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

function tryDecodeBase64(input: string): Uint8Array | null {
  const compact = input.replace(/\s+/g, '');
  if (!compact || !/^[A-Za-z0-9+/_-]+=*$/.test(compact) || compact.length % 4 === 1) {
    return null;
  }

  try {
    const bytes = base64ToBytes(compact);
    const canonical = bytesToBase64(bytes).replace(/=+$/, '');
    const normalized = compact.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    return canonical === normalized && isReadableText(bytesToText(bytes)) ? bytes : null;
  } catch {
    return null;
  }
}

export function transformBase64Input(input: string): string {
  const decodedBytes = tryDecodeBase64(input);
  return decodedBytes ? bytesToText(decodedBytes) : textToBase64(input);
}

export function Base64Page() {
  return (
    <ToolWorkspace
      title="Text and Base64"
      description="Convert text to standard or URL-safe base64 and back."
      transform={transformBase64Input}
    />
  );
}
