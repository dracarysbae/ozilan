"use client";
import type { MarketRead } from "@/lib/market";
import { tl } from "@/lib/format";

const TONE: Record<MarketRead["verdict"], string> = {
  bargain: "text-moss",
  good: "text-moss",
  fair: "text-mute",
  high: "text-gold",
  steep: "text-signal",
};

export function GaugeInline({ m }: { m: MarketRead }) {
  const pct = ((m.position + 1) / 2) * 100;
  return (
    <div className="flex items-center gap-2" title={`${m.n} benzer ilana göre · ortanca ${tl(Math.round(m.median))}`}>
      <div className="relative h-[3px] w-16 bg-line">
        <div className="absolute inset-y-0 left-[28%] w-[44%] bg-line-strong" />
        <div className="absolute -top-[3px] h-[9px] w-[2px] bg-ink transition-all"
          style={{ left: `calc(${Math.max(2, Math.min(98, pct))}% - 1px)` }} />
      </div>
      <span className={`font-mono text-2xs uppercase tracking-[0.08em] ${TONE[m.verdict]}`}>
        {m.delta > 0 ? "+" : ""}{Math.round(m.delta * 100)}%
      </span>
    </div>
  );
}

export function GaugeFull({ m }: { m: MarketRead }) {
  const pct = ((m.position + 1) / 2) * 100;
  return (
    <div className="border border-line bg-paper-2/60 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="eyebrow">Piyasa konumu</span>
        <span className="font-mono text-2xs uppercase tracking-[0.08em] text-mute">
          {m.n} benzer ilan · güven {m.confidence === "high" ? "yüksek" : m.confidence === "mid" ? "orta" : "düşük"}
        </span>
      </div>

      <p className={`mt-2 font-serif text-2xl leading-none ${m.confidence === "low" ? "text-mute" : TONE[m.verdict]}`}>
        {m.confidence === "low" ? "Karşılaştırma verisi sınırlı" : m.label}
      </p>
      <p className="mt-1.5 text-[0.8rem] text-mute">
        Benzer ilanların ortancası <span className="num text-ink">{tl(Math.round(m.median))}</span> ·
        bu ilan <span className="num text-ink">{m.delta > 0 ? "+" : ""}{Math.round(m.delta * 100)}%</span>
      </p>

      <div className="relative mt-5 h-[3px] bg-line">
        <div className="absolute inset-y-0 left-[28%] w-[44%] bg-line-strong" />
        <div className="absolute -top-1 h-[11px] w-[2px] bg-signal"
          style={{ left: `calc(${Math.max(1, Math.min(99, pct))}% - 1px)` }} />
        <div className="absolute -top-[3px] left-1/2 h-[9px] w-px bg-ink/40" />
      </div>
      <div className="mt-2 flex justify-between font-mono text-2xs uppercase tracking-[0.08em] text-mute">
        <span>{tl(Math.round(m.p25))}</span>
        <span className="text-ink">ortanca</span>
        <span>{tl(Math.round(m.p75))}</span>
      </div>
      {m.confidence === "low" && (
        <p className="mt-2 text-[0.78rem] leading-relaxed text-mute">
          Bu ilana yeterince benzeyen ilan bulunamadı; aşağıdaki bant yalnızca kaba bir referanstır.
        </p>
      )}
      {m.basis && (
        <p className="mt-3 border-t border-line pt-2.5 text-[0.72rem] text-mute">
          Karşılaştırma temeli: <span className="text-ink">{m.basis}</span>
        </p>
      )}
    </div>
  );
}
