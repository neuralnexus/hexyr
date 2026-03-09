import { ToolWorkspace } from '../../components/ToolWorkspace';
import { htmlDecode, htmlEncode } from '../../../shared/encoding';

export function HtmlPage() {
  return (
    <ToolWorkspace
      title="HTML Entities"
      description="Encode and decode common HTML entities."
      transform={(input) => {
        if (/&(amp|lt|gt|quot|#39);/.test(input)) {
          return htmlDecode(input);
        }
        return htmlEncode(input);
      }}
    />
  );
}
