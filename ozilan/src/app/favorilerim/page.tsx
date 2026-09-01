"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ListingCard } from "@/components/ListingCard";
import { useStore } from "@/lib/store";
import { readMarket } from "@/lib/market";
import { num, tl } from "@/lib/format";

export default function Favs() {
  const { pool, state, ready } = useStore();
  const items = useMemo(() => state.favorites.map((id) => pool.find((l) => l.id === id)).filter(Boolean) as typeof pool, [state.favorites, pool]);

  const total = items.reduce((s, l) => s + l.price, 0);
  const under = items.filter((l) => { const m = readMarket(l, pool); return m && m.delta < -0.06; }).length;

  if (!ready) return <div className="px-4 py-24 text-mute">Yükleniyor…</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="eyebrow">Takip listesi</p>
          <h1 className="mt-1 font-serif text-[clamp(1.9rem,3.4vw,3rem)] leading-none">Favorilerim</h1>
        </div>
        {items.length > 0 && (
          <div className="flex gap-6 text-right">
            <div><p className="eyebrow">İlan</p><p className="num text-lg">{num(items.length)}</p></div>
            <div><p className="eyebrow">Toplam</p><p className="num text-lg">{tl(total)}</p></div>
            <div><p className="eyebrow">Piyasa altı</p><p className="num text-lg text-moss">{under}</p></div>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 border border-line p-12 text-center">
          <p className="font-serif text-2xl">Henüz favori eklemedin</p>
          <p className="mt-2 text-[0.88rem] text-mute">İlan kartlarındaki yıldıza dokunarak takibe al; fiyat konumlarını burada yan yana görürsün.</p>
          <Link href="/arama/" className="btn-primary mt-6">İlanlara göz at</Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((l) => <ListingCard key={l.id} l={l} pool={pool} variant="row" />)}
        </div>
      )}

      {state.searches.length > 0 && (
        <section className="mt-14">
          <div className="border-b border-line pb-4">
            <p className="eyebrow">Kayıtlı aramalar</p>
            <h2 className="mt-1 font-serif text-2xl leading-none">Tekrar çalıştır</h2>
          </div>
          <div className="mt-4 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {state.searches.map((s) => (
              <Link key={s.id} href={s.href} className="bg-paper p-4 transition hover:bg-paper-2">
                <p className="truncate text-[0.9rem] font-medium">{s.label}</p>
                <p className="num mt-1 text-2xs text-mute">{new Date(s.at).toLocaleDateString("tr-TR")}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
