import { useMemo, useState } from 'react';
import { formatZoneFile, parseZoneFile } from '../../../shared/parsing';

const EXAMPLE = `$ORIGIN example.com.
$TTL 300
@ IN A 192.0.2.1
www 60 IN CNAME @
mail 600 IN MX 10 mail.example.com.`;

const DNS_TOOLS = [
  'MX Lookup',
  'Blacklist Check',
  'DMARC Lookup',
  'AAAA Lookup',
  'ARIN Lookup',
  'ASN Lookup',
  'BIMI Lookup',
  'Blocklist Check',
  'CERT Lookup',
  'CNAME Lookup',
  'DKIM Lookup',
  'DNS Check',
  'DNS Lookup',
  'DNSKEY Lookup',
  'Domain Health',
  'DS Lookup',
  'Email Deliverability',
  'HTTP Lookup',
  'HTTPS Lookup',
  'IPSECKEY Lookup',
  'LOC Lookup',
  'MTA-STS Lookup',
  'NSEC Lookup',
  'NSEC3PARAM Lookup',
  'Ping',
  'Reverse Lookup',
  'RRSIG Lookup',
  'SOA Lookup',
  'SPF Record Lookup',
  'SRV Lookup',
  'TCP Lookup',
  'TLSRPT Lookup',
  'Trace',
  'TXT Lookup',
  'What Is My IP?',
  'Whois Lookup',
];

export function DnsToolkitPage() {
  const [zone, setZone] = useState(EXAMPLE);
  const [selectedTool, setSelectedTool] = useState('MX Lookup');
  const [target, setTarget] = useState('example.com');
  const [queryResult, setQueryResult] = useState('');
  const [queryError, setQueryError] = useState('');
  const [loading, setLoading] = useState(false);
  const result = useMemo(() => parseZoneFile(zone), [zone]);

  const runLookup = async () => {
    setLoading(true);
    setQueryError('');
    try {
      const response = await fetch('/api/tools/dns-tool', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool: selectedTool, target }),
      });
      const body = (await response.json()) as { ok: boolean; result?: unknown; error?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? `Lookup failed (${response.status})`);
      }
      setQueryResult(JSON.stringify(body.result, null, 2));
    } catch (err) {
      setQueryResult('');
      setQueryError(err instanceof Error ? err.message : 'DNS lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">DNS Zone Formatter + DNS Intelligence</h1>
      <p className="text-sm text-slate-400">Use the top section for zone file parsing/formatting. Use the lookup section for MXToolbox-style checks (DNS/RDAP/health lookups).</p>

      <section className="glass space-y-3 rounded-md p-3">
        <h2 className="text-xs uppercase tracking-[0.1em] text-slate-400">DNS Lookup Toolkit</h2>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {DNS_TOOLS.map((tool) => (
            <button
              key={tool}
              type="button"
              className={`focus-ring rounded border px-2 py-1.5 text-xs ${tool === selectedTool ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-surface-800/50 text-slate-200 hover:border-cyan-400/30'}`}
              onClick={() => setSelectedTool(tool)}
            >
              {tool}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="focus-ring flex-1 rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Target domain, hostname, or IPv4"
          />
          <button
            type="button"
            className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2 text-sm"
            onClick={() => void runLookup()}
            disabled={loading}
          >
            {loading ? 'Running…' : 'Run Lookup'}
          </button>
        </div>
        <p className="text-xs text-slate-400">Selected tool: {selectedTool}</p>
        {queryError && <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-300">{queryError}</div>}
        {queryResult && <pre className="max-h-72 overflow-auto rounded border border-white/10 bg-surface-900/40 p-3 font-mono text-xs text-cyan-100">{queryResult}</pre>}
      </section>

      <section className="glass space-y-3 rounded-md p-3">
        <h2 className="text-xs uppercase tracking-[0.1em] text-slate-400">Zone Formatter</h2>
      <textarea
        className="focus-ring h-44 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={zone}
        onChange={(event) => setZone(event.target.value)}
        placeholder="Paste zone file text"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2 text-sm"
          onClick={() => setZone(formatZoneFile(result.records, result.origin, result.defaultTtl))}
        >
          Format Zone
        </button>
      </div>
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="glass rounded-md p-3 text-xs">
          <h2 className="mb-2 uppercase tracking-[0.1em] text-slate-400">Validation</h2>
          {result.errors.length === 0 ? <p className="text-emerald-300">No syntax errors.</p> : <ul className="list-disc space-y-1 pl-4 text-red-300">{result.errors.map((x) => <li key={x}>{x}</li>)}</ul>}
          {result.warnings.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-300">{result.warnings.map((x) => <li key={x}>{x}</li>)}</ul>}
        </div>
        <div className="glass rounded-md p-3 text-xs text-slate-300">
          <h2 className="mb-2 uppercase tracking-[0.1em] text-slate-400">Records</h2>
          <p>Count: {result.records.length}</p>
          <p>Origin: {result.origin ?? '(none)'}</p>
          <p>Default TTL: {result.defaultTtl ?? '(none)'}</p>
        </div>
      </section>
      </section>
    </section>
  );
}
