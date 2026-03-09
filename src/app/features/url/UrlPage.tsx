import { ToolWorkspace } from '../../components/ToolWorkspace';
import { urlDecode, urlEncode } from '../../../shared/encoding';

export function UrlPage() {
  return (
    <ToolWorkspace
      title="URL Encode and Decode"
      description="Percent-encode and decode URL component strings."
      transform={(input) => {
        if (/%[0-9a-fA-F]{2}|\+/.test(input)) {
          try {
            return urlDecode(input);
          } catch {
            return urlEncode(input);
          }
        }
        return urlEncode(input);
      }}
    />
  );
}
