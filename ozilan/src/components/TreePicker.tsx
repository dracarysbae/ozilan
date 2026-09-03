"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import type { Node } from "@/data/tree";
import { childrenOf, labelPath } from "@/data/tree";
import { normalize } from "@/lib/format";

/* ────────────────────────────────────────────────────────────────────
   Kademeli kategori seçici: Marka → Seri → Model / paket
   Ağacın derinliği ne olursa olsun çalışır, seviye adları dışarıdan gelir.
   ──────────────────────────────────────────────────────────────────── */

type Props = {
  tree: Node[];
  labels: string[];
  path: string[];
  onChange: (path: string[]) => void;
  /** her düğüm için ilan sayısı — verilirse rakam gösterilir */
  countFor?: (path: string[]) => number;
  /** listelerin en yüksek boyu */
  maxHeight?: string;
  compact?: boolean;
};

export function TreePicker({ tree, labels, path, onChange, countFor, maxHeight = "17rem", compact }: Props) {
  const [term, setTerm] = useState("");
  const level = useMemo(() => childrenOf(tree, path), [tree, path]);
  const crumbs = useMemo(() => labelPath(tree, path), [tree, path]);
  const listRef = useRef<HTMLDivElement>(null);

  // bir kademe ilerlediğimizde arama kutusu sıfırlansın, liste başa dönsün
  useEffect(() => { setTerm(""); if (listRef.current) listRef.current.scrollTop = 0; }, [path.length, path.join(".")]);

  const shown = useMemo(() => {
    if (!term.trim()) return level;
    const n = normalize(term);
    return level.filter((x) => normalize(x.label).includes(n));
  }, [level, term]);

  const levelName = labels[path.length] ?? "Alt seçim";
  const searchable = level.length > 9;

  return (
    <div className={compact ? "" : "rounded-lg border border-line bg-paper-2"}>
      {/* seçilen dal — geri dönmek için tıklanabilir */}
      {crumbs.length > 0 && (
        <div className={`flex flex-wrap items-center gap-1 ${compact ? "mb-2" : "border-b border-line p-2.5"}`}>
          <button
            onClick={() => onChange([])}
            className="rounded px-1.5 py-0.5 text-2xs text-mute transition hover:bg-paper-3 hover:text-ink"
          >
            Tümü
          </button>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-mute-2" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
              <button
                onClick={() => onChange(path.slice(0, i + 1))}
                className={`rounded px-1.5 py-0.5 text-2xs transition hover:bg-paper-3 ${i === crumbs.length - 1 ? "bg-signal-soft font-medium text-signal-ink" : "text-mute hover:text-ink"}`}
              >
                {c}
              </button>
            </span>
          ))}
        </div>
      )}

      {level.length === 0 ? (
        <p className={`text-2xs text-mute ${compact ? "" : "p-3"}`}>
          Seçim tamamlandı. Daraltmak için yukarıdan bir üst kademeye dönebilirsiniz.
        </p>
      ) : (
        <div className={compact ? "" : "p-2.5"}>
          {!compact && (
            <div className="mb-2 flex items-baseline justify-between">
              <span className="eyebrow !text-ink">{levelName}</span>
              <span className="num text-2xs text-mute-2">{level.length}</span>
            </div>
          )}

          {searchable && (
            <div className="relative mb-2">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute-2" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={`${levelName} ara…`}
                className="field !py-1.5 !pl-8 text-[0.8rem]"
              />
            </div>
          )}

          <div ref={listRef} className="overflow-auto pr-1" style={{ maxHeight }}>
            {shown.length === 0 && <p className="py-2 text-2xs text-mute">Eşleşen kayıt yok.</p>}
            {shown.map((n) => {
              const next = [...path, n.slug];
              const c = countFor?.(next);
              const leaf = !n.kids?.length;
              return (
                <button
                  key={n.slug}
                  onClick={() => onChange(next)}
                  className="group flex w-full items-center gap-2 rounded px-1.5 py-[5px] text-left text-[0.84rem] transition hover:bg-paper-3"
                >
                  <span className="flex-1 truncate group-hover:text-signal">{n.label}</span>
                  {c != null && <span className="num text-2xs text-mute-2">{c}</span>}
                  {!leaf && (
                    <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-mute-2 transition group-hover:translate-x-0.5 group-hover:text-signal" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* İlan detayında / kartlarda yolu gösteren şerit */
export function PathTrail({ labels, className = "", onClick }: { labels?: string[]; className?: string; onClick?: (i: number) => void }) {
  if (!labels?.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 ${className}`}>
      {labels.map((l, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-mute-2">›</span>}
          {onClick ? (
            <button onClick={() => onClick(i)} className="transition hover:text-signal">{l}</button>
          ) : (
            <span>{l}</span>
          )}
        </span>
      ))}
    </div>
  );
}
