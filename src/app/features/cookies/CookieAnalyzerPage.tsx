import { useMemo, useState } from 'react';
import { parseSetCookieHeaders } from '../../../shared/parsing';

const COOKIE_MONSTER_ASCII = `nnjejw                                    
                               0eje000e0ee0           e     w wnj0j0                                
                            0jnwwrrwwrrrrwnn0   e   j   EAA   wwwwwn01                              
                           ernrwrwwrrrjnnnnrrejEAEA   AAAAAAA  nnnrwrn0w                            
                         rjn  rwrrwn      rrnn  AE   AAAEAAAAA nnrnrwrre                            
                         jnwrwrrrn   RAAA   njr W  n AAAAAAEAA nrrrrnwrrj                           
                         wwwwwrrn  AAAAAAAA  nn Nwnj AAAAAAAA  rjjnrrrr  AAAAIEeA                   
                 rw II1A   wwrrrn AAEAAAAAAA nn Nrwn    AAA   njrnrnwwww 6w 6nENrnrRj               
                     jreA nwwwwwr AAAAAAAAAA rj w  nrn      nrnnrwrrrnww AER 1EeRWe6                
               REENIAAA A  wrrnnn  AAAAAAAA  rw AA  rnwnnrnrnrrrrrwrr r  ewnw1  ENN1AA n            
              6nRWNjnjR AA w wrwnr    AA       jAIA  wnrwrnnjwrrrwrww   AAAAAAAAA w6      w         
           E0NNEA1AAAw EAEIA   rrrn0w        RAA0IAAe   rr wrwn www   AIjjnj  nW A1EAIEW            
         r6EEw Ir   W60 w6 jRN  w   w  wnn AAAE AEeE eA6nj6nn  wrej AWAAEAA AAnWnN wWRAEEANA        
       enIAw Arn A 1NIRRAEAAIAA EAEeeIRAjrAwN1AIAjjA0AAA 1ERAIAA111AAAenjwnj6 A1 1eN16 NERre        
       IA   wRNARNERA 00 n6  njjrj1AAArAAEA1Ajee 1jjjjjrNN0r6jew10Wj6 AWeENEAAj nA ej6A wNIEA1E     
     Rrjnnn  00njwnWwrA0 611NINAEejnjjejj1ARn6We1AeIE6rrArenjnArAw EA1R1A1 IwjEAn  AEw11je wRjREA   
     NE EWw1w E6rA  0Aw En6WNwERIr0NjAj0ejAjEEIIIAwNA6AnAE6AAIEjNrAAEA6jjwA6R1E  NA  1 ejenn1j ww   
  AIRA IRNWrE RRAIjr  WE rNejEAj0A1AIWEAArj0ARAAeN6A0NNRAjN0n6A6EE nN06WREe6E0 6An rA1AAAN6 eNn0N1E 
     jj  jj  jj jE jjnnjjjjjrrrrnrnrNn1 nr6Nrnrj6r0j jn1nnjn1njrnrjrwr jn  rn errjjjnnr j jjwe0w  w`;

export function CookieAnalyzerPage() {
  const [input, setInput] = useState('Set-Cookie: sid=abc123; Path=/; HttpOnly; Secure; SameSite=Lax');
  const result = useMemo(() => parseSetCookieHeaders(input), [input]);

  return (
    <section className="animate-rise relative space-y-3 overflow-hidden pb-24">
      <h1 className="text-lg font-semibold text-slate-100">Cookie / Jar Analyzer</h1>
      <textarea className="focus-ring h-40 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste Set-Cookie lines" />
      <div className="glass rounded-md p-3 text-xs">
        {result.errors.length > 0 && <ul className="mb-2 list-disc space-y-1 pl-4 text-red-300">{result.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {result.cookies.map((cookie) => (
          <div key={cookie.name} className="mb-2 rounded border border-white/10 p-2">
            <div className="font-mono text-slate-200">{cookie.name}</div>
            {cookie.warnings.length === 0 ? <p className="text-emerald-300">No warnings</p> : <ul className="list-disc space-y-1 pl-4 text-amber-300">{cookie.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
          </div>
        ))}
      </div>
      <pre
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 right-1 z-10 origin-bottom-right scale-[0.26] whitespace-pre font-mono text-[10px] leading-[1] text-cyan-200/45 sm:scale-[0.34] md:scale-[0.42]"
      >
        {COOKIE_MONSTER_ASCII}
      </pre>
    </section>
  );
}
