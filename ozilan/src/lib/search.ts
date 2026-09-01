import type { Listing } from "./types";
import { normalize } from "./format";
import { CATEGORIES, findSub } from "@/data/taxonomy";
import { GEO, CITIES } from "@/data/geo";
import { readMarket } from "./market";

export type Sort = "new" | "priceAsc" | "priceDesc" | "value" | "views";

export type Query = {
  q: string;
  cat?: string;
  sub?: string;
  deal?: string;
  city?: string;
  district?: string;
  min?: number;
  max?: number;
  attrs: Record<string, string[]>;
  ranges: Record<string, [number | undefined, number | undefined]>;
  sort: Sort;
  photosOnly?: boolean;
  verifiedOnly?: boolean;
};

export const emptyQuery = (): Query => ({ q: "", attrs: {}, ranges: {}, sort: "new" });

/* ------------------------------------------------------------------ */
/*  natural language front-end                                         */
/* ------------------------------------------------------------------ */

const SUB_WORDS: [string, string, string][] = [
  ["daire", "emlak", "konut"], ["ev", "emlak", "konut"], ["konut", "emlak", "konut"],
  ["rezidans", "emlak", "konut"], ["villa", "emlak", "konut"],
  ["dukkan", "emlak", "isyeri"], ["ofis", "emlak", "isyeri"], ["is yeri", "emlak", "isyeri"],
  ["isyeri", "emlak", "isyeri"], ["depo", "emlak", "isyeri"],
  ["arsa", "emlak", "arsa"], ["tarla", "emlak", "arsa"], ["parsel", "emlak", "arsa"],
  ["araba", "vasita", "otomobil"], ["otomobil", "vasita", "otomobil"], ["oto", "vasita", "otomobil"],
  ["arac", "vasita", "otomobil"], ["motosiklet", "vasita", "motosiklet"], ["motor", "vasita", "motosiklet"],
  ["scooter", "vasita", "motosiklet"], ["kamyonet", "vasita", "ticari"], ["panelvan", "vasita", "ticari"],
  ["kamyon", "vasita", "ticari"], ["minibus", "vasita", "ticari"],
  ["telefon", "ikinci-el", "elektronik"], ["iphone", "ikinci-el", "elektronik"], ["laptop", "ikinci-el", "elektronik"],
  ["bilgisayar", "ikinci-el", "elektronik"], ["macbook", "ikinci-el", "elektronik"], ["televizyon", "ikinci-el", "elektronik"],
  ["tv", "ikinci-el", "elektronik"], ["konsol", "ikinci-el", "elektronik"], ["playstation", "ikinci-el", "elektronik"],
  ["ekran karti", "ikinci-el", "elektronik"], ["tablet", "ikinci-el", "elektronik"],
  ["koltuk", "ikinci-el", "ev-yasam"], ["mobilya", "ikinci-el", "ev-yasam"], ["beyaz esya", "ikinci-el", "ev-yasam"],
  ["buzdolabi", "ikinci-el", "ev-yasam"], ["hali", "ikinci-el", "ev-yasam"],
  ["bisiklet", "ikinci-el", "hobi-spor"], ["gitar", "ikinci-el", "hobi-spor"], ["kamp", "ikinci-el", "hobi-spor"],
  ["saat", "ikinci-el", "moda"], ["ayakkabi", "ikinci-el", "moda"], ["canta", "ikinci-el", "moda"],
];

const DEAL_WORDS: [string, string][] = [
  ["kiralik", "Kiralık"], ["kirali", "Kiralık"], ["satilik", "Satılık"], ["devren", "Devren"],
  ["takas", "Takas"], ["ucretsiz", "Ücretsiz"], ["bedava", "Ücretsiz"],
];

const MULT: Record<string, number> = { milyon: 1e6, mn: 1e6, bin: 1e3, b: 1e3, k: 1e3 };

function numAt(raw: string, mult?: string) {
  // "1.250.000" binlik ayraçtır, "1.5" ondalıktır — ikisini karıştırma
  const cleaned = /^\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, "") : raw.replace(",", ".");
  const n = parseFloat(cleaned);
  if (isNaN(n)) return undefined;
  return mult ? n * (MULT[mult] ?? 1) : n;
}

export type Chip = { label: string; kind: string };

