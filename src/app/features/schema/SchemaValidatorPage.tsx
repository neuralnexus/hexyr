import { useMemo, useState } from 'react';
import { validateJsonSchemaSimple, validateJwtClaimsPolicy, validateOpenApiSnippet } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function SchemaValidatorPage() {
  const { input, setInput } = useWorkspace();
  const [schema, setSchema] = useState('{"type":"object","required":["id"],"properties":{"id":{"type":"number"}}}');
  const [policy, setPolicy] = useState('{"requiredClaims":["sub","exp"]}');

  const jsonErrors = useMemo(() => validateJsonSchemaSimple(input || '{}', schema), [input, schema]);
  const openApiErrors = useMemo(() => validateOpenApiSnippet(input || '{}'), [input]);
  const jwtErrors = useMemo(() => {
    if (!input.includes('.')) return ['Provide JWT token in input to evaluate claim policy'];
    return validateJwtClaimsPolicy(input, policy);
  }, [input, policy]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Schema Validators</h1>
      <textarea
        className="focus-ring h-36 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste JSON, JWT, or OpenAPI snippet"
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <textarea className="focus-ring h-28 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-xs" value={schema} onChange={(e) => setSchema(e.target.value)} />
        <textarea className="focus-ring h-28 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-xs" value={policy} onChange={(e) => setPolicy(e.target.value)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="JSON Schema" errors={jsonErrors} />
        <Panel title="JWT Policy" errors={jwtErrors} />
        <Panel title="OpenAPI Snippet" errors={openApiErrors} />
      </div>
    </section>
  );
}

function Panel({ title, errors }: { title: string; errors: string[] }) {
  return (
    <section className="glass rounded-md p-3 text-xs">
      <h2 className="mb-2 uppercase tracking-[0.1em] text-slate-400">{title}</h2>
      {errors.length === 0 ? (
        <p className="text-emerald-300">No validation errors.</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-amber-300">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
