"use client";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { Omnibox } from "@/components/Omnibox";
import { ListingCard } from "@/components/ListingCard";
import { Artwork } from "@/components/Artwork";
import { Reveal, useScrollY, useProgress, useMedia } from "@/components/Motion";
import { useStore } from "@/lib/store";
import { readMarket } from "@/lib/market";
import { CATEGORIES } from "@/data/taxonomy";
import { CITIES } from "@/data/geo";
import { num, tlShort } from "@/lib/format";

const PROMPTS = [
  "Kadıköy kiralık 2+1",
  "2018 üzeri otomatik dizel",
  "İzmir 3+1 daire 5 milyon altı",
  "sıfır garantili iPhone",
];

const STEPS = [
  {
    k: "Cümleyle arama",
    d: "Yazdığın cümleden şehri, bütçeyi, oda sayısını, model yılını ve kilometreyi ayrıştırır; ne anladığını sana geri gösterir.",
  },
  {
    k: "Piyasa konumu",
    d: "Her ilan için kendi karşılaştırma kümesini kurar — aynı marka, aynı yıl aralığı, aynı oda tipi — ve fiyatı o kümenin ortancasına göre konumlandırır.",
  },
  {
    k: "Güven taraması",
    d: "Satıcı geçmişi, ilan bütünlüğü, baskı dili, platform dışı iletişim kalıpları ve kopya ilan taraması tek bir skora iner.",
  },
];

