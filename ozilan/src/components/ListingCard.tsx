"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { Listing } from "@/lib/types";
import { Artwork } from "./Artwork";
import { GaugeInline } from "./MarketGauge";
import { TrustChip } from "./Trust";
import { readMarket } from "@/lib/market";
import { scoreListing } from "@/lib/trust";
import { useStore } from "@/lib/store";
import { ago, num, tl } from "@/lib/format";
import { attrsFor, labelFor } from "@/data/taxonomy";

function Star({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3.6l2.6 5.6 6 .8-4.4 4.2 1.1 6.1L12 17.4 6.7 20.3l1.1-6.1L3.4 10l6-.8z" />
    </svg>
  );
}

export function CompareButton({ id, className = "" }: { id: string; className?: string }) {
  const { state, toggleCompare } = useStore();
  const on = state.compare.includes(id);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(id); }}
      aria-label={on ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
      title="Karşılaştır"
      className={`grid h-8 w-8 place-items-center rounded-full border transition ${
        on ? "border-signal bg-signal text-white" : "border-line bg-paper-2/95 text-mute hover:border-line-strong hover:text-ink"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 7h12M16 3l4 4-4 4M16 17H4M8 13l-4 4 4 4" />
      </svg>
    </button>
  );
}

export function FavButton({ id, className = "" }: { id: string; className?: string }) {
  const { isFav, toggleFav } = useStore();
  const on = isFav(id);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(id); }}
      aria-label={on ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={`grid h-8 w-8 place-items-center rounded-full border transition ${
        on ? "border-signal bg-signal text-white" : "border-line bg-paper-2/95 text-mute hover:border-line-strong hover:text-ink"
      } ${className}`}
    >
      <Star on={on} />
    </button>
  );
}

function spotlightBits(l: Listing) {
  const defs = attrsFor(l.cat, l.sub).filter((a) => a.spotlight);
  const out: string[] = [];
  for (const d of defs) {
    const v = l.attrs[d.key];
    if (v === undefined || v === "" || v === false) continue;
    if (typeof v === "boolean") out.push(d.label);
    else if (d.type === "number") out.push(`${d.plain ? String(v) : num(Number(v))}${d.unit ? " " + d.unit : ""}`);
    else out.push(String(v));
  }
  return out.slice(0, 5);
}

export function ListingCard({ l, pool, variant = "grid" }: { l: Listing; pool: Listing[]; variant?: "grid" | "row" | "mini" }) {
  const { sellers } = useStore();
  const m = useMemo(() => readMarket(l, pool), [l, pool]);
  const t = useMemo(() => scoreListing(l, sellers[l.sellerId], pool), [l, pool, sellers]);
  const bits = spotlightBits(l);
  const href = `/ilan/?id=${l.id}`;

  if (variant === "mini") {
    return (
      <Link href={href} className="plaque-link group flex gap-3 overflow-hidden p-2">
        <Artwork seed={l.art} sub={l.sub} kind={String(l.attrs.tur ?? l.attrs.tip ?? "")} className="h-14 w-16 shrink-0 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8rem] font-medium leading-snug">{l.title}</p>
          <p className="num mt-1 text-[0.85rem]">{tl(l.price)}</p>
        </div>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link href={href} className="plaque-link group flex flex-col gap-4 overflow-hidden p-3 sm:flex-row sm:items-start">
        <div className="relative w-full shrink-0 overflow-hidden rounded-md sm:w-48">
          <Artwork seed={l.art} sub={l.sub} kind={String(l.attrs.tur ?? l.attrs.tip ?? "")} className="h-40 w-full sm:h-[132px]" label={l.title} />
          <span className="absolute left-0 top-0 bg-ink/85 px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.1em] text-paper">
            {l.deal}
          </span>
          {l.featured && <span className="absolute bottom-0 left-0 bg-signal px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.1em] text-white">Öne çıkan</span>}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">{labelFor(l.cat, l.sub)}</p>
              <h3 className="mt-1 truncate text-[1.05rem] font-medium leading-snug group-hover:text-signal">{l.title}</h3>
            </div>
            <div className="flex gap-1.5"><CompareButton id={l.id} /><FavButton id={l.id} /></div>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.78rem] text-mute">
            {bits.map((b, i) => (
              <span key={i} className="after:ml-3 after:text-line-strong after:content-['·'] last:after:content-['']">{b}</span>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
            <div>
              <p className="num text-xl leading-none">{tl(l.price)}</p>
              {m && m.confidence !== "low" && <div className="mt-2"><GaugeInline m={m} /></div>}
            </div>
            <div className="flex items-center gap-3 text-right">
              <div className="text-[0.72rem] text-mute">
                <p>{l.district}, {l.city}</p>
                <p className="num">{ago(l.bumpedAt)}</p>
              </div>
              <TrustChip t={t} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="plaque-link group flex flex-col overflow-hidden">
      <div className="relative">
        <Artwork seed={l.art} sub={l.sub} kind={String(l.attrs.tur ?? l.attrs.tip ?? "")} className="aspect-[4/3] w-full" label={l.title} />
        <span className="absolute left-0 top-0 bg-ink/85 px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.1em] text-paper">{l.deal}</span>
        <FavButton id={l.id} className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 focus:opacity-100" />
        <CompareButton id={l.id} className="absolute right-2 top-12 opacity-0 transition group-hover:opacity-100 focus:opacity-100" />
        {l.featured && <span className="absolute bottom-0 left-0 bg-signal px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.1em] text-white">Öne çıkan</span>}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="eyebrow">{l.district}, {l.city}</p>
        <h3 className="mt-1.5 line-clamp-2 text-[0.92rem] font-medium leading-snug group-hover:text-signal">{l.title}</h3>
        <p className="mt-1.5 line-clamp-1 text-[0.75rem] text-mute">{bits.join(" · ")}</p>

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between">
            <p className="num text-[1.05rem] leading-none">{tl(l.price)}</p>
            <TrustChip t={t} compact />
          </div>
          <div className="mt-2 flex items-center justify-between">
            {m && m.confidence !== "low" ? <GaugeInline m={m} /> : <span />}
            <span className="num text-2xs text-mute">{ago(l.bumpedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
