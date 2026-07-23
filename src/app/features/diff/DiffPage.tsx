import { ArrowLeftRight, ChevronLeft, ChevronRight, FileUp, X } from 'lucide-react';
import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  buildBinaryDiffRows,
  compareByteArrays,
  decodeDiffPayload,
  type BinaryDiffCell,
  type DiffEncoding,
} from '../../../shared/analysis';

const FILE_LIMIT = 32 * 1024 * 1024;
const PAGE_SIZE = 1024;
const BYTES_PER_LINE = 16;

interface FileSource {
  name: string;
  bytes: Uint8Array;
}

function byteLabel(value: number | null): string {
  return value === null ? '··' : value.toString(16).padStart(2, '0');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function DiffPage() {
  const [left, setLeft] = useState('48656c6c6f');
  const [right, setRight] = useState('48656c7051');
  const [encoding, setEncoding] = useState<DiffEncoding>('hex');
  const [leftFile, setLeftFile] = useState<FileSource | null>(null);
  const [rightFile, setRightFile] = useState<FileSource | null>(null);
  const [fileError, setFileError] = useState('');
  const [pageOffset, setPageOffset] = useState(0);
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const [changeCursor, setChangeCursor] = useState(0);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  const decoded = useMemo(() => {
    try {
      return {
        leftBytes: leftFile?.bytes ?? decodeDiffPayload(left, encoding),
        rightBytes: rightFile?.bytes ?? decodeDiffPayload(right, encoding),
        error: '',
      };
    } catch (error) {
      return {
        leftBytes: new Uint8Array(),
        rightBytes: new Uint8Array(),
        error: error instanceof Error ? error.message : 'Unable to decode input.',
      };
    }
  }, [encoding, left, leftFile, right, rightFile]);

  const result = useMemo(
    () => compareByteArrays(decoded.leftBytes, decoded.rightBytes),
    [decoded.leftBytes, decoded.rightBytes],
  );
  const maxLength = Math.max(decoded.leftBytes.length, decoded.rightBytes.length);
  const maxPageOffset = maxLength === 0 ? 0 : Math.floor((maxLength - 1) / PAGE_SIZE) * PAGE_SIZE;
  const visibleOffset = Math.min(pageOffset, maxPageOffset);
  const pageEnd = Math.min(maxLength, visibleOffset + PAGE_SIZE);
  const rows = useMemo(
    () =>
      buildBinaryDiffRows(
        decoded.leftBytes,
        decoded.rightBytes,
        visibleOffset,
        pageEnd,
        BYTES_PER_LINE,
      ),
    [decoded.leftBytes, decoded.rightBytes, pageEnd, visibleOffset],
  );
  const currentPage = maxLength === 0 ? 1 : Math.floor(visibleOffset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(maxLength / PAGE_SIZE));
  const safeChangeCursor =
    result.changeOffsets.length === 0 ? 0 : Math.min(changeCursor, result.changeOffsets.length - 1);

  const resetPosition = () => {
    setPageOffset(0);
    setSelectedOffset(null);
    setChangeCursor(0);
  };

  const focusOffset = (offset: number) => {
    if (maxLength === 0) return;
    const bounded = Math.max(0, Math.min(offset, maxLength - 1));
    setPageOffset(Math.floor(bounded / PAGE_SIZE) * PAGE_SIZE);
    setSelectedOffset(bounded);
  };

  const moveChange = (direction: -1 | 1) => {
    if (result.changeOffsets.length === 0) return;
    const next =
      (safeChangeCursor + direction + result.changeOffsets.length) % result.changeOffsets.length;
    setChangeCursor(next);
    focusOffset(result.changeOffsets[next]);
  };

  const loadFile = async (side: 'left' | 'right', file: File) => {
    setFileError('');
    if (file.size > FILE_LIMIT) {
      setFileError(`Files are limited to ${formatSize(FILE_LIMIT)} per side.`);
      return;
    }
    try {
      const source = { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
      if (side === 'left') setLeftFile(source);
      else setRightFile(source);
      resetPosition();
    } catch {
      setFileError(`Hexyr could not read ${file.name}.`);
    }
  };

  const onFileChange = (side: 'left' | 'right') => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadFile(side, file);
    event.target.value = '';
  };

  const selected =
    selectedOffset === null
      ? null
      : {
          status:
            selectedOffset >= decoded.leftBytes.length
              ? ('right-only' as const)
              : selectedOffset >= decoded.rightBytes.length
                ? ('left-only' as const)
                : decoded.leftBytes[selectedOffset] === decoded.rightBytes[selectedOffset]
                  ? ('equal' as const)
                  : ('changed' as const),
          left:
            selectedOffset < decoded.leftBytes.length ? decoded.leftBytes[selectedOffset] : null,
          right:
            selectedOffset < decoded.rightBytes.length ? decoded.rightBytes[selectedOffset] : null,
        };

  return (
    <section className="animate-rise space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Binary and Payload Diff</h1>
          <p className="text-sm text-slate-400">
            Compare pasted values or local files with synchronized byte selection.
          </p>
        </div>
        <span className="text-xs text-slate-500">Local files never leave this browser.</span>
      </header>

      <div className="glass flex flex-wrap items-center gap-2 rounded-md p-3">
        {!leftFile && !rightFile && (
          <label className="text-xs text-slate-400">
            Read pasted values as
            <select
              className="control-select ml-2"
              value={encoding}
              onChange={(event) => {
                setEncoding(event.target.value as DiffEncoding);
                resetPosition();
              }}
            >
              <option value="text">Text / UTF-8</option>
              <option value="hex">Hex</option>
              <option value="base64">Base64</option>
            </select>
          </label>
        )}
        <button
          type="button"
          className="focus-ring ml-auto inline-flex items-center gap-2 rounded border border-white/10 bg-surface-800 px-2.5 py-1.5 text-xs"
          onClick={() => {
            setLeft(right);
            setRight(left);
            setLeftFile(rightFile);
            setRightFile(leftFile);
            resetPosition();
          }}
        >
          <ArrowLeftRight size={13} />
          Swap sides
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DiffSource
          label="Left"
          value={left}
          file={leftFile}
          onChange={(value) => {
            setLeft(value);
            resetPosition();
          }}
          onOpen={() => leftFileRef.current?.click()}
          onClose={() => {
            setLeftFile(null);
            resetPosition();
          }}
        />
        <DiffSource
          label="Right"
          value={right}
          file={rightFile}
          onChange={(value) => {
            setRight(value);
            resetPosition();
          }}
          onOpen={() => rightFileRef.current?.click()}
          onClose={() => {
            setRightFile(null);
            resetPosition();
          }}
        />
      </div>
      <input
        ref={leftFileRef}
        className="hidden"
        type="file"
        aria-label="Open left local file"
        onChange={onFileChange('left')}
      />
      <input
        ref={rightFileRef}
        className="hidden"
        type="file"
        aria-label="Open right local file"
        onChange={onFileChange('right')}
      />
      {(fileError || decoded.error) && (
        <div className="rounded border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {fileError || decoded.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Left bytes" value={result.leftLength.toLocaleString()} />
        <Stat label="Right bytes" value={result.rightLength.toLocaleString()} />
        <Stat label="Equal" value={result.equalBytes.toLocaleString()} />
        <Stat label="Changed" value={result.changedBytes.toLocaleString()} tone="changed" />
        <Stat
          label="Only one side"
          value={(result.leftOnlyBytes + result.rightOnlyBytes).toLocaleString()}
          tone="one-side"
        />
        <Stat label="Similarity" value={`${(result.similarity * 100).toFixed(2)}%`} />
      </div>

      <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 text-xs">
        <span className="text-slate-400">
          {result.firstDiffOffset < 0
            ? 'Payloads are byte-for-byte identical.'
            : `First difference at 0x${result.firstDiffOffset.toString(16)} (${result.firstDiffOffset}).`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-button"
            onClick={() => moveChange(-1)}
            disabled={result.changeOffsets.length === 0}
            aria-label="Previous changed byte"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-28 text-center text-slate-400">
            {result.changeOffsets.length === 0
              ? 'No changes'
              : `${safeChangeCursor + 1} / ${result.changeOffsets.length}${result.changesTruncated ? '+' : ''}`}
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={() => moveChange(1)}
            disabled={result.changeOffsets.length === 0}
            aria-label="Next changed byte"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="glass rounded-md">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-slate-400">
          <span>
            {maxLength === 0
              ? 'No bytes'
              : `${visibleOffset.toLocaleString()}–${Math.max(visibleOffset, pageEnd - 1).toLocaleString()} of ${maxLength.toLocaleString()}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="icon-button"
              onClick={() => setPageOffset(Math.max(0, visibleOffset - PAGE_SIZE))}
              disabled={visibleOffset === 0}
              aria-label="Previous diff window"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-20 text-center">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              className="icon-button"
              onClick={() => setPageOffset(Math.min(maxPageOffset, visibleOffset + PAGE_SIZE))}
              disabled={visibleOffset + PAGE_SIZE >= maxLength}
              aria-label="Next diff window"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="max-h-[48vh] overflow-auto p-3 font-mono text-xs">
          {rows.length === 0 ? (
            <div className="py-10 text-center font-sans text-sm text-slate-500">
              Paste data or open two local files to compare.
            </div>
          ) : (
            <div className="w-max min-w-full" role="table" aria-label="Binary diff">
              <div className="mb-1 grid grid-cols-[5rem_26rem_26rem] text-[10px] uppercase tracking-[0.1em] text-slate-500">
                <span>Address</span>
                <span>Left</span>
                <span className="border-l border-white/10 pl-3">Right</span>
              </div>
              {rows.map((row) => (
                <div
                  key={row.offset}
                  className="grid h-7 grid-cols-[5rem_26rem_26rem] items-center"
                  role="row"
                >
                  <span className="text-slate-600">{row.offset.toString(16).padStart(8, '0')}</span>
                  <div className="flex">
                    {row.cells.map((cell) => (
                      <DiffByte
                        key={cell.offset}
                        cell={cell}
                        side="left"
                        selected={selectedOffset === cell.offset}
                        onSelect={setSelectedOffset}
                      />
                    ))}
                  </div>
                  <div className="flex border-l border-white/10 pl-3">
                    {row.cells.map((cell) => (
                      <DiffByte
                        key={cell.offset}
                        cell={cell}
                        side="right"
                        selected={selectedOffset === cell.offset}
                        onSelect={setSelectedOffset}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && selectedOffset !== null && (
        <div className="glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md px-3 py-2 font-mono text-xs">
          <span className="font-sans uppercase tracking-[0.12em] text-slate-500">
            Selected offset
          </span>
          <span>0x{selectedOffset.toString(16)}</span>
          <span>
            <span className="mr-1.5 font-sans text-slate-500">Left</span>
            {byteLabel(selected.left)}
          </span>
          <span>
            <span className="mr-1.5 font-sans text-slate-500">Right</span>
            {byteLabel(selected.right)}
          </span>
          <span className={`diff-label-${selected.status}`}>{selected.status}</span>
        </div>
      )}
    </section>
  );
}

function DiffSource({
  label,
  value,
  file,
  onChange,
  onOpen,
  onClose,
}: {
  label: string;
  value: string;
  file: FileSource | null;
  onChange: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <section className="glass rounded-md p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</h2>
        {file ? (
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={`Close ${label.toLowerCase()} file`}
          >
            <X size={13} />
          </button>
        ) : (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-1.5 rounded border border-white/10 bg-surface-800 px-2 py-1 text-xs"
            onClick={onOpen}
          >
            <FileUp size={13} />
            Open file
          </button>
        )}
      </div>
      {file ? (
        <div className="flex h-32 items-center justify-center rounded border border-dashed border-white/15 bg-surface-900/30 text-center">
          <div>
            <div className="font-mono text-sm text-slate-200">{file.name}</div>
            <div className="mt-1 text-xs text-slate-500">{formatSize(file.bytes.length)}</div>
          </div>
        </div>
      ) : (
        <textarea
          className="focus-ring h-32 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} payload`}
          placeholder={`${label} payload`}
          spellCheck={false}
        />
      )}
    </section>
  );
}

function DiffByte({
  cell,
  side,
  selected,
  onSelect,
}: {
  cell: BinaryDiffCell;
  side: 'left' | 'right';
  selected: boolean;
  onSelect: (offset: number) => void;
}) {
  const value = side === 'left' ? cell.left : cell.right;
  return (
    <button
      type="button"
      className={`diff-byte diff-byte-${cell.status} ${selected ? 'diff-byte-selected' : ''}`}
      onClick={() => onSelect(cell.offset)}
      aria-label={`${side} offset ${cell.offset}, byte ${byteLabel(value)}, ${cell.status}`}
    >
      {byteLabel(value)}
    </button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'changed' | 'one-side';
}) {
  return (
    <div className="glass rounded-md px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div
        className={`mt-0.5 truncate font-mono text-sm ${
          tone === 'changed'
            ? 'text-amber-300'
            : tone === 'one-side'
              ? 'text-violet-300'
              : 'text-slate-200'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
