"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filters } from "@/components/Filters";
import { ListingCard } from "@/components/ListingCard";
import { useStore } from "@/lib/store";
import { emptyQuery, paramsToQuery, parseNatural, queryToParams, runQuery, type Query, type Sort } from "@/lib/search";
import { labelFor, CATEGORIES, attrsFor } from "@/data/taxonomy";
import { num } from "@/lib/format";

const SORTS: [Sort, string][] = [
  ["new", "En yeni"],
  ["value", "Piyasa altı önce"],
  ["priceAsc", "Fiyat artan"],
  ["priceDesc", "Fiyat azalan"],
  ["views", "En çok görüntülenen"],
];

function Results() {
  const params = useSearchParams();
  const router = useRouter();
  const { pool, sellers, saveSearch, state } = useStore();
  const [view, setView] = useState<"row" | "grid">("row");
  const [drawer, setDrawer] = useState(false);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState<Query>(emptyQuery());
  const [chips, setChips] = useState<{ label: string; kind: string }[]>([]);

  useEffect(() => {
    const nl = params.get("nl");
    if (nl) {
      const { query, chips } = parseNatural(nl);
      const raw = paramsToQuery(params);
      setQ({ ...query, sort: raw.sort });
      setChips(chips);
    } else {
      setQ(paramsToQuery(params));
      setChips([]);
    }
    setPage(1);
  }, [params]);

  const push = (patch: Partial<Query>) => {
    const next = { ...q, ...patch };
    setQ(next);
    setPage(1);
    setChips([]);
    router.replace(`/arama/?${queryToParams(next).toString()}`, { scroll: false });
  };

  const verifiedIds = useMemo(
    () => new Set(Object.values(sellers).filter((s) => s.verified).map((s) => s.id)),
    [sellers],
  );

  // pool narrowed by everything except the facet being counted (for facet counts)
  const base = useMemo(
    () => runQuery(pool, { ...emptyQuery(), cat: q.cat, sub: q.sub, city: q.city, district: q.district, deal: q.deal }, verifiedIds),
    [pool, q.cat, q.sub, q.city, q.district, q.deal, verifiedIds],
  );

  const results = useMemo(() => runQuery(pool, q, verifiedIds), [pool, q, verifiedIds]);
  const shown = results.slice(0, page * 24);

  const active: { label: string; clear: () => void }[] = [];
  if (q.cat) active.push({ label: labelFor(q.cat, q.sub), clear: () => push({ cat: undefined, sub: undefined, attrs: {}, ranges: {} }) });
  if (q.deal) active.push({ label: q.deal, clear: () => push({ deal: undefined }) });
  if (q.city) active.push({ label: q.district ? `${q.city} / ${q.district}` : q.city, clear: () => push({ city: undefined, district: undefined }) });
  if (q.min != null) active.push({ label: `≥ ${num(q.min)} TL`, clear: () => push({ min: undefined }) });
  if (q.max != null) active.push({ label: `≤ ${num(q.max)} TL`, clear: () => push({ max: undefined }) });
  if (q.verifiedOnly) active.push({ label: "Doğrulanmış satıcı", clear: () => push({ verifiedOnly: false }) });
  for (const [k, vals] of Object.entries(q.attrs))
    for (const v of vals) active.push({ label: v, clear: () => push({ attrs: { ...q.attrs, [k]: q.attrs[k].filter((x) => x !== v) } }) });
  for (const [k, [lo, hi]] of Object.entries(q.ranges))
    active.push({ label: `${k}: ${lo ?? ""}–${hi ?? ""}`, clear: () => { const r = { ...q.ranges }; delete r[k]; push({ ranges: r }); } });
  if (q.q) active.push({ label: `"${q.q}"`, clear: () => push({ q: "" }) });

  const heading = q.cat ? labelFor(q.cat, q.sub) : q.q ? `"${q.q}"` : "Tüm ilanlar";
  const href = `/arama/?${queryToParams(q).toString()}`;
  const saved = state.searches.some((s) => s.href === href);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-6">
      {chips.length > 0 && (
        <div className="mb-6 animate-rise border border-ink bg-ink px-4 py-3 text-paper">
          <p className="eyebrow !text-paper/45">Cümlen şöyle okundu</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 border border-ink-line px-2 py-1 font-mono text-2xs">
                <span className="text-paper/40">{c.kind}</span>
                <span className="text-signal">{c.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="eyebrow">Arama sonuçları</p>
          <h1 className="mt-1 font-serif text-[clamp(1.7rem,3vw,2.6rem)] leading-none">{heading}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="num text-[0.85rem] text-mute">{num(results.length)} ilan</span>
          <button onClick={() => saveSearch(heading, href)} disabled={saved} className="btn-ghost disabled:opacity-40">
            {saved ? "Arama kayıtlı" : "Aramayı kaydet"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[168px] max-h-[calc(100vh-190px)] overflow-auto pr-2">
            <Filters q={q} set={push} pool={pool} base={base} />
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={() => setDrawer(true)} className="btn-ghost lg:hidden">Filtreler</button>
            {active.map((a, i) => (
              <button key={i} onClick={a.clear} className="chip hover:border-signal hover:text-signal">
                {a.label}<span className="text-mute-2">×</span>
              </button>
            ))}
            {active.length > 1 && (
              <button onClick={() => push({ ...emptyQuery(), sort: q.sort })} className="font-mono text-2xs text-signal underline underline-offset-4">
                temizle
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <select value={q.sort} onChange={(e) => push({ sort: e.target.value as Sort })}
                className="h-8 border border-line bg-paper px-2 text-[0.78rem] focus:border-ink focus:outline-none">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <div className="hidden border border-line sm:flex">
                {(["row", "grid"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} aria-label={v === "row" ? "Liste" : "Izgara"}
                    className={`grid h-8 w-8 place-items-center transition ${view === v ? "bg-ink text-paper" : "text-mute hover:text-ink"}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      {v === "row" ? <path d="M4 6h16M4 12h16M4 18h16" /> : <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />}
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {q.cat && q.sub && (() => {
            const defs = attrsFor(q.cat, q.sub);
            const sel = defs.find((d) => d.type === "select" && d.spotlight && d.options);
            const bools = defs.filter((d) => d.type === "bool" && d.spotlight).slice(0, 3);
            if (!sel && !bools.length) return null;
            return (
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <span className="eyebrow mr-1">Hızlı filtre</span>
                {sel?.options!.slice(0, 6).map((o) => {
                  const on = (q.attrs[sel.key] ?? []).includes(o);
                  return (
                    <button key={o} onClick={() => {
                      const cur = q.attrs[sel.key] ?? [];
                      const next = on ? cur.filter((x) => x !== o) : [...cur, o];
                      const attrs = { ...q.attrs }; if (next.length) attrs[sel.key] = next; else delete attrs[sel.key];
                      push({ attrs });
                    }} className={on ? "chip-on" : "chip"}>{o}</button>
                  );
                })}
                {bools.map((b) => {
                  const on = (q.attrs[b.key] ?? []).includes("Evet");
                  return (
                    <button key={b.key} onClick={() => {
                      const attrs = { ...q.attrs };
                      if (on) delete attrs[b.key]; else attrs[b.key] = ["Evet"];
                      push({ attrs });
                    }} className={on ? "chip-on" : "chip"}>{b.label}</button>
                  );
                })}
              </div>
            );
          })()}

          {results.length === 0 ? (
            <div className="border border-line p-10 text-center">
              <p className="font-serif text-2xl">Bu kriterlerde ilan bulunamadı</p>
              <p className="mt-2 text-[0.88rem] text-mute">Filtreleri gevşetmeyi ya da cümleyi sadeleştirmeyi dene.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c.slug} onClick={() => push({ ...emptyQuery(), cat: c.slug })} className="chip hover:border-ink">{c.label}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
                {shown.map((l) => <ListingCard key={l.id} l={l} pool={pool} variant={view} />)}
              </div>
              {shown.length < results.length && (
                <div className="mt-8 flex justify-center">
                  <button onClick={() => setPage((p) => p + 1)} className="btn-primary px-8">
                    Daha fazla göster ({num(results.length - shown.length)})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-auto bg-paper p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="eyebrow">Filtreler</span>
              <button onClick={() => setDrawer(false)} className="btn-quiet">Kapat</button>
            </div>
            <Filters q={q} set={push} pool={pool} base={base} />
            <button onClick={() => setDrawer(false)} className="btn-primary mt-4 w-full">{num(results.length)} ilanı göster</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-20 text-mute lg:px-6">Yükleniyor…</div>}>
      <Results />
    </Suspense>
  );
}