export function parseNatural(input: string, base: Query = emptyQuery()): { query: Query; chips: Chip[] } {
  const q: Query = { ...base, attrs: { ...base.attrs }, ranges: { ...base.ranges } };
  const chips: Chip[] = [];
  let t = " " + normalize(input) + " ";

  const eat = (re: RegExp) => { t = t.replace(re, " "); };

  // city / district
  for (const city of CITIES) {
    const n = normalize(city);
    if (new RegExp(`\\b${n}\\b`).test(t)) {
      q.city = city; chips.push({ label: city, kind: "Şehir" });
      eat(new RegExp(`\\b${n}\\b`, "g"));
      for (const d of GEO[city]) {
        const dn = normalize(d);
        if (new RegExp(`\\b${dn}\\b`).test(t)) { q.district = d; chips.push({ label: d, kind: "İlçe" }); eat(new RegExp(`\\b${dn}\\b`, "g")); break; }
      }
      break;
    }
  }
  if (!q.city) {
    outer: for (const city of CITIES) for (const d of GEO[city]) {
      const dn = normalize(d);
      if (dn.length > 4 && new RegExp(`\\b${dn}\\b`).test(t)) {
        q.city = city; q.district = d;
        chips.push({ label: city, kind: "Şehir" }, { label: d, kind: "İlçe" });
        eat(new RegExp(`\\b${dn}\\b`, "g")); break outer;
      }
    }
  }

  for (const [w, deal] of DEAL_WORDS) {
    if (new RegExp(`\\b${w}`).test(t)) { q.deal = deal; chips.push({ label: deal, kind: "İşlem" }); eat(new RegExp(`\\b${w}\\w*`, "g")); break; }
  }

  for (const [w, cat, sub] of SUB_WORDS) {
    if (new RegExp(`\\b${w}\\b`).test(t)) {
      q.cat = cat; q.sub = sub;
      const label = findSub(cat, sub)?.label ?? sub;
      chips.push({ label, kind: "Kategori" });
      if (!["ev", "oto", "motor", "tv"].includes(w)) eat(new RegExp(`\\b${w}\\b`, "g"));
      break;
    }
  }

  // rooms  3+1
  const oda = t.match(/\b(\d\+\d)\b/);
  if (oda) { q.attrs.oda = [oda[1]]; chips.push({ label: oda[1], kind: "Oda" }); q.cat ||= "emlak"; q.sub ||= "konut"; eat(/\b\d\+\d\b/g); }

  // m2
  const m2 = t.match(/\b(\d{2,5})\s*(m2|metrekare|m²)\b/);
  if (m2) { q.ranges.m2 = [numAt(m2[1])! * 0.85, numAt(m2[1])! * 1.2]; chips.push({ label: `${m2[1]} m² civarı`, kind: "Alan" }); eat(/\b\d{2,5}\s*(m2|metrekare|m²)\b/g); }

  // km
  const km = t.match(/\b(\d+(?:[.,]\d+)?)\s*(bin|b|k)?\s*km\b\s*(alti|altinda|asagi|az|ustu|uzeri|ustunde|fazla)?/);
  if (km) {
    const v = numAt(km[1], km[2]);
    const up = km[3] && /(ust|uzer|fazla)/.test(km[3]);
    if (v) { q.ranges.km = up ? [v, undefined] : [undefined, v]; chips.push({ label: `${up ? "≥" : "≤"} ${v.toLocaleString("tr-TR")} km`, kind: "Kilometre" }); }
    eat(/\b\d+(?:[.,]\d+)?\s*(bin|b|k)?\s*km\b\s*(alti|altinda|asagi|az|ustu|uzeri|ustunde|fazla)?/g);
  }

  // model year
  const yil = t.match(/\b(19|20)(\d{2})\s*(model|yili|ve)?\s*(sonrasi|ustu|uzeri|oncesi|alti|model)?/);
  if (yil && /(model|yili|sonrasi|ustu|uzeri|oncesi|alti)/.test(yil[0])) {
    const y = parseInt(yil[1] + yil[2]);
    const older = /(oncesi|alti)/.test(yil[0]);
    const newer = /(sonrasi|ustu|uzeri)/.test(yil[0]);
    q.ranges.yil = newer ? [y, undefined] : older ? [undefined, y] : [y, y];
    chips.push({ label: `${newer ? "≥" : older ? "≤" : ""} ${y} model`, kind: "Yıl" });
    eat(/\b(19|20)\d{2}\s*(model|yili|ve)?\s*(sonrasi|ustu|uzeri|oncesi|alti|model)?/g);
  }

  // price range  "500 bin - 1 milyon arasi"
  const range = t.match(/\b(\d+(?:[.,]\d+)?)\s*(milyon|mn|bin|b|k)?\s*(?:-|ile|ila|\/)\s*(\d+(?:[.,]\d+)?)\s*(milyon|mn|bin|b|k)?\s*(tl|lira|arasi|arasinda)?/);
  if (range) {
    const a = numAt(range[1], range[2] || range[4]);
    const b = numAt(range[3], range[4]);
    if (a && b) { q.min = Math.min(a, b); q.max = Math.max(a, b); chips.push({ label: `${q.min.toLocaleString("tr-TR")} – ${q.max.toLocaleString("tr-TR")} TL`, kind: "Fiyat" }); }
    eat(/\b\d+(?:[.,]\d+)?\s*(milyon|mn|bin|b|k)?\s*(?:-|ile|ila|\/)\s*\d+(?:[.,]\d+)?\s*(milyon|mn|bin|b|k)?\s*(tl|lira|arasi|arasinda)?/g);
  } else {
    const one = t.match(/\b(\d+(?:[.,]\d+)?)\s*(milyon|mn|bin|b|k)?\s*(tl|lira|₺)?\s*(alti|altinda|asagi|max|en fazla|kadar|ustu|uzeri|ustunde|min|en az|baslayan)/);
    if (one) {
      const v = numAt(one[1], one[2]);
      const up = /(ust|uzer|min|en az|baslayan)/.test(one[4]);
      if (v) { if (up) q.min = v; else q.max = v; chips.push({ label: `${up ? "≥" : "≤"} ${v.toLocaleString("tr-TR")} TL`, kind: "Fiyat" }); }
      eat(/\b\d+(?:[.,]\d+)?\s*(milyon|mn|bin|b|k)?\s*(tl|lira|₺)?\s*(alti|altinda|asagi|max|en fazla|kadar|ustu|uzeri|ustunde|min|en az|baslayan)/g);
    }
  }

  // enum attributes straight from the taxonomy of the guessed sub-category
  const subs = q.sub ? [findSub(q.cat!, q.sub)!] : CATEGORIES.flatMap((c) => c.subs);
  for (const s of subs) {
    for (const a of s.attrs) {
      if (a.type !== "select" || !a.options) continue;
      for (const opt of a.options) {
        const on = normalize(opt);
        if (on.length < 3) continue;
        if (new RegExp(`\\b${on.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t)) {
          (q.attrs[a.key] ||= []).push(opt);
          chips.push({ label: opt, kind: a.label });
          eat(new RegExp(`\\b${on.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"));
          if (!q.sub) { q.cat = CATEGORIES.find((c) => c.subs.includes(s))!.slug; q.sub = s.slug; }
        }
      }
    }
    if (q.sub) break;
  }

  const boolWords: [RegExp, string, string][] = [
    [/\besyali\b/, "esya", "Eşyalı"], [/\bsite\s?(icinde|icerisinde)?\b/, "site", "Site içerisinde"],
    [/\botopark\b/, "otopark", "Otopark"], [/\basansor\b/, "asansor", "Asansör"],
    [/\bkrediye uygun\b/, "krediye", "Krediye uygun"], [/\btakasl?i?\b/, "takas", "Takasa uygun"],
    [/\bgarantili\b/, "garanti", "Garantili"],
  ];
  for (const [re, key, label] of boolWords) {
    if (re.test(t)) { q.attrs[key] = ["Evet"]; chips.push({ label, kind: "Özellik" }); eat(new RegExp(re.source, "g")); }
  }

  if (/\bfotograf|resimli\b/.test(t)) { q.photosOnly = true; eat(/\bfotografli|resimli\b/g); }
  if (/\bonayli|dogrulanmis\b/.test(t)) { q.verifiedOnly = true; chips.push({ label: "Doğrulanmış satıcı", kind: "Filtre" }); eat(/\bonayli|dogrulanmis\b/g); }
  if (/\bucuz|uygun fiyat|pazarlik\b/.test(t)) { q.sort = "value"; chips.push({ label: "Piyasa altı önce", kind: "Sıralama" }); eat(/\bucuz|uygun fiyat|pazarlikli?\b/g); }
  if (/\byeni|son eklenen\b/.test(t)) { q.sort = "new"; eat(/\byeni|son eklenen\b/g); }

  const stop = new Set(["ve", "ile", "icin", "olan", "bir", "arasi", "civari", "tl", "lira", "arıyorum", "ariyorum", "istiyorum", "lazim", "acil", "alti", "ustu", "model", "km", "en", "az", "cok", "fazla"]);
  q.q = t.split(/\s+/).filter((w) => w && !stop.has(w)).join(" ").trim();

  return { query: q, chips };
}

/* ------------------------------------------------------------------ */
/*  filtering + ranking                                                */
/* ------------------------------------------------------------------ */

function textHit(l: Listing, q: string) {
  if (!q) return true;
  const hay = normalize([l.title, l.city, l.district, l.desc, ...Object.values(l.attrs).map(String)].join(" "));
  return q.split(" ").every((w) => hay.includes(w));
}

export function runQuery(pool: Listing[], query: Query, verifiedIds?: Set<string>) {
  let res = pool.filter((l) => l.status === "active");
  const { q, cat, sub, deal, city, district, min, max, attrs, ranges } = query;

  if (cat) res = res.filter((l) => l.cat === cat);
  if (sub) res = res.filter((l) => l.sub === sub);
  if (deal) res = res.filter((l) => l.deal === deal);
  if (city) res = res.filter((l) => l.city === city);
  if (district) res = res.filter((l) => l.district === district);
  if (min != null) res = res.filter((l) => l.price >= min);
  if (max != null) res = res.filter((l) => l.price <= max);
  if (query.photosOnly) res = res.filter((l) => l.photos >= 3);
  if (query.verifiedOnly && verifiedIds) res = res.filter((l) => verifiedIds.has(l.sellerId));

  for (const [k, vals] of Object.entries(attrs)) {
    if (!vals?.length) continue;
    res = res.filter((l) => {
      const v = l.attrs[k];
      if (typeof v === "boolean") return vals.includes("Evet") ? v === true : true;
      return vals.includes(String(v));
    });
  }
  for (const [k, [lo, hi]] of Object.entries(ranges)) {
    res = res.filter((l) => {
      const v = Number(l.attrs[k]);
      if (isNaN(v)) return false;
      if (lo != null && v < lo) return false;
      if (hi != null && v > hi) return false;
      return true;
    });
  }
  if (q) res = res.filter((l) => textHit(l, q));

  switch (query.sort) {
    case "priceAsc": res = [...res].sort((a, b) => a.price - b.price); break;
    case "priceDesc": res = [...res].sort((a, b) => b.price - a.price); break;
    case "views": res = [...res].sort((a, b) => b.views - a.views); break;
    case "value": {
      const withDelta = res.map((l) => ({ l, d: readMarket(l, pool)?.delta ?? 0 }));
      res = withDelta.sort((a, b) => a.d - b.d).map((x) => x.l);
      break;
    }
    default: res = [...res].sort((a, b) => b.bumpedAt - a.bumpedAt);
  }
  return res;
}

/** live suggestions for the omnibox */
export function suggest(input: string, pool: Listing[]): string[] {
  const n = normalize(input);
  if (n.length < 2) return [];
  const out = new Set<string>();
  for (const c of CATEGORIES) for (const s of c.subs) {
    if (normalize(s.label).includes(n)) out.add(`${s.label}`);
  }
  for (const city of CITIES) if (normalize(city).startsWith(n)) out.add(`${city}`);
  for (const l of pool) {
    if (out.size > 9) break;
    if (normalize(l.title).includes(n)) out.add(l.title);
  }
  return [...out].slice(0, 8);
}

export function queryToParams(q: Query): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.cat) p.set("k", q.cat);
  if (q.sub) p.set("a", q.sub);
  if (q.deal) p.set("i", q.deal);
  if (q.city) p.set("il", q.city);
  if (q.district) p.set("ilce", q.district);
  if (q.min != null) p.set("min", String(q.min));
  if (q.max != null) p.set("max", String(q.max));
  if (q.sort !== "new") p.set("s", q.sort);
  if (q.verifiedOnly) p.set("v", "1");
  const a = Object.entries(q.attrs).filter(([, v]) => v?.length);
  if (a.length) p.set("f", a.map(([k, v]) => `${k}:${v.join("|")}`).join(","));
  const r = Object.entries(q.ranges).filter(([, v]) => v[0] != null || v[1] != null);
  if (r.length) p.set("r", r.map(([k, v]) => `${k}:${v[0] ?? ""}-${v[1] ?? ""}`).join(","));
  return p;
}

export function paramsToQuery(p: URLSearchParams): Query {
  const q = emptyQuery();
  q.q = p.get("q") ?? "";
  q.cat = p.get("k") ?? undefined;
  q.sub = p.get("a") ?? undefined;
  q.deal = p.get("i") ?? undefined;
  q.city = p.get("il") ?? undefined;
  q.district = p.get("ilce") ?? undefined;
  const min = p.get("min"), max = p.get("max");
  if (min) q.min = +min;
  if (max) q.max = +max;
  q.sort = (p.get("s") as Sort) ?? "new";
  q.verifiedOnly = p.get("v") === "1";
  for (const part of (p.get("f") ?? "").split(",").filter(Boolean)) {
    const [k, v] = part.split(":");
    if (k && v) q.attrs[k] = v.split("|");
  }
  for (const part of (p.get("r") ?? "").split(",").filter(Boolean)) {
    const [k, v] = part.split(":");
    if (!k || !v) continue;
    const [lo, hi] = v.split("-");
    q.ranges[k] = [lo ? +lo : undefined, hi ? +hi : undefined];
  }
  return q;
}
