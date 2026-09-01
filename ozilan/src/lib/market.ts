import type { Listing } from "./types";
import { attrsFor } from "@/data/taxonomy";
import { CITY_INDEX } from "@/data/geo";

export type MarketRead = {
  n: number;
  median: number;
  p25: number;
  p75: number;
  /** -1..1 where the listing sits inside the p10..p90 band */
  position: number;
  delta: number;
  verdict: "bargain" | "good" | "fair" | "high" | "steep";
  label: string;
  basis: string;
  confidence: "low" | "mid" | "high";
};

const VERDICTS: Record<MarketRead["verdict"], string> = {
  bargain: "Piyasanın belirgin altında",
  good: "Piyasaya göre uygun",
  fair: "Piyasa değerinde",
  high: "Piyasanın hafif üstünde",
  steep: "Piyasanın belirgin üstünde",
};

const q = (sorted: number[], p: number) => {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
};

/** normalise price so that comparables across cities / sizes are on one scale */
function unit(l: Listing): number {
  const m2 = Number(l.attrs.m2);
  const cityAdj = CITY_INDEX[l.city] ?? 1;
  if (l.cat === "emlak" && m2 > 0) return l.price / m2 / cityAdj;
  return l.price / cityAdj;
}

function comparableKeys(cat: string, sub: string) {
  // free-text dimensions match rarely and carry least signal, so they are relaxed first
  const defs = attrsFor(cat, sub).filter((a) => a.comparable && a.key !== "m2");
  const weight = (t: string) => (t === "text" ? 1 : 0);
  return [...defs].sort((a, b) => weight(a.type) - weight(b.type)).map((a) => a.key);
}

function matches(a: Listing, b: Listing, keys: string[]): boolean {
  for (const k of keys) {
    const x = a.attrs[k], y = b.attrs[k];
    if (x == null || y == null) return false;
    if (typeof x === "number" && typeof y === "number") {
      const tol = k === "km" ? 0.6 : k === "yil" ? 0 : 0.35;
      if (k === "yil") { if (Math.abs(x - y) > 3) return false; }
      else if (Math.abs(x - y) > Math.max(Math.abs(y) * tol, 1)) return false;
    } else if (String(x) !== String(y)) return false;
  }
  return true;
}

export function comparables(target: Pick<Listing, "id" | "cat" | "sub" | "deal" | "attrs">, pool: Listing[]) {
  const same = pool.filter(
    (l) => l.id !== target.id && l.cat === target.cat && l.sub === target.sub && l.deal === target.deal && l.price > 0 && l.status === "active",
  );
  const keys = comparableKeys(target.cat, target.sub);
  let used = [...keys];
  let set = same.filter((l) => matches(target as Listing, l, used));
  while (set.length < 6 && used.length) {
    used = used.slice(0, -1);
    set = same.filter((l) => matches(target as Listing, l, used));
  }
  if (set.length < 4) { set = same; used = []; }
  return { set, used, pool: same };
}

export function readMarket(target: Listing, pool: Listing[]): MarketRead | null {
  if (target.price <= 0) return null;
  const same = pool.filter(
    (l) => l.id !== target.id && l.cat === target.cat && l.sub === target.sub && l.deal === target.deal && l.price > 0 && l.status === "active",
  );
  if (same.length < 4) return null;

  const { set, used } = comparables(target, pool);
  if (set.length < 6) return null;

  const vals = set.map(unit).sort((x, y) => x - y);
  const t = unit(target);
  const median = q(vals, 0.5);
  if (!median) return null;
  const p10 = q(vals, 0.1), p25 = q(vals, 0.25), p75 = q(vals, 0.75), p90 = q(vals, 0.9);
  const span = Math.max(p90 - p10, median * 0.08);
  const position = Math.max(-1, Math.min(1, ((t - median) / span) * 2));
  const delta = (t - median) / median;

  const verdict: MarketRead["verdict"] =
    delta < -0.18 ? "bargain" : delta < -0.06 ? "good" : delta <= 0.06 ? "fair" : delta <= 0.2 ? "high" : "steep";

  const scale = target.cat === "emlak" && Number(target.attrs.m2) > 0;
  const basisAttrs = used.length
    ? used.map((k) => String(target.attrs[k])).filter(Boolean).join(" · ")
    : "aynı kategori";

  return {
    n: set.length,
    median: scale ? median * (Number(target.attrs.m2) || 1) * (CITY_INDEX[target.city] ?? 1) : median * (CITY_INDEX[target.city] ?? 1),
    p25: scale ? p25 * (Number(target.attrs.m2) || 1) * (CITY_INDEX[target.city] ?? 1) : p25 * (CITY_INDEX[target.city] ?? 1),
    p75: scale ? p75 * (Number(target.attrs.m2) || 1) * (CITY_INDEX[target.city] ?? 1) : p75 * (CITY_INDEX[target.city] ?? 1),
    position, delta, verdict,
    label: VERDICTS[verdict],
    basis: basisAttrs,
    confidence: used.length === 0 ? "low" : set.length >= 20 ? "high" : set.length >= 10 ? "mid" : "low",
  };
}

/** price suggestion for the listing composer, before an id or price exists */
export function estimate(
  draft: { cat: string; sub: string; deal: string; city: string; attrs: Record<string, unknown> },
  pool: Listing[],
): { low: number; mid: number; high: number; n: number; basis: string } | null {
  const probe = { id: "__draft__", cat: draft.cat, sub: draft.sub, deal: draft.deal, attrs: draft.attrs as Listing["attrs"] };
  const { set, used } = comparables(probe, pool);
  if (set.length < 4) return null;
  const vals = set.map(unit).sort((a, b) => a - b);
  const idx = CITY_INDEX[draft.city] ?? 1;
  const m2 = Number(draft.attrs.m2);
  const scale = draft.cat === "emlak" && m2 > 0 ? m2 * idx : idx;
  const out = (p: number) => Math.max(0, Math.round((q(vals, p) * scale) / 100) * 100);
  return {
    low: out(0.25), mid: out(0.5), high: out(0.75), n: set.length,
    basis: used.length ? used.map((k) => String(draft.attrs[k])).filter(Boolean).join(" · ") : "aynı kategori",
  };
}
