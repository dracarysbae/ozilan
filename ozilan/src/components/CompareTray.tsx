"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Artwork } from "./Artwork";
import { GaugeInline } from "./MarketGauge";
import { TrustChip } from "./Trust";
import { readMarket } from "@/lib/market";
import { scoreListing } from "@/lib/trust";
import { attrsFor, labelFor } from "@/data/taxonomy";
import { num, tl } from "@/lib/format";

export function CompareTray() {
  const { state, pool, sellers, toggleCompare, clearCompare, ready } = useStore();
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => state.compare.map((id) => pool.find((l) => l.id === id)).filter(Boolean) as typeof pool,
    [state.compare, pool],
  );

  const sameSub = items.length > 1 && items.every((l) => l.sub === items[0].sub);
  const specKeys = useMemo(() => {
    if (!items.length) return [];
    const defs = sameSub ? attrsFor(items[0].cat, items[0].sub) : [];
    return defs.filter((d) => items.some((l) => l.attrs[d.key] !== undefined && l.attrs[d.key] !== ""));
  }, [items, sameSub]);

  if (!ready || items.length === 0) return null;

  return (
    <>
      {/* tepsi */}
      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <div className="panel flex items-center gap-3 py-2 pl-2 pr-3 shadow-pop">
          <div className="flex -space-x-2">
            {items.map((l) => (
              <div key={l.id} className="h-11 w-14 overflow-hidden rounded-md border-2 border-paper-2 shadow-plaque-sm">
                <Artwork seed={l.art} sub={l.sub} kind={String(l.pathLabels?.join(" ") ?? l.attrs.tip ?? "")} className="h-full w-full" />
              </div>
            ))}
          </div>
          <span className="hidden text-[0.82rem] text-mute sm:block">
            <span className="num text-ink">{items.length}</span>/3 ilan seçili
          </span>
          <button onClick={() => setOpen(true)} disabled={items.length < 2}
            className="btn-signal !h-9 disabled:opacity-40 disabled:shadow-none">
            Karşılaştır
          </button>
          <button onClick={clearCompare} aria-label="Listeyi temizle" className="btn-quiet !h-9 !px-3 text-mute">✕</button>
        </div>
      </div>

      {/* tam ekran karşılaştırma */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-auto bg-paper">
          <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="tag-blue">Karşılaştırma</span>
                <h2 className="mt-2 font-serif text-3xl leading-none">Yan yana</h2>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost">Kapat</button>
            </div>

            <div className="mt-6 overflow-x-auto pb-4">
              <table className="w-full min-w-[640px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="w-40 align-bottom pb-3 pr-4 text-left"><span className="eyebrow">İlan</span></th>
                    {items.map((l) => (
                      <th key={l.id} className="pb-3 pl-2 pr-2 text-left font-normal">
                        <div className="panel-flat overflow-hidden">
                          <Artwork seed={l.art} sub={l.sub} kind={String(l.pathLabels?.join(" ") ?? l.attrs.tip ?? "")} className="h-28 w-full" />
                          <div className="p-3">
                            <p className="eyebrow">{l.district}, {l.city}</p>
                            <Link href={`/ilan/?id=${l.id}`} onClick={() => setOpen(false)}
                              className="mt-1 block truncate text-[0.9rem] font-semibold hover:text-signal">{l.title}</Link>
                            <button onClick={() => toggleCompare(l.id)}
                              className="mt-2 font-mono text-2xs text-mute underline underline-offset-4 hover:text-alert">
                              çıkar
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row label="Fiyat">
                    {items.map((l) => {
                      const cheapest = l.price === Math.min(...items.map((x) => x.price));
                      return (
                        <td key={l.id} className="border-b border-line px-2 py-2.5">
                          <span className={`num text-[1.05rem] font-semibold ${cheapest ? "text-moss" : ""}`}>{tl(l.price)}</span>
                          {cheapest && items.length > 1 && <span className="ml-2 rounded-full bg-moss-soft px-2 py-0.5 font-mono text-2xs text-moss">en düşük</span>}
                        </td>
                      );
                    })}
                  </Row>
                  <Row label="Piyasa konumu">
                    {items.map((l) => {
                      const m = readMarket(l, pool);
                      return <td key={l.id} className="border-b border-line px-2 py-2.5">{m && m.confidence !== "low" ? <GaugeInline m={m} /> : <span className="text-mute-2">—</span>}</td>;
                    })}
                  </Row>
                  <Row label="Güven skoru">
                    {items.map((l) => {
                      const t = scoreListing(l, sellers[l.sellerId], pool);
                      return <td key={l.id} className="border-b border-line px-2 py-2.5"><TrustChip t={t} /></td>;
                    })}
                  </Row>
                  <Row label="Kategori">
                    {items.map((l) => <td key={l.id} className="border-b border-line px-2 py-2.5 text-[0.85rem] text-mute">{labelFor(l.cat, l.sub)} · {l.deal}</td>)}
                  </Row>
                  {specKeys.map((d) => (
                    <Row key={d.key} label={d.label}>
                      {items.map((l) => {
                        const v = l.attrs[d.key];
                        const text = v === undefined || v === "" ? "—"
                          : typeof v === "boolean" ? (v ? "Var" : "Yok")
                          : d.type === "number" ? `${d.plain ? String(v) : num(Number(v))}${d.unit ? " " + d.unit : ""}`
                          : String(v);
                        return <td key={l.id} className={`border-b border-line px-2 py-2.5 text-[0.88rem] ${d.type === "number" ? "num" : ""} ${text === "—" || text === "Yok" ? "text-mute-2" : ""}`}>{text}</td>;
                      })}
                    </Row>
                  ))}
                  {!sameSub && (
                    <tr><td colSpan={items.length + 1} className="pt-4 text-[0.8rem] text-mute">
                      Farklı kategorilerden ilanlar seçili — özellik satırları yalnızca aynı alt kategoride gösterilir.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="border-b border-line py-2.5 pr-4 align-middle text-[0.8rem] text-mute">{label}</td>
      {children}
    </tr>
  );
}
