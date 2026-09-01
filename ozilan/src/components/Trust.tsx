"use client";
import type { TrustRead } from "@/lib/trust";

const TONE: Record<TrustRead["grade"], string> = {
  A: "border-moss text-moss",
  B: "border-line-strong text-ink",
  C: "border-gold text-gold",
  D: "border-signal text-signal",
};

export function TrustChip({ t, compact = false }: { t: TrustRead; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border px-1.5 h-[22px] font-mono text-2xs uppercase tracking-[0.1em] ${TONE[t.grade]}`}
      title={`Güven skoru ${t.score}/100`}>
      <span className="font-bold">{t.grade}</span>
      {!compact && <span className="opacity-70">{t.score}</span>}
    </span>
  );
}

export function TrustPanel({ t }: { t: TrustRead }) {
  return (
    <div className="border border-line">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="eyebrow">Güven analizi</span>
        <div className="flex items-baseline gap-2">
          <span className="num text-2xl leading-none">{t.score}</span>
          <span className="font-mono text-2xs text-mute">/100</span>
          <TrustChip t={t} compact />
        </div>
      </div>
      <div className="h-[3px] w-full bg-line">
        <div className={`h-full ${t.grade === "D" ? "bg-signal" : t.grade === "C" ? "bg-gold" : "bg-moss"}`}
          style={{ width: `${t.score}%` }} />
      </div>
      <ul className="divide-y divide-line">
        {t.flags.map((f, i) => (
          <li key={i} className="flex gap-2.5 px-4 py-2.5 text-[0.8rem]">
            <span className={`mt-[6px] h-1.5 w-1.5 shrink-0 ${f.level === "risk" ? "bg-signal" : f.level === "warn" ? "bg-gold" : "bg-line-strong"}`} />
            <span className={f.level === "risk" ? "text-signal-ink" : "text-ink"}>{f.text}</span>
          </li>
        ))}
        {t.positives.map((p, i) => (
          <li key={`p${i}`} className="flex gap-2.5 px-4 py-2.5 text-[0.8rem] text-mute">
            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 bg-moss" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-line bg-paper-2/60 px-4 py-2.5 text-[0.7rem] leading-relaxed text-mute">
        Skor; satıcı geçmişi, ilan bütünlüğü, fiyatın piyasa bandına uzaklığı ve kopya ilan taraması ile hesaplanır.
        Satın alma kararının tek ölçütü değildir.
      </p>
    </div>
  );
}
