import { useMemo } from 'react';
import { parseAsn1, type Asn1Node } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function Asn1ViewerPage() {
  const { input, setInput } = useWorkspace();
  const nodes = useMemo(() => {
    try {
      return parseAsn1(input);
    } catch {
      return [];
    }
  }, [input]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">ASN.1 / DER Generic Viewer</h1>
      <textarea
        className="focus-ring h-36 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste DER bytes as hex/base64"
      />
      <section className="glass rounded-md p-3">
        {nodes.length === 0 ? (
          <p className="text-sm text-slate-400">No ASN.1 nodes parsed yet.</p>
        ) : (
          <div className="space-y-2">{nodes.map((node, idx) => <NodeView key={idx} node={node} depth={0} />)}</div>
        )}
      </section>
    </section>
  );
}

function NodeView({ node, depth }: { node: Asn1Node; depth: number }) {
  return (
    <div style={{ marginLeft: depth * 14 }} className="rounded border border-white/10 bg-surface-900/40 p-2 font-mono text-xs text-cyan-100">
      <div>
        className={node.tagClass} tag={node.tagNumber} constructed={String(node.constructed)} len={node.length} off={node.offset}
      </div>
      <div className="text-slate-400">{node.valuePreview || '(empty)'}</div>
      {node.children.map((child, idx) => (
        <NodeView key={idx} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
