import { useMemo, useState } from 'react';
import { bitwiseBinary, bitwiseNot, shiftLeft, shiftRight, swapEndianness } from '../../../shared/encoding';
import { intToIpv4, ipv4ToInt, isoToUnix, unixToIso } from '../../../shared/parsing';

export function BitwisePage() {
  const [left, setLeft] = useState('ff00aa55');
  const [right, setRight] = useState('0f0f0f0f');
  const [shift, setShift] = useState(1);
  const [ipv4, setIpv4] = useState('192.168.1.1');
  const [ipv4Int, setIpv4Int] = useState(3232235777);
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [isoInput, setIsoInput] = useState(new Date().toISOString());

  const derived = useMemo(() => {
    return {
      and: bitwiseBinary(left, right, 'AND'),
      or: bitwiseBinary(left, right, 'OR'),
      xor: bitwiseBinary(left, right, 'XOR'),
      not: bitwiseNot(left),
      lshift: shiftLeft(left, shift),
      rshift: shiftRight(left, shift),
      endian: swapEndianness(left),
    };
  }, [left, right, shift]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">Bitwise and Byte Utilities</h1>
        <p className="text-sm text-slate-400">Accepts hex or binary inputs for common byte operations.</p>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="glass rounded-md p-3 text-sm">
          <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Input A</span>
          <input
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono"
            value={left}
            onChange={(event) => setLeft(event.target.value)}
          />
        </label>
        <label className="glass rounded-md p-3 text-sm">
          <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Input B</span>
          <input
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono"
            value={right}
            onChange={(event) => setRight(event.target.value)}
          />
        </label>
      </div>

      <label className="glass block rounded-md p-3 text-sm">
        <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Shift Bits</span>
        <input
          type="range"
          min={1}
          max={7}
          value={shift}
          onChange={(event) => setShift(Number(event.target.value))}
          className="w-full"
        />
      </label>

      <div className="grid gap-2 md:grid-cols-2">
        {Object.entries(derived).map(([key, value]) => (
          <Result key={key} label={key} value={value} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="glass rounded-md p-3">
          <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">IPv4 {'<->'} Integer</h2>
          <div className="space-y-2 text-sm">
            <input
              className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono"
              value={ipv4}
              onChange={(event) => {
                const next = event.target.value;
                setIpv4(next);
                try {
                  setIpv4Int(ipv4ToInt(next));
                } catch {
                  setIpv4Int(0);
                }
              }}
            />
            <input
              className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono"
              type="number"
              value={ipv4Int}
              onChange={(event) => {
                const next = Number(event.target.value);
                setIpv4Int(next);
                try {
                  setIpv4(intToIpv4(next));
                } catch {
                  setIpv4('0.0.0.0');
                }
              }}
            />
          </div>
        </section>

        <section className="glass rounded-md p-3">
          <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Unix Timestamp</h2>
          <div className="space-y-2 text-sm">
            <input
              className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono"
              type="number"
              value={timestamp}
              onChange={(event) => {
                const next = Number(event.target.value);
                setTimestamp(next);
                try {
                  setIsoInput(unixToIso(next));
                } catch {
                  setIsoInput('Invalid timestamp');
                }
              }}
            />
            <input
              className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono"
              value={isoInput}
              onChange={(event) => {
                const next = event.target.value;
                setIsoInput(next);
                try {
                  setTimestamp(isoToUnix(next));
                } catch {
                  setTimestamp(0);
                }
              }}
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <section className="glass rounded-md p-3">
      <h3 className="mb-1 text-xs uppercase tracking-[0.12em] text-slate-400">{label}</h3>
      <code className="block overflow-auto font-mono text-xs text-cyan-100">{value}</code>
    </section>
  );
}
