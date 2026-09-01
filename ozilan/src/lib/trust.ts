import type { Listing, Seller } from "./types";
import { normalize } from "./format";
import { readMarket } from "./market";
import { attrsFor } from "@/data/taxonomy";

export type Flag = { level: "info" | "warn" | "risk"; text: string };
export type TrustRead = { score: number; grade: "A" | "B" | "C" | "D"; flags: Flag[]; positives: string[] };

const tokens = (s: string) => new Set(normalize(s).split(" ").filter((w) => w.length > 2));

function jaccard(a: Set<string>, b: Set<string>) {
  let inter = 0;
  a.forEach((x) => { if (b.has(x)) inter++; });
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

const CONTACT = /(\+90|0\s?5\d{2}|whatsapp|wp\s?:|iban|tr\d{2}\s?\d{4})/i;
const PRESSURE = /(sadece bugün|acele|kaçırma|son 2|hemen ara|kapora|ön ödeme|banka havalesi ile)/i;

export function scoreListing(l: Listing, seller: Seller | undefined, pool: Listing[]): TrustRead {
  const flags: Flag[] = [];
  const positives: string[] = [];
  let score = 62;

  if (seller?.verified) { score += 12; positives.push("Kimliği doğrulanmış satıcı"); }
  else flags.push({ level: "warn", text: "Satıcı kimlik doğrulaması yapmamış" });

  if (seller) {
    const days = (Date.now() - seller.joinedAt) / 86400000;
    if (days > 365) { score += 7; positives.push(`${Math.round(days / 365)} yıldır üye`); }
    else if (days < 30) { score -= 10; flags.push({ level: "warn", text: "Hesap 30 günden yeni" }); }
    if (seller.rating >= 4.5 && seller.reviews >= 20) { score += 8; positives.push(`${seller.rating} puan · ${seller.reviews} değerlendirme`); }
    if (seller.rating < 3.8 && seller.reviews >= 8) { score -= 8; flags.push({ level: "warn", text: `Düşük satıcı puanı (${seller.rating})` }); }
    if (seller.kind === "kurumsal") { score += 4; positives.push("Kurumsal üye"); }
  }

  if (l.photos >= 6) { score += 6; positives.push(`${l.photos} fotoğraf yüklenmiş`); }
  else if (l.photos <= 2) { score -= 8; flags.push({ level: "warn", text: "Yetersiz görsel (2 veya daha az)" }); }

  const words = l.desc.trim().split(/\s+/).length;
  if (words >= 60) { score += 5; positives.push("Ayrıntılı açıklama"); }
  else if (words < 18) { score -= 7; flags.push({ level: "warn", text: "Açıklama çok kısa" }); }

  const required = attrsFor(l.cat, l.sub).filter((a) => a.required);
  const missing = required.filter((a) => l.attrs[a.key] === undefined || l.attrs[a.key] === "");
  if (missing.length) { score -= missing.length * 6; flags.push({ level: "warn", text: `Zorunlu alan eksik: ${missing.map((m) => m.label).join(", ")}` }); }
  else if (required.length) { score += 4; }

  if (CONTACT.test(l.desc)) { score -= 14; flags.push({ level: "risk", text: "Açıklamada platform dışı iletişim / IBAN kalıbı" }); }
  if (PRESSURE.test(l.desc)) { score -= 10; flags.push({ level: "risk", text: "Aceleye getiren baskı ifadeleri" }); }

  const m = readMarket(l, pool);
  if (m && m.confidence !== "low") {
    if (m.delta < -0.42) { score -= 20; flags.push({ level: "risk", text: `Fiyat, ${m.n} benzer ilanın ortancasının %${Math.round(-m.delta * 100)} altında` }); }
    else if (m.delta < -0.2) { score -= 6; flags.push({ level: "info", text: "Fiyat piyasa ortancasının belirgin altında" }); }
    else if (Math.abs(m.delta) <= 0.12) { score += 6; positives.push("Fiyat piyasa bandında"); }
  }

  const tl = tokens(l.title);
  const dupes = pool.filter(
    (o) => o.id !== l.id && o.sub === l.sub && Math.abs(o.price - l.price) / Math.max(o.price, 1) < 0.02 && jaccard(tl, tokens(o.title)) > 0.8,
  );
  if (dupes.length) {
    const otherSeller = dupes.some((d) => d.sellerId !== l.sellerId);
    score -= otherSeller ? 18 : 6;
    flags.push({
      level: otherSeller ? "risk" : "info",
      text: otherSeller
        ? `Aynı içerik farklı satıcıda ${dupes.length} kez daha yayında`
        : `Satıcının ${dupes.length} benzer ilanı daha var`,
    });
  }

  if (l.cat === "vasita" && l.attrs.hasar) { score -= 6; flags.push({ level: "info", text: "Ağır hasar kaydı beyan edilmiş" }); }

  score = Math.max(4, Math.min(99, Math.round(score)));
  const grade = score >= 82 ? "A" : score >= 66 ? "B" : score >= 48 ? "C" : "D";
  return { score, grade, flags, positives };
}
