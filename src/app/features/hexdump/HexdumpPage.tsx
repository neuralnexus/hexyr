import { ChevronLeft, ChevronRight, Clipboard, FileUp, Search, X } from 'lucide-react';
import { type DragEvent, type ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  buildHexdumpRows,
  decodeByteInput,
  findByteSequence,
  formatHexdump,
  getByteColorToken,
  summarizeBytes,
  type ByteColorMode,
  type ByteInputEncoding,
} from '../../../shared/analysis/hexdump';
import {
  inspectBinaryStructure,
  type BinaryRegion,
} from '../../../shared/analysis/binary-structure';
import { useWorkspace } from '../../hooks/useWorkspace';

const FILE_LIMIT = 32 * 1024 * 1024;
const PAGE_SIZES = [768, 3072, 12288] as const;
const MAX_SEARCH_MATCHES = 1000;

interface LocalFileSource {
  bytes: Uint8Array;
  name: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function formatPercent(count: number, total: number): string {
  return total === 0 ? '0%' : `${((count / total) * 100).toFixed(1)}%`;
}

function parseJumpOffset(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = /^0x/i.test(trimmed)
    ? Number.parseInt(trimmed.slice(2), 16)
    : /[a-f]/i.test(trimmed)
      ? Number.parseInt(trimmed, 16)
      : Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function HexdumpPage() {
  const { input, setInput } = useWorkspace();
  const [inputEncoding, setInputEncoding] = useState<ByteInputEncoding>('auto');
  const [bytesPerLine, setBytesPerLine] = useState(16);
  const [uppercase, setUppercase] = useState(false);
  const [offsetBase, setOffsetBase] = useState<10 | 16>(16);
  const [colorMode, setColorMode] = useState<ByteColorMode>('nibble');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(3072);
  const [pageOffset, setPageOffset] = useState(0);
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const [localFile, setLocalFile] = useState<LocalFileSource | null>(null);
  const [sourceError, setSourceError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchEncoding, setSearchEncoding] = useState<'hex' | 'text'>('hex');
  const [matchCursor, setMatchCursor] = useState(0);
  const [jumpInput, setJumpInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const decoded = useMemo(() => {
    if (localFile) {
      return {
        bytes: localFile.bytes,
        detectedEncoding: 'file' as const,
        error: '',
      };
    }
    try {
      const result = decodeByteInput(input, inputEncoding);
      return { ...result, error: '' };
    } catch (error) {
      return {
        bytes: new Uint8Array(),
        detectedEncoding: inputEncoding === 'auto' ? ('text' as const) : inputEncoding,
        error: error instanceof Error ? error.message : 'Unable to decode input',
      };
    }
  }, [input, inputEncoding, localFile]);

  const { bytes } = decoded;
  const options = useMemo(
    () => ({ bytesPerLine, uppercase, offsetBase }),
    [bytesPerLine, offsetBase, uppercase],
  );
  const maxPageOffset =
    bytes.length === 0 ? 0 : Math.floor((bytes.length - 1) / pageSize) * pageSize;
  const visibleOffset = Math.min(pageOffset, maxPageOffset);
  const pageEnd = Math.min(visibleOffset + pageSize, bytes.length);
  const rows = useMemo(
    () => buildHexdumpRows(bytes, options, visibleOffset, pageEnd),
    [bytes, options, pageEnd, visibleOffset],
  );
  const summary = useMemo(() => summarizeBytes(bytes), [bytes]);
  const structure = useMemo(() => inspectBinaryStructure(bytes), [bytes]);
  const selectedRegion =
    structure.regions.find((region) => region.id === selectedRegionId) ?? null;
  const visibleDump = useMemo(
    () => formatHexdump(bytes, options, visibleOffset, pageEnd),
    [bytes, options, pageEnd, visibleOffset],
  );

  const search = useMemo(() => {
    if (!searchInput) {
      return { matches: [] as number[], needleLength: 0, error: '' };
    }
    try {
      const needle = decodeByteInput(searchInput, searchEncoding).bytes;
      return {
        matches: findByteSequence(bytes, needle, MAX_SEARCH_MATCHES),
        needleLength: needle.length,
        error: '',
      };
    } catch (error) {
      return {
        matches: [] as number[],
        needleLength: 0,
        error: error instanceof Error ? error.message : 'Invalid search value',
      };
    }
  }, [bytes, searchEncoding, searchInput]);

  const safeMatchCursor =
    search.matches.length === 0 ? 0 : Math.min(matchCursor, search.matches.length - 1);
  const activeMatch = search.matches[safeMatchCursor] ?? null;
  const highlightedOffsets = useMemo(() => {
    const result = new Set<number>();
    for (const start of search.matches) {
      if (start + search.needleLength < visibleOffset || start >= pageEnd) {
        continue;
      }
      for (let index = start; index < start + search.needleLength; index += 1) {
        if (index >= visibleOffset && index < pageEnd) {
          result.add(index);
        }
      }
    }
    return result;
  }, [pageEnd, search.matches, search.needleLength, visibleOffset]);

  const focusOffset = (offset: number) => {
    if (bytes.length === 0) {
      return;
    }
    const bounded = Math.max(0, Math.min(offset, bytes.length - 1));
    setPageOffset(Math.floor(bounded / pageSize) * pageSize);
    setSelectedOffset(bounded);
  };

  const moveMatch = (direction: -1 | 1) => {
    if (search.matches.length === 0) {
      return;
    }
    const next = (safeMatchCursor + direction + search.matches.length) % search.matches.length;
    setMatchCursor(next);
    focusOffset(search.matches[next]);
  };

  const loadFile = async (file: File) => {
    setSourceError('');
    if (file.size > FILE_LIMIT) {
      setSourceError(
        `Files are limited to ${formatSize(FILE_LIMIT)} to keep inspection responsive.`,
      );
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setLocalFile({ bytes, name: file.name, size: file.size });
      setPageOffset(0);
      setSelectedOffset(null);
      setSelectedRegionId(null);
      setMatchCursor(0);
    } catch {
      setSourceError('Hexyr could not read that local file.');
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void loadFile(file);
    }
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void loadFile(file);
    }
  };

  const copyVisibleDump = async () => {
    try {
      await navigator.clipboard.writeText(visibleDump);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setSourceError('Clipboard access is unavailable; select and copy the visible bytes manually.');
    }
  };

  const selectedByte =
    selectedOffset === null || selectedOffset >= bytes.length ? null : bytes[selectedOffset];
  const pageCount = Math.max(1, Math.ceil(bytes.length / pageSize));
  const currentPage = bytes.length === 0 ? 1 : Math.floor(visibleOffset / pageSize) + 1;

  return (
    <section className="animate-rise space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Hex Viewer and Hexdump</h1>
          <p className="text-sm text-slate-400">
            Inspect local bytes with pattern-aware color, search, paging, and synchronized ASCII.
          </p>
        </div>
        <div className="text-xs text-slate-500">Files and pasted data stay in this browser.</div>
      </header>

      <div
        className={`glass rounded-md p-3 transition-colors ${dragging ? 'border-cyan-300/70 bg-cyan-400/5' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={onDrop}
      >
        {localFile ? (
          <div className="flex min-h-24 flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-white/15 bg-surface-900/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <FileUp className="text-cyan-300" size={20} />
              <div>
                <div className="font-mono text-sm text-slate-100">{localFile.name}</div>
                <div className="text-xs text-slate-400">
                  {formatSize(localFile.size)} · local file
                </div>
              </div>
            </div>
            <button
              type="button"
              className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-surface-800 px-2.5 py-1.5 text-xs"
              onClick={() => {
                setLocalFile(null);
                setPageOffset(0);
                setSelectedOffset(null);
                setSelectedRegionId(null);
                setMatchCursor(0);
              }}
            >
              <X size={13} />
              Close file
            </button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <textarea
              className="focus-ring h-28 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setSourceError('');
                setPageOffset(0);
                setSelectedOffset(null);
                setSelectedRegionId(null);
                setMatchCursor(0);
              }}
              placeholder="Paste hex, text, base64, or binary"
              spellCheck={false}
            />
            <button
              type="button"
              className="focus-ring flex min-h-20 items-center justify-center gap-2 rounded-md border border-dashed border-white/15 bg-surface-900/30 px-5 text-xs text-slate-300 hover:bg-white/5"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={16} />
              Open or drop file
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          onChange={onFileChange}
          aria-label="Open a local file"
        />
        {(sourceError || decoded.error) && (
          <div className="mt-2 text-xs text-rose-300">{sourceError || decoded.error}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
        <Stat label="Bytes" value={summary.byteCount.toLocaleString()} />
        <Stat label="Encoding" value={decoded.detectedEncoding} />
        <Stat label="Entropy" value={`${summary.entropy.toFixed(2)} / 8`} />
        <Stat label="Printable" value={formatPercent(summary.printableCount, summary.byteCount)} />
        <Stat label="Null bytes" value={formatPercent(summary.nullCount, summary.byteCount)} />
        <Stat label="Unique" value={`${summary.uniqueCount} / 256`} />
        <Stat
          label="Top byte"
          value={
            summary.mostCommon[0]
              ? `0x${summary.mostCommon[0].value.toString(16).padStart(2, '0')} × ${summary.mostCommon[0].count.toLocaleString()}`
              : '—'
          }
        />
      </div>

      {structure.format !== 'unknown' && (
        <BinaryStructureMap
          structure={structure}
          selectedRegion={selectedRegion}
          onSelect={(region) => {
            setSelectedRegionId(region.id);
            focusOffset(region.offset);
          }}
        />
      )}

      <div className="glass flex flex-wrap items-center gap-2 rounded-md p-2 text-xs">
        {!localFile && (
          <Control label="Read as">
            <select
              className="control-select"
              value={inputEncoding}
              onChange={(event) => {
                setInputEncoding(event.target.value as ByteInputEncoding);
                setPageOffset(0);
                setSelectedOffset(null);
                setSelectedRegionId(null);
                setMatchCursor(0);
              }}
            >
              <option value="auto">Auto</option>
              <option value="text">Text / UTF-8</option>
              <option value="hex">Hex</option>
              <option value="base64">Base64</option>
              <option value="binary">Binary bits</option>
            </select>
          </Control>
        )}
        <Control label="Color">
          <select
            className="control-select"
            value={colorMode}
            onChange={(event) => setColorMode(event.target.value as ByteColorMode)}
          >
            <option value="nibble">Byte spectrum</option>
            <option value="semantic">Byte meaning</option>
            <option value="none">Off</option>
          </select>
        </Control>
        <Control label="Columns">
          <select
            className="control-select"
            value={bytesPerLine}
            onChange={(event) => setBytesPerLine(Number(event.target.value))}
          >
            {[8, 16, 24, 32].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Control>
        <Control label="Address">
          <select
            className="control-select"
            value={offsetBase}
            onChange={(event) => setOffsetBase(Number(event.target.value) as 10 | 16)}
          >
            <option value={16}>Hex</option>
            <option value={10}>Decimal</option>
          </select>
        </Control>
        <Control label="Window">
          <select
            className="control-select"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number]);
              setPageOffset(0);
            }}
          >
            {PAGE_SIZES.map((value) => (
              <option key={value} value={value}>
                {formatSize(value)}
              </option>
            ))}
          </select>
        </Control>
        <label className="ml-auto inline-flex items-center gap-2 rounded px-2 py-1 text-slate-300">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(event) => setUppercase(event.target.checked)}
          />
          Uppercase
        </label>
      </div>

      <div className="glass grid gap-2 rounded-md p-2 xl:grid-cols-[minmax(18rem,1fr)_auto_auto]">
        <div className="flex min-w-0 items-center gap-2">
          <Search className="shrink-0 text-slate-500" size={14} />
          <select
            className="control-select"
            value={searchEncoding}
            onChange={(event) => {
              setSearchEncoding(event.target.value as 'hex' | 'text');
              setMatchCursor(0);
            }}
            aria-label="Search encoding"
          >
            <option value="hex">Hex</option>
            <option value="text">Text</option>
          </select>
          <input
            className="focus-ring min-w-0 flex-1 rounded border border-white/10 bg-surface-900/60 px-2 py-1.5 font-mono text-xs"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setMatchCursor(0);
            }}
            placeholder={searchEncoding === 'hex' ? 'de ad be ef' : 'needle'}
            aria-label="Search bytes"
          />
          <span
            className={`whitespace-nowrap ${search.error ? 'text-rose-300' : 'text-slate-400'}`}
          >
            {search.error ||
              (searchInput
                ? `${search.matches.length === MAX_SEARCH_MATCHES ? '1000+' : search.matches.length} match${search.matches.length === 1 ? '' : 'es'}`
                : 'Search bytes')}
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={() => moveMatch(-1)}
            disabled={search.matches.length === 0}
            aria-label="Previous match"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => moveMatch(1)}
            disabled={search.matches.length === 0}
            aria-label="Next match"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const offset = parseJumpOffset(jumpInput);
            if (offset !== null) {
              focusOffset(offset);
            }
          }}
        >
          <span className="text-slate-400">Jump</span>
          <input
            className="focus-ring w-28 rounded border border-white/10 bg-surface-900/60 px-2 py-1.5 font-mono text-xs"
            value={jumpInput}
            onChange={(event) => setJumpInput(event.target.value)}
            placeholder="0x100 / 256"
            aria-label="Jump to byte offset"
          />
        </form>

        <button
          type="button"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-surface-800 px-3 py-1.5 text-xs disabled:opacity-40"
          onClick={() => void copyVisibleDump()}
          disabled={!visibleDump}
        >
          <Clipboard size={13} />
          {copied ? 'Copied' : 'Copy window'}
        </button>
      </div>

      {colorMode !== 'none' && <ByteLegend mode={colorMode} />}

      <div className="glass rounded-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs text-slate-400">
          <span>
            {bytes.length === 0
              ? 'No bytes'
              : `${visibleOffset.toLocaleString()}–${Math.max(visibleOffset, pageEnd - 1).toLocaleString()} of ${bytes.length.toLocaleString()}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="icon-button"
              onClick={() => setPageOffset(Math.max(0, visibleOffset - pageSize))}
              disabled={visibleOffset === 0}
              aria-label="Previous byte window"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-20 text-center">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              className="icon-button"
              onClick={() =>
                setPageOffset(Math.min((pageCount - 1) * pageSize, visibleOffset + pageSize))
              }
              disabled={visibleOffset + pageSize >= bytes.length}
              aria-label="Next byte window"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="max-h-[48vh] overflow-auto p-3 font-mono text-xs">
          {rows.length === 0 ? (
            <div className="py-10 text-center font-sans text-sm text-slate-500">
              Paste data or open a local file to inspect its bytes.
            </div>
          ) : (
            <div className="w-max min-w-full" role="table" aria-label="Hexdump">
              <div className="mb-1 flex items-center text-[10px] uppercase tracking-[0.1em] text-slate-600">
                <span className="w-20 shrink-0">Address</span>
                <span
                  style={{
                    width: `${bytesPerLine * 1.625 + Math.floor((bytesPerLine - 1) / 4) * 0.5}rem`,
                  }}
                >
                  Hex bytes
                </span>
                <span className="ml-4 border-l border-white/10 pl-3">ASCII</span>
              </div>
              {rows.map((row) => (
                <HexdumpRowView
                  key={row.offset}
                  row={row}
                  bytesPerLine={bytesPerLine}
                  colorMode={colorMode}
                  highlightedOffsets={highlightedOffsets}
                  activeMatch={activeMatch}
                  activeMatchLength={search.needleLength}
                  selectedOffset={selectedOffset}
                  selectedRegion={selectedRegion}
                  onSelect={(offset) => {
                    setSelectedOffset(offset);
                    const region = structure.regions.find(
                      (candidate) =>
                        offset >= candidate.offset && offset < candidate.offset + candidate.length,
                    );
                    setSelectedRegionId(region?.id ?? null);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedByte !== null && selectedOffset !== null && (
        <div className="glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md px-3 py-2 font-mono text-xs">
          <span className="font-sans uppercase tracking-[0.12em] text-slate-500">
            Selected byte
          </span>
          <ByteFact label="Offset" value={`0x${selectedOffset.toString(16)} · ${selectedOffset}`} />
          <ByteFact label="Hex" value={`0x${selectedByte.toString(16).padStart(2, '0')}`} />
          <ByteFact label="Unsigned" value={selectedByte.toString()} />
          <ByteFact
            label="Signed"
            value={(selectedByte > 127 ? selectedByte - 256 : selectedByte).toString()}
          />
          <ByteFact label="Binary" value={selectedByte.toString(2).padStart(8, '0')} />
          <ByteFact
            label="ASCII"
            value={
              selectedByte >= 32 && selectedByte <= 126 ? String.fromCharCode(selectedByte) : '·'
            }
          />
          {selectedRegion && <ByteFact label="Region" value={selectedRegion.label} />}
        </div>
      )}
    </section>
  );
}

function HexdumpRowView({
  row,
  bytesPerLine,
  colorMode,
  highlightedOffsets,
  activeMatch,
  activeMatchLength,
  selectedOffset,
  selectedRegion,
  onSelect,
}: {
  row: ReturnType<typeof buildHexdumpRows>[number];
  bytesPerLine: number;
  colorMode: ByteColorMode;
  highlightedOffsets: Set<number>;
  activeMatch: number | null;
  activeMatchLength: number;
  selectedOffset: number | null;
  selectedRegion: BinaryRegion | null;
  onSelect: (offset: number) => void;
}) {
  const cells = Array.from({ length: bytesPerLine }, (_, index) => row.cells[index] ?? null);
  const isActiveMatch = (offset: number) =>
    activeMatch !== null && offset >= activeMatch && offset < activeMatch + activeMatchLength;
  const isInSelectedRegion = (offset: number) =>
    selectedRegion !== null &&
    offset >= selectedRegion.offset &&
    offset < selectedRegion.offset + selectedRegion.length;

  return (
    <div className="flex h-6 items-center" role="row">
      <span className="w-20 shrink-0 select-none text-slate-600">{row.offsetLabel}</span>
      <div className="flex">
        {cells.map((cell, column) =>
          cell ? (
            <button
              key={cell.index}
              type="button"
              className={`byte-hex-cell ${column > 0 && column % 4 === 0 ? 'ml-2' : ''} ${isInSelectedRegion(cell.index) ? 'byte-structure-selected' : ''} ${highlightedOffsets.has(cell.index) ? 'byte-search-hit' : ''} ${isActiveMatch(cell.index) ? 'byte-active-match' : ''} ${selectedOffset === cell.index ? 'byte-selected' : ''}`}
              style={{ color: getByteColorToken(cell.value, colorMode) ?? undefined }}
              onClick={() => onSelect(cell.index)}
              title={`Offset 0x${cell.index.toString(16)} · ${cell.value}`}
              aria-label={`Offset ${cell.index}, byte ${cell.hex}`}
            >
              {cell.hex}
            </button>
          ) : (
            <span
              key={`blank-${column}`}
              className={`byte-hex-cell invisible ${column > 0 && column % 4 === 0 ? 'ml-2' : ''}`}
            >
              00
            </span>
          ),
        )}
      </div>
      <div className="ml-4 flex border-l border-white/10 pl-3">
        {cells.map((cell, column) =>
          cell ? (
            <button
              key={cell.index}
              type="button"
              className={`byte-ascii-cell ${isInSelectedRegion(cell.index) ? 'byte-structure-selected' : ''} ${highlightedOffsets.has(cell.index) ? 'byte-search-hit' : ''} ${isActiveMatch(cell.index) ? 'byte-active-match' : ''} ${selectedOffset === cell.index ? 'byte-selected' : ''}`}
              style={{ color: getByteColorToken(cell.value, colorMode) ?? undefined }}
              onClick={() => onSelect(cell.index)}
              tabIndex={-1}
              aria-label={`Select offset ${cell.index} from ASCII preview`}
            >
              {cell.ascii}
            </button>
          ) : (
            <span key={`ascii-blank-${column}`} className="byte-ascii-cell invisible">
              .
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function BinaryStructureMap({
  structure,
  selectedRegion,
  onSelect,
}: {
  structure: ReturnType<typeof inspectBinaryStructure>;
  selectedRegion: BinaryRegion | null;
  onSelect: (region: BinaryRegion) => void;
}) {
  return (
    <section className="glass rounded-md p-3" aria-label="Detected binary structure">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">{structure.label}</h2>
            <span className="rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-cyan-200">
              {structure.format}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{structure.summary}</p>
        </div>
        <span className="text-[11px] text-slate-500">
          {structure.regions.length} mapped region{structure.regions.length === 1 ? '' : 's'}
          {structure.truncated ? ' · list capped' : ''}
        </span>
      </div>

      <div className="mt-3 flex min-h-8 w-full overflow-hidden rounded border border-white/10 bg-surface-950/50">
        {structure.regions.map((region) => (
          <button
            key={region.id}
            type="button"
            className={`binary-map-segment binary-map-${region.kind} focus-ring min-w-1 ${selectedRegion?.id === region.id ? 'binary-map-active' : ''}`}
            style={{
              flexGrow: Math.max(1, region.length),
              flexBasis: 0,
            }}
            onClick={() => onSelect(region)}
            title={`${region.label} · 0x${region.offset.toString(16)}–0x${Math.max(region.offset, region.offset + region.length - 1).toString(16)}`}
            aria-label={`Select ${region.label}`}
          />
        ))}
      </div>

      <div className="mt-2 grid max-h-40 gap-1 overflow-auto sm:grid-cols-2 xl:grid-cols-3">
        {structure.regions.map((region) => (
          <button
            key={region.id}
            type="button"
            className={`focus-ring flex min-w-0 items-center gap-2 rounded border px-2 py-1.5 text-left text-xs ${
              selectedRegion?.id === region.id
                ? 'border-cyan-400/50 bg-cyan-500/10'
                : 'border-white/10 bg-surface-900/30 hover:bg-white/5'
            }`}
            onClick={() => onSelect(region)}
          >
            <span className={`binary-map-dot binary-map-${region.kind}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-slate-200">{region.label}</span>
              <span className="block truncate text-[10px] text-slate-500">{region.detail}</span>
            </span>
            <span className="shrink-0 font-mono text-[10px] text-slate-500">
              0x{region.offset.toString(16)}
            </span>
          </button>
        ))}
      </div>

      {structure.warnings.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-amber-300">
          {structure.warnings.slice(0, 5).map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2 text-slate-400">
      {label}
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-md px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-0.5 truncate font-mono text-sm text-slate-200">{value}</div>
    </div>
  );
}

function ByteFact({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="mr-1.5 font-sans text-slate-500">{label}</span>
      <span className="text-slate-200">{value}</span>
    </span>
  );
}

function ByteLegend({ mode }: { mode: Exclude<ByteColorMode, 'none'> }) {
  const items =
    mode === 'nibble'
      ? [
          { label: '00', value: 0 },
          ...Array.from({ length: 16 }, (_, nibble) => ({
            label: `${nibble.toString(16).toUpperCase()}x`,
            value: nibble * 16 + (nibble === 0 ? 1 : 0),
          })),
          { label: 'ff', value: 0xff },
        ]
      : [
          { label: 'null', value: 0 },
          { label: 'control', value: 1 },
          { label: 'space', value: 0x20 },
          { label: 'printable', value: 0x41 },
          { label: 'non-ASCII', value: 0x80 },
        ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 font-mono text-[11px]">
      <span className="font-sans uppercase tracking-[0.12em] text-slate-600">Legend</span>
      {items.map((item) => (
        <span
          key={item.label}
          style={{ color: getByteColorToken(item.value, mode) ?? undefined }}
          title={mode === 'nibble' ? `Bytes beginning with ${item.label.at(0)}` : item.label}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
