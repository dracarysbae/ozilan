"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { scoreListing } from "@/lib/trust";
import { readMarket } from "@/lib/market";
import { Artwork } from "@/components/Artwork";
import { TrustChip } from "@/components/Trust";
import { ago, num, tl } from "@/lib/format";
import { labelFor } from "@/data/taxonomy";

type Tab = "risk" | "reports" | "all";

export default function Panel() {
  const { pool, sellers, state, setStatus, resolveReport, me, ready } = useStore();
  const [tab, setTab] = useState<Tab>("risk");
  const [q, setQ] = useState("");

  const scored = useMemo(
    () => pool.map((l) => ({ l, t: scoreListing(l, sellers[l.sellerId], pool), m: readMarket(l, pool) }))
      .sort((a, b) => a.t.score - b.t.score),
    [pool, sellers],
  );

  const risky = scored.filter((x) => x.t.score < 55);
  const list = (tab === "risk" ? risky : scored).filter((x) =>
    !q || x.l.title.toLowerCase().includes(q.toLowerCase()) || x.l.id.toLowerCase().includes(q.toLowerCase()));

  const kpis = useMemo(() => {
    const active = pool.filter((l) => l.status === "active");
    const avg = scored.length ? Math.round(scored.reduce((s, x) => s + x.t.score, 0) / scored.length) : 0;
    return [
      ["Aktif ilan", num(active.length)],
      ["Riskli ilan", num(risky.length)],
      ["Açık şikâyet", num(state.reports.filter((r) => r.state === "open").length)],
      ["Ortalama güven", `${avg}/100`],
    ] as [string, string][];
  }, [pool, scored, risky, state.reports]);

  if (!ready) return <div className="px-4 py-24 text-mute">Yükleniyor…</div>;

  if (!me || me.role !== "admin") return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="eyebrow">Kısıtlı alan</p>
      <h1 className="mt-2 font-serif text-4xl leading-none">Yönetim paneli</h1>
      <p className="mt-3 text-mute">Bu ekran moderatör yetkisi ister. Demo hesapla giriş yaparak inceleyebilirsin.</p>
      <Link href="/giris/" className="btn-primary mt-6">Demo hesapla gir</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-6">
      <div className="border-b border-line pb-4">
        <p className="eyebrow">Moderasyon</p>
        <h1 className="mt-1 font-serif text-[clamp(1.9rem,3.4vw,3rem)] leading-none">Yönetim paneli</h1>
      </div>

      <div className="mt-6 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([k, v]) => (
          <div key={k} className="bg-paper p-4">
            <p className="eyebrow">{k}</p>
            <p className="num mt-1.5 text-xl">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {([["risk", `Risk kuyruğu (${risky.length})`], ["all", "Tüm ilanlar"], ["reports", `Şikâyetler (${state.reports.length})`]] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "chip-on" : "chip hover:border-ink hover:text-ink"}>{l}</button>
        ))}
        {tab !== "reports" && (
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Başlık veya ilan no ara" className="field ml-auto max-w-xs !py-1.5 text-[0.8rem]" />
        )}
      </div>

      {tab === "reports" ? (
        state.reports.length === 0 ? (
          <p className="mt-6 border border-line p-10 text-center text-mute">Henüz şikâyet yok. Bir ilan detayından şikâyet göndererek deneyebilirsin.</p>
        ) : (
          <ul className="mt-6 divide-y divide-line border border-line">
            {state.reports.map((r) => {
              const l = pool.find((x) => x.id === r.listingId);
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 p-3">
                  {l && <Artwork seed={l.art} sub={l.sub} kind={String(l.attrs.tur ?? l.attrs.tip ?? "")} className="h-12 w-16 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <Link href={`/ilan/?id=${r.listingId}`} className="truncate text-[0.9rem] font-medium hover:text-signal">{l?.title ?? r.listingId}</Link>
                    <p className="text-[0.78rem] text-mute">{r.reason}{r.note && ` — ${r.note}`}</p>
                    <p className="num text-2xs text-mute-2">{ago(r.at)}</p>
                  </div>
                  <span className={`chip ${r.state === "open" ? "!border-gold !text-gold" : "!border-moss !text-moss"}`}>{r.state === "open" ? "açık" : "kapandı"}</span>
                  {r.state === "open" && (
                    <>
                      <button onClick={() => { setStatus(r.listingId, "removed"); resolveReport(r.id); }} className="btn-ghost !h-8 text-[0.78rem] text-signal">İlanı kaldır</button>
                      <button onClick={() => resolveReport(r.id)} className="btn-ghost !h-8 text-[0.78rem]">Sorun yok</button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <div className="mt-6 overflow-x-auto border border-line">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-line font-mono text-2xs uppercase tracking-[0.1em] text-mute">
                <th className="px-3 py-2.5 text-left font-normal">İlan</th>
                <th className="px-2 py-2.5 text-left font-normal">Kategori</th>
                <th className="px-2 py-2.5 text-right font-normal">Fiyat</th>
                <th className="px-2 py-2.5 text-right font-normal">Piyasa</th>
                <th className="px-2 py-2.5 text-center font-normal">Güven</th>
                <th className="px-2 py-2.5 text-left font-normal">Uyarılar</th>
                <th className="px-3 py-2.5 text-right font-normal">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 60).map(({ l, t, m }) => (
                <tr key={l.id} className="border-b border-line/70 align-top last:border-0 hover:bg-paper-2/60">
                  <td className="px-3 py-3">
                    <Link href={`/ilan/?id=${l.id}`} className="flex gap-2.5">
                      <Artwork seed={l.art} sub={l.sub} kind={String(l.attrs.tur ?? l.attrs.tip ?? "")} className="h-10 w-14 shrink-0" />
                      <span className="min-w-0">
                        <span className="block max-w-[240px] truncate text-[0.85rem] font-medium hover:text-signal">{l.title}</span>
                        <span className="num block text-2xs text-mute">{l.id} · {l.district}, {l.city}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-[0.78rem] text-mute">{labelFor(l.cat, l.sub)}</td>
                  <td className="num px-2 py-3 text-right text-[0.82rem]">{tl(l.price)}</td>
                  <td className={`num px-2 py-3 text-right text-[0.82rem] ${m && m.delta < -0.2 ? "text-signal" : "text-mute"}`}>
                    {m ? `${m.delta > 0 ? "+" : ""}${Math.round(m.delta * 100)}%` : "—"}
                  </td>
                  <td className="px-2 py-3 text-center"><TrustChip t={t} /></td>
                  <td className="px-2 py-3">
                    <ul className="space-y-0.5">
                      {t.flags.filter((f) => f.level !== "info").slice(0, 2).map((f, i) => (
                        <li key={i} className={`text-[0.72rem] ${f.level === "risk" ? "text-signal-ink" : "text-gold"}`}>• {f.text}</li>
                      ))}
                      {t.flags.length === 0 && <li className="text-[0.72rem] text-mute-2">—</li>}
                    </ul>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => setStatus(l.id, l.status === "active" ? "removed" : "active")}
                      className="btn-quiet !h-7 text-[0.75rem]">
                      {l.status === "active" ? "Kaldır" : "Geri al"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
