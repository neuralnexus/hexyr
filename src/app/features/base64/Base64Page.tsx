import { ToolWorkspace } from '../../components/ToolWorkspace';
import { base64ToBytes, bytesToBase64, bytesToText, textToBase64 } from '../../../shared/encoding';

function isReadableText(value: string): boolean {
  return !value.includes('\uFFFD') && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
}

function shouldDecodeBase64(input: string): boolean {
  const compact = input.replace(/\s+/g, '').trim();
  if (!compact || !/^[A-Za-z0-9+/_-]+=*$/.test(compact) || compact.length % 4 === 1) {
    return false;
  }

  try {
    const bytes = base64ToBytes(compact);
    const canonical = bytesToBase64(bytes).replace(/=+$/, '');
    const normalized = compact.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    return canonical === normalized && isReadableText(bytesToText(bytes));
  } catch {
    return false;
  }
}

export function transformBase64Input(input: string): string {
  return shouldDecodeBase64(input) ? bytesToText(base64ToBytes(input)) : textToBase64(input);
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
