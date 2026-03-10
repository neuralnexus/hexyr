import { useMemo, useState } from 'react';
import { generateAsciiText, imageDataToAscii, type AsciiTextFont } from '../../../shared/analysis';

const FONT_OPTIONS: AsciiTextFont[] = ['block', 'slant', 'shadow', 'outline', 'double', 'mini'];

export function AsciiArtPage() {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('HEXYR');
  const [font, setFont] = useState<AsciiTextFont>('block');
  const [onChar, setOnChar] = useState('#');
  const [offChar, setOffChar] = useState(' ');

  const [imageWidth, setImageWidth] = useState(96);
  const [charset, setCharset] = useState(' .:-=+*#%@');
  const [invert, setInvert] = useState(false);
  const [imageAscii, setImageAscii] = useState('');
  const [imageStatus, setImageStatus] = useState('Upload a photo to convert into ASCII art.');

  const textAscii = useMemo(
    () => generateAsciiText(textInput, { font, onChar: onChar.slice(0, 1), offChar: offChar.slice(0, 1) }),
    [textInput, font, onChar, offChar],
  );

  const copyOutput = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const handleImageUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Unable to decode image'));
        img.src = url;
      });

      const width = Math.max(16, Math.min(240, imageWidth));
      const height = Math.max(8, Math.round((image.height / image.width) * width * 0.5));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.drawImage(image, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const ascii = imageDataToAscii(imageData.data, width, height, { charset, invert });
      setImageAscii(ascii);
      setImageStatus(`Converted ${file.name} (${width}x${height}). Original image discarded from memory.`);
    } catch (err) {
      setImageStatus(err instanceof Error ? err.message : 'Failed to convert image');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">ASCII Art Generator</h1>
      <p className="text-sm text-slate-400">Generate ASCII from text or photos using lightweight local processing only.</p>

      <div className="flex gap-2 text-sm">
        <button type="button" className={`focus-ring rounded border px-3 py-1.5 ${mode === 'text' ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-surface-800'}`} onClick={() => setMode('text')}>Text</button>
        <button type="button" className={`focus-ring rounded border px-3 py-1.5 ${mode === 'image' ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-surface-800'}`} onClick={() => setMode('image')}>Image</button>
      </div>

      {mode === 'text' ? (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <input className="focus-ring rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm md:col-span-2" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type text" />
            <select className="focus-ring rounded border border-white/10 bg-surface-900/60 px-3 py-2 text-sm" value={font} onChange={(e) => setFont(e.target.value as AsciiTextFont)}>
              {FONT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="focus-ring rounded border border-white/10 bg-surface-900/60 px-2 py-2 font-mono text-sm" value={onChar} onChange={(e) => setOnChar(e.target.value)} placeholder="on" maxLength={1} />
              <input className="focus-ring rounded border border-white/10 bg-surface-900/60 px-2 py-2 font-mono text-sm" value={offChar} onChange={(e) => setOffChar(e.target.value)} placeholder="off" maxLength={1} />
            </div>
          </div>
          <button type="button" className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2 text-sm" onClick={() => void copyOutput(textAscii)}>Copy ASCII</button>
          <pre className="max-h-[60vh] overflow-auto rounded border border-white/10 bg-surface-900/50 p-3 font-mono text-[11px] leading-[1.1] text-cyan-100">{textAscii}</pre>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <input type="number" min={16} max={240} value={imageWidth} onChange={(e) => setImageWidth(Number.parseInt(e.target.value, 10) || 96)} className="focus-ring rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" placeholder="Width chars" />
            <input className="focus-ring rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm md:col-span-2" value={charset} onChange={(e) => setCharset(e.target.value)} placeholder="Charset ramp" />
            <label className="flex items-center gap-2 rounded border border-white/10 bg-surface-900/60 px-3 py-2 text-sm">
              <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} /> Invert
            </label>
          </div>
          <input
            type="file"
            accept="image/*"
            className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleImageUpload(file);
              }
              e.currentTarget.value = '';
            }}
          />
          <p className="text-xs text-slate-400">{imageStatus}</p>
          {imageAscii && <button type="button" className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2 text-sm" onClick={() => void copyOutput(imageAscii)}>Copy ASCII</button>}
          {imageAscii && <pre className="max-h-[60vh] overflow-auto rounded border border-white/10 bg-surface-900/50 p-3 font-mono text-[10px] leading-[1] text-cyan-100">{imageAscii}</pre>}
        </div>
      )}
    </section>
  );
}
