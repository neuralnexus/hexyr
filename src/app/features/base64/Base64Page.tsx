import { ToolWorkspace } from '../../components/ToolWorkspace';
import { base64ToText, textToBase64 } from '../../../shared/encoding';

export function Base64Page() {
  return (
    <ToolWorkspace
      title="Text and Base64"
      description="Convert text to standard or URL-safe base64 and back."
      transform={(input) => {
        if (/^[A-Za-z0-9+/_=-\s]+$/.test(input.trim())) {
          try {
            return base64ToText(input);
          } catch {
            return textToBase64(input);
          }
        }
        return textToBase64(input);
      }}
    />
  );
}
