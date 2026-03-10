import { useMemo } from 'react';
import { parsePcapLite } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function PcapLitePage() {
  const { input, setInput } = useWorkspace();

  const output = useMemo(() => {
    if (!input.trim()) {
      return { error: '', result: null as ReturnType<typeof parsePcapLite> | null };
    }
    try {
      return { error: '', result: parsePcapLite(input) };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Unable to parse PCAP input',
        result: null,
      };
    }
  }, [input]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">PCAP-lite Payload Extractor</h1>
        <p className="text-sm text-slate-400">Parse classic PCAP bytes and summarize packet payload and flow metadata.</p>
      </header>

      <textarea
        className="focus-ring h-40 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste PCAP bytes as hex/base64"
      />

      {output.error && <div className="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">{output.error}</div>}

      {output.result && (
        <section className="glass rounded-md p-3">
          <div className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">
            Packets: {output.result.packetCount} • Endian: {output.result.littleEndian ? 'little' : 'big'}
          </div>
          <div className="max-h-[50vh] overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="border-b border-white/10 p-1">#</th>
                  <th className="border-b border-white/10 p-1">Src</th>
                  <th className="border-b border-white/10 p-1">Dst</th>
                  <th className="border-b border-white/10 p-1">Proto</th>
                  <th className="border-b border-white/10 p-1">Len</th>
                  <th className="border-b border-white/10 p-1">Payload preview</th>
                </tr>
              </thead>
              <tbody>
                {output.result.packets.map((pkt) => (
                  <tr key={pkt.index} className="text-cyan-100">
                    <td className="border-b border-white/10 p-1 font-mono">{pkt.index}</td>
                    <td className="border-b border-white/10 p-1 font-mono">{pkt.srcIp ?? '-'}</td>
                    <td className="border-b border-white/10 p-1 font-mono">{pkt.dstIp ?? '-'}</td>
                    <td className="border-b border-white/10 p-1">{pkt.protocol ?? '-'}</td>
                    <td className="border-b border-white/10 p-1">{pkt.capturedLength}</td>
                    <td className="border-b border-white/10 p-1 font-mono">{pkt.payloadHexPreview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
