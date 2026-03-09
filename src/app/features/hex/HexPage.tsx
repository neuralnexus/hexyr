import { ToolWorkspace } from '../../components/ToolWorkspace';
import { bytesToText, hexToBytes, textToBytes, bytesToHex } from '../../../shared/encoding';

export function HexPage() {
  return (
    <ToolWorkspace
      title="Text and Hex"
      description="Convert between UTF-8 text and hexadecimal bytes."
      transform={(input) => {
        if (/^[0-9a-fA-F\s]+$/.test(input.trim())) {
          return bytesToText(hexToBytes(input));
        }
        return bytesToHex(textToBytes(input));
      }}
    />
  );
}