function Section({
  title,
  lead,
  href,
  hrefLabel = "Tümü",
  dark = false,
  children,
}: {
  title: string;
  lead?: string;
  href?: string;
  hrefLabel?: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-shell px-5 py-20 lg:px-8 lg:py-28">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <h2 className={`display text-[clamp(1.8rem,3.4vw,2.6rem)] ${dark ? "text-white" : ""}`}>{title}</h2>
            {lead && (
              <p className={`mt-3 text-[1.0625rem] leading-relaxed ${dark ? "text-white/60" : "text-mute"}`}>{lead}</p>
            )}
          </div>
          {href && (
            <Link
              href={href}
              className={`link-u shrink-0 text-[0.9375rem] ${dark ? "text-signal-glow" : "text-signal"}`}
            >
              {hrefLabel} <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </Reveal>
      {children}
    </section>
  );
}

export default function Home() {
  const { pool, ready, state } = useStore();
  const y = useScrollY();
  const showcase = useRef<HTMLDivElement>(null);
  const p = useProgress(showcase);
  const isDesk = useMedia("(min-width: 1024px)");

  const active = useMemo(() => pool.filter((l) => l.status === "active"), [pool]);

  const byCat = useMemo(
    () =>
      CATEGORIES.map((c) => {
        const set = active.filter((l) => l.cat === c.slug && l.price > 0);
        const sorted = [...set].sort((a, b) => a.price - b.price);
        return { c, n: set.length, med: sorted.length ? sorted[Math.floor(sorted.length / 2)].price : 0 };
      }),
    [active],
  );

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

  const fresh = useMemo(() => active.slice(0, 8), [active]);
  const recent = useMemo(
    () =>
      ready
        ? (state.recent.map((id) => pool.find((l) => l.id === id)).filter(Boolean).slice(0, 4) as typeof pool)
        : [],
    [state.recent, pool, ready],
  );

  const medAll = useMemo(() => {
    const s = active.filter((l) => l.price > 0).map((l) => l.price).sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  }, [active]);

  /* kahraman bandı parallaksı */
  const heroShift = Math.min(y, 700);
  const step = Math.min(2, Math.floor(p * 3.0001));

  return (
    <>
      {/* ═══════════════════════════════════════════════════════ kahraman */}
      <section className="band-dark relative -mt-16 overflow-hidden pt-16">
        {/* ışık bulutları — yavaş sürüklenir, kaydırmada geri kalır */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="animate-drift absolute -left-40 -top-32 h-[46rem] w-[46rem] rounded-full opacity-70 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(44,107,245,.42), transparent 62%)",
              transform: `translate3d(0, ${heroShift * 0.18}px, 0)`,
            }}
          />
          <div
            className="animate-drift absolute -right-40 top-24 h-[38rem] w-[38rem] rounded-full opacity-60 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(90,141,255,.3), transparent 64%)",
              animationDelay: "-8s",
              transform: `translate3d(0, ${heroShift * 0.1}px, 0)`,
            }}
          />
        </div>

        <div
          className="relative mx-auto max-w-shell px-5 pb-40 pt-20 text-center lg:px-8 lg:pb-48 lg:pt-28"
          style={{
            transform: `translate3d(0, ${heroShift * -0.14}px, 0)`,
            opacity: Math.max(0, 1 - heroShift / 620),
          }}
        >
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-[0.8125rem] text-white/80 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-glow opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal-glow" />
            </span>
            {num(active.length)} aktif ilan · piyasa endeksi canlı
          </div>

          <h1
            className="display grad-text animate-rise mx-auto mt-7 max-w-[18ch] text-balance text-[clamp(2.6rem,7vw,5.25rem)]"
            style={{ animationDelay: "80ms" }}
          >
            Ne aradığını cümleyle yaz.
          </h1>

          <p
            className="animate-rise mx-auto mt-6 max-w-[52ch] text-[clamp(1.0625rem,2vw,1.375rem)] leading-relaxed text-white/60"
            style={{ animationDelay: "160ms" }}
          >
            Fiyatın piyasada nerede durduğunu ve satıcının güven skorunu, ilanın yanında görürsün.
          </p>

          <div
            className="animate-rise mx-auto mt-11 max-w-2xl text-left"
            style={{ animationDelay: "240ms" }}
          >
            <div className="rounded-full p-[1px]" style={{ background: "linear-gradient(120deg, rgba(90,141,255,.55), rgba(255,255,255,.12) 40%, rgba(90,141,255,.35))" }}>
              <Omnibox big dark />
            </div>
          </div>

          <div
            className="animate-rise mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-[0.9375rem]"
            style={{ animationDelay: "320ms" }}
          >
            {PROMPTS.map((q) => (
              <Link key={q} href={`/arama/?nl=${encodeURIComponent(q)}`} className="link-u text-white/55 transition hover:text-white">
                {q}
              </Link>
            ))}
          </div>
        </div>

        {/* alt istatistik şeridi */}
        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-shell grid-cols-2 gap-px px-5 lg:grid-cols-4 lg:px-8">
            {[
              { v: num(active.length), l: "aktif ilan" },
              { v: tlShort(medAll), l: "ortanca fiyat" },
              { v: `${CATEGORIES.reduce((a, c) => a + c.subs.length, 0)}`, l: "alt kategori" },
              { v: `${CITIES.length}`, l: "şehir" },
            ].map((s, i) => (
              <Reveal key={s.l} delay={i * 70}>
                <div className="px-2 py-8 text-center lg:py-10">
                  <p className="num text-[clamp(1.6rem,3vw,2.25rem)] font-semibold text-white">{s.v}</p>
                  <p className="mt-1 text-[0.8125rem] text-white/45">{s.l}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════ kategoriler */}
      <Section
        title="Nereye bakmak istersin?"
        lead="Üç ana başlık, on alt kategori. Yanlarındaki rakam o an açık olan ilan sayısı."
        href="/arama/"
        hrefLabel="Tüm ilanlar"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {byCat.map(({ c, n, med }, i) => (
            <Reveal key={c.slug} delay={i * 110} scale className="h-full">
              <div className="plaque-link group flex h-full flex-col overflow-hidden">
                <div className="relative h-36 overflow-hidden">
                  <Artwork
                    seed={i * 137 + 4}
                    sub={c.subs[0].slug}
                    className="h-full w-full transition-transform duration-700 ease-apple group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(15,27,46,.72), rgba(15,27,46,.18))" }} />
                  <div className="absolute inset-x-5 bottom-4 flex items-end justify-between">
                    <h3 className="text-[1.5rem] font-semibold tracking-[-0.028em] text-white">{c.label}</h3>
                    <span className="num rounded-full bg-white/15 px-2.5 py-1 text-[0.75rem] text-white backdrop-blur">
                      {num(n)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[0.875rem] text-mute">{c.tagline}</p>
                  <div className="rows mt-4 flex-1">
                    {c.subs.map((s2) => {
                      const sn = active.filter((l) => l.cat === c.slug && l.sub === s2.slug).length;
                      return (
                        <Link
                          key={s2.slug}
                          href={`/arama/?k=${c.slug}&a=${s2.slug}`}
                          className="flex items-center justify-between py-2.5 text-[0.9375rem] transition hover:text-signal"
                        >
                          <span>{s2.label}</span>
                          <span className="num text-[0.8125rem] text-mute-2">{sn}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                    <span className="text-[0.8125rem] text-mute">Ortanca fiyat</span>
                    <span className="num text-[1.0625rem] font-semibold">{tlShort(med)}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════ sabitlenmiş anlatım bölümü */}
      <div ref={showcase} className="band-dark relative lg:h-[260vh]">
        <div className="flex items-center overflow-visible py-24 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden lg:py-0">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div
              className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                background: "radial-gradient(circle, rgba(44,107,245,.28), transparent 62%)",
                transform: `translate3d(calc(-50% + ${(p - 0.5) * 120}px), -50%, 0)`,
              }}
            />
          </div>

          <div className="relative mx-auto grid w-full max-w-shell items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-[0.8125rem] font-medium text-signal-glow">Farkı nerede</p>
              <h2 className="display mt-3 text-[clamp(1.9rem,4vw,3.1rem)] text-white">
                Bir ilan sitesi fiyatı gösterir.
                <br />
                Biz <span className="text-signal-glow">fiyatın anlamını</span> gösteriyoruz.
              </h2>

              <div className="mt-10 space-y-1">
                {STEPS.map((s, i) => {
                  const on = !isDesk || step === i;
                  return (
                    <div
                      key={s.k}
                      className="relative border-l-2 py-4 pl-6"
                      style={{
                        borderColor: on ? "#5A8DFF" : "rgba(255,255,255,.12)",
                        transition: "border-color .5s var(--ease-apple)",
                      }}
                    >
                      <p
                        className="text-[1.125rem] font-medium"
                        style={{ color: on ? "#fff" : "rgba(255,255,255,.42)", transition: "color .5s var(--ease-apple)" }}
                      >
                        {s.k}
                      </p>
                      <div
                        className="overflow-hidden"
                        style={{
                          maxHeight: on ? 200 : 0,
                          opacity: on ? 1 : 0,
                          transition: "max-height .6s var(--ease-apple), opacity .5s var(--ease-apple)",
                        }}
                      >
                        <p className="pt-2 text-[0.9375rem] leading-relaxed text-white/55">{s.d}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* sabit görsel — masaüstünde adıma göre değişir, mobilde alt alta */}
            <div className="relative grid gap-4 lg:block lg:h-[26rem]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-7 lg:absolute lg:inset-0"
                  style={
                    isDesk
                      ? {
                          opacity: step === i ? 1 : 0,
                          transform: `translate3d(0, ${step === i ? 0 : step > i ? -26 : 26}px, 0) scale(${step === i ? 1 : 0.97})`,
                          transition: "opacity .55s var(--ease-apple), transform .55s var(--ease-apple)",
                          pointerEvents: "none",
                        }
                      : undefined
                  }
                >
                  {i === 0 && (
                    <div>
                      <p className="text-[0.8125rem] text-white/45">Sen yazdın</p>
                      <p className="mt-2 text-[1.25rem] text-white">“İzmir Karşıyaka 3+1 daire 5 milyon altı”</p>
                      <p className="mt-7 text-[0.8125rem] text-white/45">Biz şunu anladık</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[["şehir", "İzmir"], ["ilçe", "Karşıyaka"], ["oda", "3+1"], ["tip", "Daire"], ["bütçe", "≤ 5.000.000 ₺"]].map(([k, v]) => (
                          <span key={k} className="rounded-full bg-signal/25 px-3 py-1.5 text-[0.8125rem] text-white">
                            <span className="text-white/45">{k} </span>{v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {i === 1 && (
                    <div>
                      <p className="text-[0.8125rem] text-white/45">Bu ilanın fiyatı</p>
                      <p className="num mt-2 text-[2.25rem] font-semibold text-white">3.150.000 ₺</p>
                      <div className="mt-8">
                        <div className="relative h-1.5 rounded-full bg-white/15">
                          <div className="absolute inset-y-0 left-[18%] right-[26%] rounded-full bg-white/25" />
                          <div className="absolute -top-1 h-3.5 w-3.5 rounded-full bg-signal-glow shadow-plaque-blue" style={{ left: "27%" }} />
                        </div>
                        <div className="mt-3 flex justify-between text-[0.75rem] text-white/40">
                          <span>alt %25</span><span>ortanca 3.680.000 ₺</span><span>üst %25</span>
                        </div>
                      </div>
                      <p className="mt-7 text-[0.9375rem] text-white/70">
                        Benzer 34 ilana göre <span className="font-semibold text-moss">%14 daha ucuz</span>.
                      </p>
                    </div>
                  )}
                  {i === 2 && (
                    <div>
                      <div className="flex items-baseline justify-between">
                        <p className="text-[0.8125rem] text-white/45">Güven skoru</p>
                        <p className="num text-[2rem] font-semibold text-white">86<span className="text-[1rem] text-white/40">/100</span></p>
                      </div>
                      <div className="mt-4 h-1.5 rounded-full bg-white/15">
                        <div className="h-full rounded-full bg-moss" style={{ width: "86%" }} />
                      </div>
                      <ul className="mt-6 space-y-3 text-[0.9375rem]">
                        {[
                          ["ok", "Satıcı 3 yıldır üye, 24 tamamlanmış ilan"],
                          ["ok", "İlan bütünlüğü tam — tüm alanlar dolu"],
                          ["warn", "Açıklamada “acil” ifadesi geçiyor"],
                        ].map(([lv, t]) => (
                          <li key={t} className="flex gap-3">
                            <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${lv === "ok" ? "bg-moss" : "bg-gold"}`} />
                            <span className="text-white/70">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ilerleme çubuğu */}
          <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 gap-2 lg:flex">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 rounded-full"
                style={{
                  width: step === i ? 34 : 14,
                  background: step === i ? "#5A8DFF" : "rgba(255,255,255,.22)",
                  transition: "width .5s var(--ease-apple), background-color .5s var(--ease-apple)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ fırsatlar */}
      {deals.length > 0 && (
        <div className="band-soft border-b border-line">
          <Section
            title="Piyasa ortancasının altında"
            lead="Kendi karşılaştırma kümesine göre belirgin şekilde ucuz kalan ilanlar."
            href="/arama/?s=value"
            hrefLabel="Hepsini sırala"
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {deals.map((l, i) => (
                <Reveal key={l.id} delay={i * 90} scale className="h-full">
                  <ListingCard l={l} pool={pool} />
                </Reveal>
              ))}
            </div>
          </Section>
        </div>
      )}

      {recent.length > 0 && (
        <Section title="Kaldığın yerden">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((l, i) => (
              <Reveal key={l.id} delay={i * 80}>
                <ListingCard l={l} pool={pool} variant="mini" />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ═════════════════════════════════════════════════ son eklenenler */}
      <Section title="Son eklenenler" href="/arama/" hrefLabel="Tüm ilanlar">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {fresh.map((l, i) => (
            <Reveal key={l.id} delay={(i % 4) * 90} scale className="h-full">
              <ListingCard l={l} pool={pool} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════ şehirler */}
      <div className="band-dark">
        <Section title="Şehre göre" lead="Türkiye genelinde açık ilanlar." dark>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
            {CITIES.map((c, i) => {
              const n = active.filter((l) => l.city === c).length;
              return (
                <Reveal key={c} delay={(i % 5) * 60} className="h-full">
                  <Link
                    href={`/arama/?il=${encodeURIComponent(c)}`}
                    className="flex h-full items-baseline justify-between bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.09]"
                  >
                    <span className="text-[0.9375rem] text-white/85">{c}</span>
                    <span className="num text-[0.8125rem] text-white/35">{n}</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ═════════════════════════════════════════════════════════════ CTA */}
      <div className="band-soft">
        <section className="mx-auto max-w-shell px-5 py-24 text-center lg:px-8 lg:py-32">
          <Reveal scale>
            <h2 className="display mx-auto max-w-[20ch] text-[clamp(1.9rem,4vw,3rem)]">
              Sıradaki ilan seninki olsun.
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[1.0625rem] text-mute">
              Dört adımda yayına alırsın; fiyatını girerken piyasa bandını anında görürsün.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/ilan-ver/" className="btn-signal px-7">İlan ver</Link>
              <Link href="/arama/" className="btn-ghost px-7">İlanlara göz at</Link>
            </div>
          </Reveal>
        </section>
      </div>
    </>
  );
}
