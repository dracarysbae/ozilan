"use client";
import { useMemo, useState } from "react";
import type { Query } from "@/lib/search";
import type { Listing } from "@/lib/types";
import { CATEGORIES, attrsFor, findSub } from "@/data/taxonomy";
import { GEO, CITIES } from "@/data/geo";
import { num } from "@/lib/format";

type Props = { q: Query; set: (patch: Partial<Query>) => void; pool: Listing[]; base: Listing[] };

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="eyebrow !text-ink">{title}</span>
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-mute transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Check({ on, label, count, onClick }: { on: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 py-1 text-left text-[0.84rem] hover:text-signal">
      <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center border transition ${on ? "border-ink bg-ink" : "border-line-strong"}`}>
        {on && <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-paper" fill="none" stroke="currentColor" strokeWidth="4"><path d="M4 12l6 6L20 6" /></svg>}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count != null && <span className="num text-2xs text-mute">{count}</span>}
    </button>
  );
}

export function Filters({ q, set, pool, base }: Props) {
  const cat = q.cat ? CATEGORIES.find((c) => c.slug === q.cat) : undefined;
  const sub = q.cat && q.sub ? findSub(q.cat, q.sub) : undefined;
  const defs = q.cat && q.sub ? attrsFor(q.cat, q.sub) : [];

  const countFor = (fn: (l: Listing) => boolean) => base.filter(fn).length;

  const districts = q.city ? GEO[q.city] ?? [] : [];

  const toggleAttr = (key: string, val: string) => {
    const cur = q.attrs[key] ?? [];
    const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
    const attrs = { ...q.attrs };
    if (next.length) attrs[key] = next; else delete attrs[key];
    set({ attrs });
  };

  const setRange = (key: string, lo?: number, hi?: number) => {
    const ranges = { ...q.ranges };
    if (lo == null && hi == null) delete ranges[key];
    else ranges[key] = [lo, hi];
    set({ ranges });
  };

  const priceMarks = useMemo(() => {
    const p = base.filter((l) => l.price > 0).map((l) => l.price).sort((a, b) => a - b);
    if (!p.length) return null;
    return { min: p[0], max: p[p.length - 1] };
  }, [base]);

  return (
    <div className="text-ink">
      <Section title="Kategori">
        <div className="space-y-1">
          <Check on={!q.cat} label="Tüm kategoriler" count={base.length} onClick={() => set({ cat: undefined, sub: undefined, attrs: {}, ranges: {} })} />
          {CATEGORIES.map((c) => (
            <div key={c.slug}>
              <Check on={q.cat === c.slug} label={c.label} count={countFor((l) => l.cat === c.slug)}
                onClick={() => set({ cat: q.cat === c.slug ? undefined : c.slug, sub: undefined, attrs: {}, ranges: {} })} />
              {q.cat === c.slug && (
                <div className="ml-6 mt-1 space-y-1 border-l border-line pl-3">
                  {c.subs.map((s) => (
                    <Check key={s.slug} on={q.sub === s.slug} label={s.label} count={countFor((l) => l.sub === s.slug)}
                      onClick={() => set({ sub: q.sub === s.slug ? undefined : s.slug, attrs: {}, ranges: {} })} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {cat?.dealTypes && (
        <Section title="İşlem türü">
          <div className="flex flex-wrap gap-1.5">
            {cat.dealTypes.map((d) => (
              <button key={d} onClick={() => set({ deal: q.deal === d ? undefined : d })}
                className={q.deal === d ? "chip-on" : "chip hover:border-ink"}>{d}</button>
            ))}
          </div>
        </Section>
      )}

      <Section title="Konum">
        <select value={q.city ?? ""} onChange={(e) => set({ city: e.target.value || undefined, district: undefined })} className="field">
          <option value="">Tüm Türkiye</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {districts.length > 0 && (
          <select value={q.district ?? ""} onChange={(e) => set({ district: e.target.value || undefined })} className="field mt-2">
            <option value="">Tüm ilçeler</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </Section>

      <Section title="Fiyat aralığı">
        <div className="flex items-center gap-2">
          <input type="number" inputMode="numeric" placeholder={priceMarks ? String(priceMarks.min) : "en az"}
            value={q.min ?? ""} onChange={(e) => set({ min: e.target.value ? +e.target.value : undefined })}
            className="field num !py-2 text-[0.8rem]" />
          <span className="text-mute">–</span>
          <input type="number" inputMode="numeric" placeholder={priceMarks ? String(priceMarks.max) : "en çok"}
            value={q.max ?? ""} onChange={(e) => set({ max: e.target.value ? +e.target.value : undefined })}
            className="field num !py-2 text-[0.8rem]" />
        </div>
        {sub && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[0.25, 0.5, 1].map((f, i) => {
              const hi = Math.round(sub.band[1] * f);
              return (
                <button key={i} onClick={() => set({ min: undefined, max: hi })} className="chip hover:border-ink">
                  ≤ {num(hi)}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {defs.map((d) => {
        if (d.type === "select" && d.options) {
          return (
            <Section key={d.key} title={d.label} defaultOpen={!!d.spotlight}>
              <div className="max-h-56 space-y-1 overflow-auto pr-1">
                {d.options.map((o) => (
                  <Check key={o} on={(q.attrs[d.key] ?? []).includes(o)} label={o}
                    count={countFor((l) => String(l.attrs[d.key]) === o)}
                    onClick={() => toggleAttr(d.key, o)} />
                ))}
              </div>
            </Section>
          );
        }
        if (d.type === "number") {
          const [lo, hi] = q.ranges[d.key] ?? [];
          return (
            <Section key={d.key} title={`${d.label}${d.unit ? ` (${d.unit})` : ""}`} defaultOpen={!!d.spotlight}>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="min" value={lo ?? ""} onChange={(e) => setRange(d.key, e.target.value ? +e.target.value : undefined, hi)} className="field num !py-2 text-[0.8rem]" />
                <span className="text-mute">–</span>
                <input type="number" placeholder="max" value={hi ?? ""} onChange={(e) => setRange(d.key, lo, e.target.value ? +e.target.value : undefined)} className="field num !py-2 text-[0.8rem]" />
              </div>
            </Section>
          );
        }
        if (d.type === "bool") {
          return (
            <div key={d.key} className="border-b border-line py-2.5">
              <Check on={(q.attrs[d.key] ?? []).includes("Evet")} label={d.label}
                count={countFor((l) => l.attrs[d.key] === true)}
                onClick={() => toggleAttr(d.key, "Evet")} />
            </div>
          );
        }
        return null;
      })}

      <Section title="Satıcı">
        <Check on={!!q.verifiedOnly} label="Yalnızca doğrulanmış satıcı" onClick={() => set({ verifiedOnly: !q.verifiedOnly })} />
        <Check on={!!q.photosOnly} label="En az 3 fotoğraflı" onClick={() => set({ photosOnly: !q.photosOnly })} />
      </Section>
    </div>
  );
}
