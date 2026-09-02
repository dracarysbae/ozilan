"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Omnibox } from "@/components/Omnibox";
import { ListingCard } from "@/components/ListingCard";
import { Artwork } from "@/components/Artwork";
import {
  Reveal, SplitText, Tilt, CountUp, useScrollY, useProgress, useMedia, useMotionOK,
} from "@/components/Motion";
import { useStore } from "@/lib/store";
import { readMarket } from "@/lib/market";
import { CATEGORIES } from "@/data/taxonomy";
import { CITIES } from "@/data/geo";
import { num, tlShort, tl } from "@/lib/format";

const PROMPTS = ["Kadıköy kiralık 2+1", "2018 üzeri otomatik dizel", "İzmir 3+1 daire 5 milyon altı", "sıfır garantili iPhone"];

const STEPS = [
  { k: "Cümleyle arama", d: "Yazdığın cümleden şehri, bütçeyi, oda sayısını, model yılını ve kilometreyi ayrıştırır; ne anladığını sana geri gösterir." },
  { k: "Piyasa konumu", d: "Her ilan için kendi karşılaştırma kümesini kurar — aynı marka, aynı yıl aralığı, aynı oda tipi — ve fiyatı o kümenin ortancasına göre konumlandırır." },
  { k: "Güven taraması", d: "Satıcı geçmişi, ilan bütünlüğü, baskı dili, platform dışı iletişim kalıpları ve kopya ilan taraması tek bir skora iner." },
];

