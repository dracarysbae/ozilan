"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Omnibox } from "@/components/Omnibox";
import { ListingCard } from "@/components/ListingCard";
import { Artwork } from "@/components/Artwork";
import { useStore } from "@/lib/store";
import { readMarket } from "@/lib/market";
import { CATEGORIES } from "@/data/taxonomy";
import { CITIES } from "@/data/geo";
import { num, tlShort, tl } from "@/lib/format";

const PROMPTS = [
  "Kadıköy kiralık eşyalı 2+1",
  "2018 üzeri otomatik dizel 100 bin km altı",
  "İzmir 3+1 daire 5 milyon altı",
  "sıfır garantili iPhone",
  "Bodrum villa imarlı arsa",
  "ucuz bisiklet",
];

export default function Home() {
  const { pool, ready, state } = useStore();

  const stats = useMemo(() => {
    const active = pool.filter((l) => l.status === "active");
    const byCat = CATEGORIES.map((c) => {
      const set = active.filter((l) => l.cat === c.slug && l.price > 0);
      const sorted = [...set].sort((a, b) => a.price - b.price);
      return {
        c,
        n: set.length,
        med: sorted.length ? sorted[Math.floor(sorted.length / 2)].price : 0,
        low: sorted.length ? sorted[Math.floor(sorted.length * 0.1)].price : 0,
        high: sorted.length ? sorted[Math.floor(sorted.length * 0.9)].price : 0,
      };
    });
    return { active, byCat };
  }, [pool]);

  const deals = useMemo(() => {
    if (!ready) return [];
    return pool
      .filter((l) => l.status === "active" && l.price > 0)
      .map((l) => ({ l, m: readMarket(l, pool) }))
      .filter((x) => x.m && x.m.confidence !== "low" && x.m.delta < -0.15 && x.m.delta > -0.45)
      .sort((a, b) => a.m!.delta - b.m!.delta)
      .slice(0, 4)
      .map((x) => x.l);
  }, [pool, ready]);

  const fresh = useMemo(() => pool.filter((l) => l.status === "active").slice(0, 12), [pool]);
  const recent = useMemo(
    () => (ready ? (state.recent.map((id) => pool.find((l) => l.id === id)).filter(Boolean).slice(0, 4) as typeof pool) : []),
    [state.recent, pool, ready],
  );

  return (
    <>
      {/* ------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b border-line bg-paper-2">
        <div className="pointer-events-none absolute inset-0 halftone opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 py-14 lg:grid-cols-[1.15fr_.85fr] lg:px-6 lg:py-20">
          <div>
            <span className="tag">İlan · piyasa verisi · güven skoru</span>
            <h1 className="mt-4 max-w-[13ch] font-serif text-[clamp(2.5rem,6.2vw,4.8rem)] leading-[0.92] tracking-[-0.035em]">
              Ne aradığını{" "}
              <span className="relative inline-block">
                <span aria-hidden className="absolute inset-x-[-6px] bottom-[0.1em] top-[0.44em] bg-gold" />
                <span className="relative">cümleyle</span>
              </span>{" "}
              yaz.
            </h1>
            <p className="mt-3 font-serif text-[clamp(1.5rem,2.8vw,2.4rem)] leading-[1.02] text-signal">
              Fiyatın gerçeğini biz gösterelim.
            </p>
            <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-mute">
              Filtre kutularıyla uğraşma. Aklındaki cümleyi yaz — şehri, bütçeyi, oda sayısını,
              model yılını biz ayrıştıralım. Her ilanda fiyatın benzerlerine göre nerede durduğunu
              ve satıcının güven skorunu görürsün.
            </p>

            <div className="mt-7 max-w-2xl"><Omnibox big /></div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {PROMPTS.map((p) => (
                <Link key={p} href={`/arama/?nl=${encodeURIComponent(p)}`} className="chip hover:border-ink hover:text-ink">
                  {p}
                </Link>
              ))}
            </div>
          </div>

          {/* market panel */}
          <aside className="self-start border border-ink bg-ink text-paper">
            <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
              <span className="eyebrow !text-paper/45">Piyasa paneli</span>
              <span className="font-mono text-2xs text-signal">CANLI</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-line font-mono text-2xs uppercase tracking-[0.1em] text-paper/40">
                  <th className="px-4 py-2 text-left font-normal">Kategori</th>
                  <th className="px-2 py-2 text-right font-normal">İlan</th>
                  <th className="px-2 py-2 text-right font-normal">Ortanca</th>
                  <th className="px-4 py-2 text-right font-normal">Bant</th>
                </tr>
              </thead>
              <tbody>
                {stats.byCat.map(({ c, n, med, low, high }) => (
                  <tr key={c.slug} className="border-b border-ink-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/arama/?k=${c.slug}`} className="text-[0.88rem] hover:text-signal">{c.label}</Link>
                      <p className="text-[0.7rem] text-paper/40">{c.tagline}</p>
                    </td>
                    <td className="num px-2 py-3 text-right text-[0.85rem]">{num(n)}</td>
                    <td className="num px-2 py-3 text-right text-[0.85rem] text-signal">{tlShort(med)}</td>
                    <td className="num px-4 py-3 text-right text-[0.7rem] text-paper/45">
                      {tlShort(low)}<br />{tlShort(high)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-ink-line px-4 py-3 text-[0.72rem] leading-relaxed text-paper/45">
              Bantlar, aktif ilanların %10–%90 dilimidir. Her ilan detayında aynı hesap
              o ilanın kendi karşılaştırma kümesi için yeniden yapılır.
            </div>
          </aside>
        </div>
      </section>

      {/* ------------------------------------------------ deals */}
      {deals.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 py-14 lg:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="eyebrow">Fırsat radarı</p>
              <h2 className="mt-1 font-serif text-3xl leading-none">Piyasa ortancasının altında</h2>
            </div>
            <Link href="/arama/?s=value" className="btn-ghost">Tümünü sırala →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((l) => <ListingCard key={l.id} l={l} pool={pool} />)}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 pb-4 lg:px-6">
          <div className="flex items-end justify-between border-b border-line pb-3">
            <div>
              <p className="eyebrow">Kaldığın yerden</p>
              <h2 className="mt-1 font-serif text-2xl leading-none">Son gezdiklerin</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((l) => <ListingCard key={l.id} l={l} pool={pool} variant="mini" />)}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ categories */}
      <section className="border-y border-line bg-paper-3/50">
        <div className="mx-auto max-w-[1400px] px-4 py-14 lg:px-6">
          <span className="tag">Kategoriler</span>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {CATEGORIES.map((c, i) => {
              const set = stats.active.filter((l) => l.cat === c.slug);
              const skin = [
                { bg: "bg-signal", fg: "text-white", sub: "text-white/70", chip: "border-white/35 text-white/80" },
                { bg: "bg-gold", fg: "text-ink", sub: "text-ink/70", chip: "border-ink/30 text-ink/75" },
                { bg: "bg-moss", fg: "text-white", sub: "text-white/70", chip: "border-white/35 text-white/80" },
              ][i % 3];
              return (
                <Link key={c.slug} href={`/arama/?k=${c.slug}`}
                  className={`group flex flex-col overflow-hidden rounded-lg shadow-plaque transition hover:-translate-y-0.5 hover:shadow-pop ${skin.bg} ${skin.fg}`}>
                  <div className="relative">
                    <Artwork seed={i * 137 + 4} sub={c.subs[0].slug} className="h-28 w-full opacity-90" />
                    <span className="num absolute right-2 top-2 rounded-sm bg-ink px-1.5 py-0.5 text-2xs text-paper-2">
                      {num(set.length)}
                    </span>
                  </div>
                  <div className="border-t border-black/10 p-5">
                    <h3 className="font-serif text-3xl leading-none">{c.label}</h3>
                    <p className={`mt-2 text-[0.85rem] ${skin.sub}`}>{c.tagline}</p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {c.subs.map((s2) => (
                        <span key={s2.slug} className={`rounded-sm border px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.06em] ${skin.chip}`}>
                          {s2.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ how it works */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Farkı nerede</p>
            <h2 className="mt-3 font-serif text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.03]">
              Bir ilan sitesi fiyatı gösterir.<br />İyi bir ilan sitesi <em className="not-italic text-signal">fiyatın anlamını</em> gösterir.
            </h2>
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-3">
            {[
              { k: "01", t: "Cümleyle arama", d: "Yazdığın cümleden şehir, bütçe, oda sayısı, model yılı, kilometre ve yakıt tipini ayrıştırır; ne anladığını sana geri gösterir." },
              { k: "02", t: "Piyasa konumu", d: "İlanın kendi karşılaştırma kümesini kurar — aynı marka, aynı yıl aralığı, aynı oda tipi — ve fiyatı o kümenin ortancasına göre konumlandırır." },
              { k: "03", t: "Güven taraması", d: "Satıcı geçmişi, ilan bütünlüğü, baskı dili, platform dışı iletişim kalıpları ve kopya ilan taraması tek bir skora indirgenir." },
            ].map((x) => (
              <div key={x.k} className="bg-paper p-6">
                <p className="num text-2xs text-signal">{x.k}</p>
                <h3 className="mt-3 text-[1.05rem] font-medium">{x.t}</h3>
                <p className="mt-2 text-[0.83rem] leading-relaxed text-mute">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ fresh */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="eyebrow">Akış</p>
            <h2 className="mt-1 font-serif text-3xl leading-none">Son eklenen ilanlar</h2>
          </div>
          <Link href="/arama/" className="btn-ghost">Tüm ilanlar →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fresh.map((l) => <ListingCard key={l.id} l={l} pool={pool} />)}
        </div>
      </section>

      {/* ------------------------------------------------ cities */}
      <section className="border-t border-line bg-paper-2/40">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6">
          <p className="eyebrow">Şehirler</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {CITIES.map((c) => {
              const n = stats.active.filter((l) => l.city === c).length;
              return (
                <Link key={c} href={`/arama/?il=${encodeURIComponent(c)}`}
                  className="group inline-flex items-center gap-2 border border-line bg-paper px-3 py-1.5 text-[0.85rem] transition hover:border-ink hover:bg-ink hover:text-paper">
                  {c}<span className="num text-2xs text-mute group-hover:text-paper/50">{n}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Omnibox } from "@/components/Omnibox";
import { ListingCard } from "@/components/ListingCard";
import { Artwork } from "@/components/Artwork";
import { useStore } from "@/lib/store";
import { readMarket } from "@/lib/market";
import { CATEGORIES } from "@/data/taxonomy";
import { CITIES } from "@/data/geo";
import { num, tlShort, tl } from "@/lib/format";

const PROMPTS = [
  "Kadıköy kiralık eşyalı 2+1",
  "2018 üzeri otomatik dizel 100 bin km altı",
  "İzmir 3+1 daire 5 milyon altı",
  "sıfır garantili iPhone",
  "Bodrum villa imarlı arsa",
  "ucuz bisiklet",
];

export default function Home() {
  const { pool, ready } = useStore();

  const stats = useMemo(() => {
    const active = pool.filter((l) => l.status === "active");
    const byCat = CATEGORIES.map((c) => {
      const set = active.filter((l) => l.cat === c.slug && l.price > 0);
      const sorted = [...set].sort((a, b) => a.price - b.price);
      return {
        c,
        n: set.length,
        med: sorted.length ? sorted[Math.floor(sorted.length / 2)].price : 0,
        low: sorted.length ? sorted[Math.floor(sorted.length * 0.1)].price : 0,
        high: sorted.length ? sorted[Math.floor(sorted.length * 0.9)].price : 0,
      };
    });
    return { active, byCat };
  }, [pool]);

  const deals = useMemo(() => {
    if (!ready) return [];
    return pool
      .filter((l) => l.status === "active" && l.price > 0)
      .map((l) => ({ l, m: readMarket(l, pool) }))
      .filter((x) => x.m && x.m.confidence !== "low" && x.m.delta < -0.15 && x.m.delta > -0.45)
      .sort((a, b) => a.m!.delta - b.m!.delta)
      .slice(0, 4)
      .map((x) => x.l);
  }, [pool, ready]);

  const fresh = useMemo(() => pool.filter((l) => l.status === "active").slice(0, 12), [pool]);

  return (
    <>
      {/* ------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b-4 border-ink bg-paper-3/60">
        <div className="pointer-events-none absolute inset-0 halftone opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 py-14 lg:grid-cols-[1.15fr_.85fr] lg:px-6 lg:py-20">
          <div>
            <span className="tag">İlan · piyasa verisi · güven skoru</span>
            <h1 className="mt-4 max-w-[13ch] font-serif text-[clamp(2.5rem,6.2vw,4.8rem)] leading-[0.92] tracking-[-0.035em]">
              Ne aradığını{" "}
              <span className="relative inline-block">
                <span aria-hidden className="absolute inset-x-[-6px] bottom-[0.1em] top-[0.44em] bg-gold" />
                <span className="relative">cümleyle</span>
              </span>{" "}
              yaz.
            </h1>
            <p className="mt-3 font-serif text-[clamp(1.5rem,2.8vw,2.4rem)] leading-[1.02] text-signal">
              Fiyatın gerçeğini biz gösterelim.
            </p>
            <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-mute">
              Filtre kutularıyla uğraşma. Aklındaki cümleyi yaz — şehri, bütçeyi, oda sayısını,
              model yılını biz ayrıştıralım. Her ilanda fiyatın benzerlerine göre nerede durduğunu
              ve satıcının güven skorunu görürsün.
            </p>

            <div className="mt-7 max-w-2xl"><Omnibox big /></div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {PROMPTS.map((p) => (
                <Link key={p} href={`/arama/?nl=${encodeURIComponent(p)}`} className="chip hover:border-ink hover:text-ink">
                  {p}
                </Link>
              ))}
            </div>
          </div>

          {/* market panel */}
          <aside className="self-start border border-ink bg-ink text-paper">
            <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
              <span className="eyebrow !text-paper/45">Piyasa paneli</span>
              <span className="font-mono text-2xs text-signal">CANLI</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-line font-mono text-2xs uppercase tracking-[0.1em] text-paper/40">
                  <th className="px-4 py-2 text-left font-normal">Kategori</th>
                  <th className="px-2 py-2 text-right font-normal">İlan</th>
                  <th className="px-2 py-2 text-right font-normal">Ortanca</th>
                  <th className="px-4 py-2 text-right font-normal">Bant</th>
                </tr>
              </thead>
              <tbody>
                {stats.byCat.map(({ c, n, med, low, high }) => (
                  <tr key={c.slug} className="border-b border-ink-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/arama/?k=${c.slug}`} className="text-[0.88rem] hover:text-signal">{c.label}</Link>
                      <p className="text-[0.7rem] text-paper/40">{c.tagline}</p>
                    </td>
                    <td className="num px-2 py-3 text-right text-[0.85rem]">{num(n)}</td>
                    <td className="num px-2 py-3 text-right text-[0.85rem] text-signal">{tlShort(med)}</td>
                    <td className="num px-4 py-3 text-right text-[0.7rem] text-paper/45">
                      {tlShort(low)}<br />{tlShort(high)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-ink-line px-4 py-3 text-[0.72rem] leading-relaxed text-paper/45">
              Bantlar, aktif ilanların %10–%90 dilimidir. Her ilan detayında aynı hesap
              o ilanın kendi karşılaştırma kümesi için yeniden yapılır.
            </div>
          </aside>
        </div>
      </section>

      {/* ------------------------------------------------ deals */}
      {deals.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 py-14 lg:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-ink pb-3">
            <div>
              <p className="eyebrow">Fırsat radarı</p>
              <h2 className="mt-1 font-serif text-3xl leading-none">Piyasa ortancasının altında</h2>
            </div>
            <Link href="/arama/?s=value" className="btn-ghost">Tümünü sırala →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((l) => <ListingCard key={l.id} l={l} pool={pool} />)}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ categories */}
      <section className="border-y-4 border-ink bg-paper-3/50">
        <div className="mx-auto max-w-[1400px] px-4 py-14 lg:px-6">
          <span className="tag">Kategoriler</span>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {CATEGORIES.map((c, i) => {
              const set = stats.active.filter((l) => l.cat === c.slug);
              const skin = [
                { bg: "bg-signal", fg: "text-white", sub: "text-white/70", chip: "border-white/35 text-white/80" },
                { bg: "bg-gold", fg: "text-ink", sub: "text-ink/70", chip: "border-ink/30 text-ink/75" },
                { bg: "bg-moss", fg: "text-white", sub: "text-white/70", chip: "border-white/35 text-white/80" },
              ][i % 3];
              return (
                <Link key={c.slug} href={`/arama/?k=${c.slug}`}
                  className={`plaque-link flex flex-col overflow-hidden ${skin.bg} ${skin.fg}`}>
                  <div className="relative">
                    <Artwork seed={i * 137 + 4} sub={c.subs[0].slug} className="h-28 w-full opacity-90" />
                    <span className="num absolute right-2 top-2 rounded-sm bg-ink px-1.5 py-0.5 text-2xs text-paper-2">
                      {num(set.length)}
                    </span>
                  </div>
                  <div className="border-t-2 border-ink p-5">
                    <h3 className="font-serif text-3xl leading-none">{c.label}</h3>
                    <p className={`mt-2 text-[0.85rem] ${skin.sub}`}>{c.tagline}</p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {c.subs.map((s2) => (
                        <span key={s2.slug} className={`rounded-sm border px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.06em] ${skin.chip}`}>
                          {s2.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ how it works */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Farkı nerede</p>
            <h2 className="mt-3 font-serif text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.03]">
              Bir ilan sitesi fiyatı gösterir.<br />İyi bir ilan sitesi <em className="not-italic text-signal">fiyatın anlamını</em> gösterir.
            </h2>
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-3">
            {[
              { k: "01", t: "Cümleyle arama", d: "Yazdığın cümleden şehir, bütçe, oda sayısı, model yılı, kilometre ve yakıt tipini ayrıştırır; ne anladığını sana geri gösterir." },
              { k: "02", t: "Piyasa konumu", d: "İlanın kendi karşılaştırma kümesini kurar — aynı marka, aynı yıl aralığı, aynı oda tipi — ve fiyatı o kümenin ortancasına göre konumlandırır." },
              { k: "03", t: "Güven taraması", d: "Satıcı geçmişi, ilan bütünlüğü, baskı dili, platform dışı iletişim kalıpları ve kopya ilan taraması tek bir skora indirgenir." },
            ].map((x) => (
              <div key={x.k} className="bg-paper p-6">
                <p className="num text-2xs text-signal">{x.k}</p>
                <h3 className="mt-3 text-[1.05rem] font-medium">{x.t}</h3>
                <p className="mt-2 text-[0.83rem] leading-relaxed text-mute">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ fresh */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-ink pb-3">
          <div>
            <p className="eyebrow">Akış</p>
            <h2 className="mt-1 font-serif text-3xl leading-none">Son eklenen ilanlar</h2>
          </div>
          <Link href="/arama/" className="btn-ghost">Tüm ilanlar →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fresh.map((l) => <ListingCard key={l.id} l={l} pool={pool} />)}
        </div>
      </section>

      {/* ------------------------------------------------ cities */}
      <section className="border-t border-line bg-paper-2/40">
        <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6">
          <p className="eyebrow">Şehirler</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {CITIES.map((c) => {
              const n = stats.active.filter((l) => l.city === c).length;
              return (
                <Link key={c} href={`/arama/?il=${encodeURIComponent(c)}`}
                  className="group inline-flex items-center gap-2 border border-line bg-paper px-3 py-1.5 text-[0.85rem] transition hover:border-ink hover:bg-ink hover:text-paper">
                  {c}<span className="num text-2xs text-mute group-hover:text-paper/50">{n}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
