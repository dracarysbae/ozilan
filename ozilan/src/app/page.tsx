"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Omnibox } from "@/components/Omnibox";
import { ListingCard } from "@/components/ListingCard";
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

function Section({
  title,
  href,
  hrefLabel = "Tümü",
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-shell px-5 py-14 lg:px-6 lg:py-20">
      <div className="mb-7 flex items-baseline justify-between gap-4">
        <h2 className="display text-[1.75rem] lg:text-[2rem]">{title}</h2>
        {href && (
          <Link href={href} className="shrink-0 text-[0.9375rem] text-signal transition hover:opacity-70">
            {hrefLabel} <span aria-hidden>›</span>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const { pool, ready, state } = useStore();

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

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-shell px-5 pb-16 pt-20 text-center lg:px-6 lg:pb-24 lg:pt-28">
          <h1 className="display mx-auto max-w-[16ch] text-[clamp(2.4rem,6vw,4.25rem)]">
            Ne aradığını cümleyle yaz.
          </h1>
          <p className="mx-auto mt-5 max-w-[46ch] text-[clamp(1.0625rem,2vw,1.3125rem)] leading-snug text-mute">
            Fiyatın piyasada nerede durduğunu da, satıcının güven skorunu da yanında gösteriyoruz.
          </p>

          <div className="mx-auto mt-10 max-w-2xl text-left">
            <Omnibox big />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.9375rem]">
            {PROMPTS.map((p) => (
              <Link
                key={p}
                href={`/arama/?nl=${encodeURIComponent(p)}`}
                className="text-signal transition hover:opacity-70"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- kategoriler */}
      <Section title="Kategoriler" href="/arama/" hrefLabel="Tüm ilanlar">
        <div className="grid gap-4 md:grid-cols-3">
          {byCat.map(({ c, n, med }) => (
            <div key={c.slug} className="plaque flex flex-col p-6">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={e/arama/?k=${c.slug}`} className="text-[1.375rem] font-semibold tracking-[-0.02em] hover:text-signal">
                  {c.label}
                </Link>
                <span className="num text-[0.8125rem] text-mute-2">{num(n)} ilan</span>
              </div>

              <div className="rows mt-5 flex-1">
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

              <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-[0.8125rem] text-mute">Ortanca fiyat</span>
                <span className="num text-[1.0625rem] font-semibold">{tlShort(med)}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- deals */}
      {deals.length > 0 && (
        <div className="border-t border-line bg-paper-3/60">
          <Section title="Piyasa ortancasının altında" href="/arama/?s=value" hrefLabel="Hepsini sırala">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {deals.map((l) => (
                <ListingCard key={l.id} l={l} pool={pool} />
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* -------------------------------------------------------- recent */}
      {recent.length > 0 && (
        <Section title="Kaldığın yerden">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((l) => (
              <ListingCard key={l.id} l={l} pool={pool} variant="mini" />
            ))}
          </div>
        </Section>
      )}

      {/* --------------------------------------------------------- fresh */}
      <Section title="Son eklenenler" href="/arama/" hrefLabel="Tüm ilanlar">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fresh.map((l) => (
            <ListingCard key={l.id} l={l} pool={pool} />
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------ Şehirler */}
      <div className="border-t border-line">
        <Section title="Şehre göre">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {CITIES.map((c) => {
              const n = active.filter((l) => l.city === c).length;
              return (
                <Link
                  key={c}
                  href={`/arama/?il=${encodeURIComponent(c)}`}
                  className="text-[0.9375rem] text-ink transition hover:text-signal"
                >
                  {c} <span className="num text-mute-2">{n}</span>
                </Link>
              );
            })}
          </div>
        </Section>
      </div>
    </>
  );
}