function Section({
  title, lead, href, hrefLabel = "Tümü", dark = false, children,
}: {
  title: string; lead?: string; href?: string; hrefLabel?: string; dark?: boolean; children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-shell px-5 py-20 lg:px-8 lg:py-28">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <h2 className={`display text-[clamp(1.8rem,3.6vw,2.8rem)] ${dark ? "text-white" : ""}`}>
            <SplitText text={title} />
          </h2>
          {lead && (
            <Reveal delay={160}>
              <p className={`mt-3 text-[1.0625rem] leading-relaxed ${dark ? "text-white/60" : "text-mute"}`}>{lead}</p>
            </Reveal>
          )}
        </div>
        {href && (
          <Reveal delay={220}>
            <Link href={href} className={`link-u shrink-0 text-[0.9375rem] ${dark ? "text-signal-glow" : "text-signal"}`}>
              {hrefLabel} <span aria-hidden>→</span>
            </Link>
          </Reveal>
        )}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const { pool, ready, state } = useStore();
  const y = useScrollY();
  const isDesk = useMedia("(min-width: 1024px)");
  const motionOK = useMotionOK();

  const showcase = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  const pShow = useProgress(showcase);
  const pDeck = useProgress(deck);
  const pRail = useProgress(rail);
  const [railShift, setRailShift] = useState(0);

  const active = useMemo(() => pool.filter((l) => l.status === "active"), [pool]);

  const byCat = useMemo(
    () => CATEGORIES.map((c) => {
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
      .slice(0, 8)
      .map((x) => ({ l: x.l, m: x.m! }));
  }, [pool, ready]);

  const fresh = useMemo(() => active.slice(0, 10), [active]);
  const recent = useMemo(
    () => (ready ? (state.recent.map((id) => pool.find((l) => l.id === id)).filter(Boolean).slice(0, 4) as typeof pool) : []),
    [state.recent, pool, ready],
  );

  const medAll = useMemo(() => {
    const s = active.filter((l) => l.price > 0).map((l) => l.price).sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  }, [active]);

  /* yatay ray için kaydırılacak mesafe */
  useEffect(() => {
    const calc = () => {
      const t = track.current;
      if (!t) return;
      setRailShift(Math.max(0, t.scrollWidth - window.innerWidth + 80));
    };
    calc();
    window.addEventListener("resize", calc);
    const id = setTimeout(calc, 400);
    return () => { window.removeEventListener("resize", calc); clearTimeout(id); };
  }, [fresh.length]);

  /* ---- kahraman hareketi ---- */
  const hs = motionOK ? Math.min(y, 900) : 0;
  const k = hs / 900;
  const heroStyle: React.CSSProperties = motionOK
    ? {
        transform: `perspective(1400px) translate3d(0, ${hs * -0.16}px, ${-k * 220}px) rotateX(${k * 11}deg) scale(${1 - k * 0.06})`,
        opacity: Math.max(0, 1 - k * 1.5),
        filter: `blur(${k * 7}px)`,
        transformOrigin: "50% 0%",
      }
    : {};

  const step = Math.min(2, Math.floor(pShow * 3.0001));

  /* ---- 3B kart destesi ---- */
  const deckCards = deals.slice(0, 4);
  const deckPos = pDeck * Math.max(0, deckCards.length - 1);

  return (
    <>
      {/* ═════════════════════════════════════════════════════ kahraman */}
      <section className="band-dark relative -mt-16 overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="animate-drift absolute -left-40 -top-32 h-[46rem] w-[46rem] rounded-full opacity-70 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(44,107,245,.45), transparent 62%)",
              transform: `translate3d(${hs * 0.06}px, ${hs * 0.3}px, 0)`,
            }}
          />
          <div
            className="animate-drift absolute -right-40 top-24 h-[38rem] w-[38rem] rounded-full opacity-60 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(90,141,255,.34), transparent 64%)",
              animationDelay: "-8s",
              transform: `translate3d(${hs * -0.05}px, ${hs * 0.18}px, 0)`,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-shell px-5 pb-40 pt-20 text-center lg:px-8 lg:pb-48 lg:pt-28" style={heroStyle}>
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-[0.8125rem] text-white/80 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-glow opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal-glow" />
            </span>
            {num(active.length)} aktif ilan · piyasa endeksi canlı
          </div>

          <h1 className="display grad-text mx-auto mt-7 max-w-[18ch] text-balance text-[clamp(2.6rem,7vw,5.25rem)]">
            <SplitText text="Ne aradığını cümleyle yaz." step={70} />
          </h1>

          <Reveal delay={340}>
            <p className="mx-auto mt-6 max-w-[52ch] text-[clamp(1.0625rem,2vw,1.375rem)] leading-relaxed text-white/60">
              Fiyatın piyasada nerede durduğunu ve satıcının güven skorunu, ilanın yanında görürsün.
            </p>
          </Reveal>

          <Reveal delay={440} kind="zoom">
            <div className="mx-auto mt-11 max-w-2xl text-left">
              <div className="rounded-full p-[1px]" style={{ background: "linear-gradient(120deg, rgba(90,141,255,.55), rgba(255,255,255,.12) 40%, rgba(90,141,255,.35))" }}>
                <Omnibox big dark />
              </div>
            </div>
          </Reveal>

          <Reveal delay={560}>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 text-[0.9375rem]">
              {PROMPTS.map((q) => (
                <Link key={q} href={`/arama/?nl=${encodeURIComponent(q)}`} className="link-u text-white/55 transition hover:text-white">
                  {q}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-shell grid-cols-2 gap-px px-5 lg:grid-cols-4 lg:px-8">
            {[
              { v: active.length, l: "aktif ilan", f: (n: number) => num(n) },
              { v: medAll, l: "ortanca fiyat", f: (n: number) => tlShort(n) },
              { v: CATEGORIES.reduce((a, c) => a + c.subs.length, 0), l: "alt kategori", f: (n: number) => String(n) },
              { v: CITIES.length, l: "şehir", f: (n: number) => String(n) },
            ].map((s, i) => (
              <Reveal key={s.l} delay={i * 90} kind="rise">
                <div className="px-2 py-8 text-center lg:py-10">
                  <p className="num text-[clamp(1.6rem,3vw,2.25rem)] font-semibold text-white">
                    <CountUp to={s.v} format={s.f} />
                  </p>
                  <p className="mt-1 text-[0.8125rem] text-white/45">{s.l}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ kategoriler */}
      <Section
        title="Nereye bakmak istersin?"
        lead="Üç ana başlık, on alt kategori. Yanlarındaki rakam o an açık olan ilan sayısı."
        href="/arama/"
        hrefLabel="Tüm ilanlar"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {byCat.map(({ c, n, med }, i) => (
            <Reveal key={c.slug} delay={i * 140} kind={i === 0 ? "flipL" : i === 2 ? "flipR" : "tilt"} className="h-full">
              <Tilt max={7} className="h-full">
                <div className="plaque-link group flex h-full flex-col overflow-hidden">
                  <div className="relative h-36 overflow-hidden">
                    <Artwork
                      seed={i * 137 + 4}
                      sub={c.subs[0].slug}
                      className="h-full w-full transition-transform duration-700 ease-apple group-hover:scale-[1.08]"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(15,27,46,.74), rgba(15,27,46,.2))" }} />
                    <div className="absolute inset-x-5 bottom-4 flex items-end justify-between">
                      <h3 className="text-[1.5rem] font-semibold tracking-[-0.028em] text-white">{c.label}</h3>
                      <span className="num rounded-full bg-white/15 px-2.5 py-1 text-[0.75rem] text-white backdrop-blur">{num(n)}</span>
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
              </Tilt>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════ 3B kart destesi (sabitlenmiş) */}
      {deckCards.length >= 3 && (
        <div ref={deck} className="band-dark relative lg:h-[340vh]">
          <div className="flex flex-col justify-center overflow-hidden py-24 lg:sticky lg:top-0 lg:h-screen lg:py-0">
            <div className="mx-auto w-full max-w-shell px-5 lg:px-8">
              <div className="text-center">
                <p className="text-[0.8125rem] font-medium text-signal-glow">Fırsat radarı</p>
                <h2 className="display mt-3 text-[clamp(1.9rem,4vw,3rem)] text-white">
                  <SplitText text="Piyasanın altında kalanlar" />
                </h2>
                <Reveal delay={200}>
                  <p className="mx-auto mt-4 max-w-[48ch] text-[1rem] text-white/55">
                    <span className="hidden lg:inline">Kaydırdıkça deste dönüyor. </span>
                    Her kart, kendi karşılaştırma kümesine göre ne kadar ucuz kaldığını gösteriyor.
                  </p>
                </Reveal>
              </div>

              {/* masaüstü: 3B deste */}
              <div className="relative mt-12 hidden h-[19rem] lg:block" style={{ perspective: "1700px" }}>
                {deckCards.map(({ l, m }, i) => {
                  const d = i - deckPos;
                  const ad = Math.abs(d);
                  return (
                    <div
                      key={l.id}
                      className="absolute left-1/2 top-1/2 w-[30rem]"
                      style={{
                        transform: `translate3d(calc(-50% + ${d * 168}px), calc(-50% + ${ad * 18}px), ${-ad * 300}px) rotateY(${d * -27}deg) rotateX(${ad * 6}deg) scale(${Math.max(0.55, 1 - ad * 0.06)})`,
                        opacity: d < -1.1 ? 0 : Math.max(0, 1 - ad * 0.5),
                        filter: `blur(${Math.min(6, ad * 2.6)}px) saturate(${Math.max(0.4, 1 - ad * 0.3)})`,
                        zIndex: 100 - Math.round(ad * 10),
                        transition: "transform .16s linear, opacity .16s linear, filter .16s linear",
                        transformStyle: "preserve-3d",
                        pointerEvents: ad < 0.5 ? "auto" : "none",
                      }}
                    >
                      <div className="glass overflow-hidden rounded-xl p-6">
                        <div className="flex items-start gap-5">
                          <Artwork seed={l.art} sub={l.sub} kind={String(l.attrs.tur ?? l.attrs.tip ?? "")} className="h-24 w-32 shrink-0 rounded-md" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[0.8125rem] text-white/45">{l.district}, {l.city}</p>
                            <h3 className="mt-1 truncate text-[1.125rem] font-medium text-white">{l.title}</h3>
                            <p className="num mt-3 text-[1.75rem] font-semibold text-white">{tl(l.price)}</p>
                          </div>
                        </div>
                        <div className="mt-6">
                          <div className="relative h-1.5 rounded-full bg-white/15">
                            <div className="absolute inset-y-0 left-[20%] right-[24%] rounded-full bg-white/25" />
                            <div
                              className="absolute -top-1 h-3.5 w-3.5 rounded-full bg-signal-glow shadow-plaque-blue"
                              style={{ left: `${Math.max(2, Math.min(94, 50 + m.delta * 90))}%` }}
                            />
                          </div>
                          <p className="mt-3 text-[0.9375rem] text-white/70">
                            Benzerlerine göre{" "}
                            <span className="font-semibold text-moss">%{Math.round(Math.abs(m.delta) * 100)} daha ucuz</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* mobil: alt alta */}
              <div className="mt-10 grid gap-4 lg:hidden">
                {deckCards.slice(0, 3).map(({ l }, i) => (
                  <Reveal key={l.id} delay={i * 110} kind="tilt">
                    <ListingCard l={l} pool={pool} />
                  </Reveal>
                ))}
              </div>

              <div className="mt-10 hidden justify-center gap-2 lg:flex">
                {deckCards.map((_, i) => (
                  <span
                    key={i}
                    className="h-1 rounded-full"
                    style={{
                      width: Math.round(deckPos) === i ? 32 : 12,
                      background: Math.round(deckPos) === i ? "#5A8DFF" : "rgba(255,255,255,.22)",
                      transition: "width .4s var(--ease-apple), background-color .4s var(--ease-apple)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ sabitlenmiş anlatım bölümü */}
      <div ref={showcase} className="band-soft relative border-y border-line lg:h-[280vh]">
        <div className="flex items-center overflow-visible py-24 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden lg:py-0">
          <div className="relative mx-auto grid w-full max-w-shell items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-[0.8125rem] font-medium text-signal">Farkı nerede</p>
              <h2 className="display mt-3 text-[clamp(1.9rem,4vw,3.1rem)]">
                Bir ilan sitesi fiyatı gösterir.
                <br />
                Biz <span className="text-signal">fiyatın anlamını</span> gösteriyoruz.
              </h2>

              <div className="mt-10 space-y-1">
                {STEPS.map((s, i) => {
                  const on = !isDesk || step === i;
                  return (
                    <div
                      key={s.k}
                      className="relative border-l-2 py-4 pl-6"
                      style={{ borderColor: on ? "#2C6BF5" : "#DCE4F0", transition: "border-color .5s var(--ease-apple)" }}
                    >
                      <p
                        className="text-[1.125rem] font-medium"
                        style={{ color: on ? "#0E1729" : "#8B99AF", transition: "color .5s var(--ease-apple)" }}
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
                        <p className="pt-2 text-[0.9375rem] leading-relaxed text-mute">{s.d}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative grid gap-4 lg:block lg:h-[26rem]" style={{ perspective: "1400px" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="panel overflow-hidden rounded-xl p-7 lg:absolute lg:inset-0"
                  style={
                    isDesk
                      ? {
                          opacity: step === i ? 1 : 0,
                          transform: `translate3d(0, ${step === i ? 0 : step > i ? -40 : 40}px, ${step === i ? 0 : -160}px) rotateY(${step === i ? 0 : step > i ? 22 : -22}deg) scale(${step === i ? 1 : 0.94})`,
                          transition: "opacity .6s var(--ease-out), transform .75s var(--ease-out)",
                          pointerEvents: "none",
                        }
                      : undefined
                  }
                >
                  {i === 0 && (
                    <div>
                      <p className="text-[0.8125rem] text-mute">Sen yazdın</p>
                      <p className="mt-2 text-[1.25rem]">“İzmir Karşıyaka 3+1 daire 5 milyon altı”</p>
                      <p className="mt-7 text-[0.8125rem] text-mute">Biz şunu anladık</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[["şehir", "İzmir"], ["ilçe", "Karşıyaka"], ["oda", "3+1"], ["tip", "Daire"], ["bütçe", "≤ 5.000.000 ₺"]].map(([kk, v]) => (
                          <span key={kk} className="rounded-full bg-signal-soft px-3 py-1.5 text-[0.8125rem] text-signal-ink">
                            <span className="opacity-55">{kk} </span>{v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {i === 1 && (
                    <div>
                      <p className="text-[0.8125rem] text-mute">Bu ilanın fiyatı</p>
                      <p className="num mt-2 text-[2.25rem] font-semibold">3.150.000 ₺</p>
                      <div className="mt-8">
                        <div className="relative h-1.5 rounded-full bg-line">
                          <div className="absolute inset-y-0 left-[18%] right-[26%] rounded-full bg-line-strong" />
                          <div className="absolute -top-1 h-3.5 w-3.5 rounded-full bg-signal shadow-plaque-blue" style={{ left: "27%" }} />
                        </div>
                        <div className="mt-3 flex justify-between text-[0.75rem] text-mute-2">
                          <span>alt %25</span><span>ortanca 3.680.000 ₺</span><span>üst %25</span>
                        </div>
                      </div>
                      <p className="mt-7 text-[0.9375rem] text-mute">
                        Benzer 34 ilana göre <span className="font-semibold text-moss">%14 daha ucuz</span>.
                      </p>
                    </div>
                  )}
                  {i === 2 && (
                    <div>
                      <div className="flex items-baseline justify-between">
                        <p className="text-[0.8125rem] text-mute">Güven skoru</p>
                        <p className="num text-[2rem] font-semibold">86<span className="text-[1rem] text-mute-2">/100</span></p>
                      </div>
                      <div className="mt-4 h-1.5 rounded-full bg-line">
                        <div className="h-full rounded-full bg-moss" style={{ width: "86%" }} />
                      </div>
                      <ul className="mt-6 space-y-3 text-[0.9375rem]">
                        {[["ok", "Satıcı 3 yıldır üye, 24 tamamlanmış ilan"], ["ok", "İlan bütünlüğü tam — tüm alanlar dolu"], ["warn", "Açıklamada “acil” ifadesi geçiyor"]].map(([lv, t]) => (
                          <li key={t} className="flex gap-3">
                            <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${lv === "ok" ? "bg-moss" : "bg-gold"}`} />
                            <span className="text-mute">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 gap-2 lg:flex">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 rounded-full"
                style={{
                  width: step === i ? 34 : 14,
                  background: step === i ? "#2C6BF5" : "#C0CCDF",
                  transition: "width .5s var(--ease-apple), background-color .5s var(--ease-apple)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════ yatay ray: dikey kaydırma ile ilerler */}
      <div ref={rail} className="relative lg:h-[300vh]">
        <div className="overflow-hidden py-20 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:py-0">
          <div className="mx-auto mb-10 w-full max-w-shell px-5 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="display text-[clamp(1.8rem,3.6vw,2.8rem)]">
                <SplitText text="Son eklenenler" />
              </h2>
              <Link href="/arama/" className="link-u text-[0.9375rem] text-signal">Tüm ilanlar <span aria-hidden>→</span></Link>
            </div>
          </div>

          <div
            ref={track}
            className="flex gap-5 px-5 lg:px-8"
            style={
              isDesk && motionOK
                ? { transform: `translate3d(${-pRail * railShift}px,0,0)`, transition: "transform .12s linear", width: "max-content" }
                : { overflowX: "auto", scrollbarWidth: "thin" }
            }
          >
            {fresh.map((l, i) => (
              <div key={l.id} className="w-[19rem] shrink-0">
                <Tilt max={8}>
                  <ListingCard l={l} pool={pool} />
                </Tilt>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 hidden w-full max-w-shell px-5 lg:block lg:px-8">
            <div className="h-1 w-full rounded-full bg-line">
              <div className="h-full rounded-full bg-signal" style={{ width: `${Math.max(6, pRail * 100)}%`, transition: "width .12s linear" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ fırsatlar */}
      {deals.length > 0 && (
        <div className="band-soft border-y border-line">
          <Section
            title="Piyasa ortancasının altında"
            lead="Kendi karşılaştırma kümesine göre belirgin şekilde ucuz kalan ilanlar."
            href="/arama/?s=value"
            hrefLabel="Hepsini sırala"
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {deals.slice(0, 4).map(({ l }, i) => (
                <Reveal key={l.id} delay={i * 110} kind="spin" className="h-full">
                  <Tilt max={9} className="h-full">
                    <ListingCard l={l} pool={pool} />
                  </Tilt>
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
              <Reveal key={l.id} delay={i * 90} kind="up">
                <ListingCard l={l} pool={pool} variant="mini" />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ═════════════════════════════════════════════════════ şehirler */}
      <div className="band-dark">
        <Section title="Şehre göre" lead="Türkiye genelinde açık ilanlar." dark>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
            {CITIES.map((c, i) => {
              const n = active.filter((l) => l.city === c).length;
              return (
                <Reveal key={c} delay={(i % 5) * 70 + Math.floor(i / 5) * 40} kind="zoom" className="h-full">
                  <Link
                    href={`/arama/?il=${encodeURIComponent(c)}`}
                    className="flex h-full items-baseline justify-between bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.1]"
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

      {/* ══════════════════════════════════════════════════════════ CTA */}
      <div className="band-soft">
        <section className="mx-auto max-w-shell px-5 py-24 text-center lg:px-8 lg:py-32">
          <h2 className="display mx-auto max-w-[20ch] text-[clamp(1.9rem,4vw,3rem)]">
            <SplitText text="Sıradaki ilan seninki olsun." step={65} />
          </h2>
          <Reveal delay={240}>
            <p className="mx-auto mt-4 max-w-[46ch] text-[1.0625rem] text-mute">
              Dört adımda yayına alırsın; fiyatını girerken piyasa bandını anında görürsün.
            </p>
          </Reveal>
          <Reveal delay={360} kind="zoom">
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
