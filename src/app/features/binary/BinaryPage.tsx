import { ToolWorkspace } from '../../components/ToolWorkspace';
import { binaryToBytes, bytesToBinary, bytesToText, textToBytes } from '../../../shared/encoding';

export function BinaryPage() {
  return (
    <ToolWorkspace
      title="Text and Binary"
      description="Convert between UTF-8 text and binary bit groups."
      transform={(input) => {
        if (/^[01\s]+$/.test(input.trim())) {
          return bytesToText(binaryToBytes(input));
        }
        return bytesToBinary(textToBytes(input));
      }}
    />
  );
}
