"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseNatural, queryToParams, suggest } from "@/lib/search";
import { useStore } from "@/lib/store";
import { marketSearchHref, type MarketArea } from "@/data/marketplace";

const EXAMPLES = [
  "İzmir Karşıyaka 3+1 daire 5 milyon altı",
  "2018 üzeri otomatik dizel Volkswagen 100 bin km altı",
  "Kadıköy kiralık eşyalı 2+1",
  "sıfır garantili iPhone 30 bin altı",
  "Bodrum villa imarlı arsa",
];

export function Omnibox({ autoFocus = false, big = false, dark = false, marketArea, listingCategory, example }: { autoFocus?: boolean; big?: boolean; dark?: boolean; marketArea?:MarketArea; listingCategory?:string; example?:string }) {
  const router = useRouter();
  const { pool } = useStore();
  const [v, setV] = useState("");
  const [open, setOpen] = useState(false);
  const [ph, setPh] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setPh((p) => (p + 1) % EXAMPLES.length), 4200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const parsed = useMemo(() => (!marketArea&&v.trim().length > 2 ? parseNatural(v) : null), [v,marketArea]);
  const tips = useMemo(() => (!marketArea&&v.trim().length > 1 ? suggest(v, pool.filter(l=>!listingCategory||l.cat===listingCategory)) : []), [v, pool,marketArea,listingCategory]);

  const go = (text = v) => {
    if(marketArea){router.push(marketSearchHref({area:marketArea,query:text.trim()}));setOpen(false);return;}
    const { query } = parseNatural(text);
    if(listingCategory)query.cat=listingCategory;
    const sp = queryToParams(query);
    if (text.trim()&&!listingCategory) sp.set("nl", text.trim());
    router.push(`/arama/?${sp.toString()}`);
    setOpen(false);
  };

  return (
    <div ref={box} className="relative w-full">
      <form
        onSubmit={(e) => { e.preventDefault(); go(); }}
        className={`omnibox-shell flex items-stretch overflow-hidden rounded-full border transition ${
          dark
            ? "omnibox-dark border-white/10 bg-navy-900/70 backdrop-blur-xl"
            : open
              ? "border-line-strong bg-paper-2 shadow-pop"
              : "border-transparent bg-paper-3"
        }`}
      >
        <span className={`grid w-11 shrink-0 place-items-center sm:w-14 ${dark ? "text-white/45" : "text-mute-2"}`}>
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
          </svg>
        </span>
        <input
          value={v}
          autoFocus={autoFocus}
          onChange={(e) => { setV(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={example??EXAMPLES[ph]}
          aria-label={marketArea?"Ürün veya hizmet ara":"Doğal dille arama"}
          className={`min-w-0 flex-1 bg-transparent py-0 outline-none ${
            dark ? "text-white placeholder:text-white/35" : "placeholder:text-mute-2"
          } ${big ? "h-[3.75rem] text-[0.9375rem] sm:h-[4.5rem] sm:text-[1.0625rem]" : "h-10 text-[0.9375rem]"}`}
        />
        <span className={`flex shrink-0 items-center ${big ? "pr-2" : "pr-1.5"}`}>
          <button
            type="submit"
            className={`omnibox-submit group flex items-center gap-2 rounded-full bg-signal font-medium text-white shadow-plaque-blue transition hover:bg-signal-ink ${
              big ? "h-11 px-4 text-[0.875rem] sm:h-14 sm:px-7 sm:text-[0.9375rem]" : "h-8 px-4 text-[0.8125rem]"
            }`}
          >
            Ara
            {big && (
              <svg viewBox="0 0 20 20" className="hidden h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 sm:block" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 10h11M11 6l4 4-4 4" />
              </svg>
            )}
          </button>
        </span>
      </form>

      {open && (parsed?.chips.length || tips.length) ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 animate-rise overflow-hidden rounded-lg border border-line bg-paper-2 shadow-lift">
          {parsed?.chips.length ? (
            <div className="border-b border-line p-3">
              <p className="eyebrow mb-2">Cümleden anlaşılanlar</p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.chips.map((c, i) => (
                  <span key={i} className="chip-on">
                    <span className="opacity-55">{c.kind}</span>{c.label}
                  </span>
                ))}
              </div>
              {parsed.query.q && (
                <p className="mt-2 text-[0.72rem] text-mute">
                  Serbest metin: <span className="text-ink">{parsed.query.q}</span>
                </p>
              )}
            </div>
          ) : null}

          {tips.length ? (
            <ul className="max-h-64 overflow-auto">
              {tips.map((s, i) => (
                <li key={i}>
                  <button type="button" onClick={() => go(s)} className="block w-full truncate px-4 py-2.5 text-left text-[0.9375rem] transition hover:bg-paper-3">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
