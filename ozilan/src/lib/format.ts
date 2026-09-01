export const tl = (n: number) =>
  n === 0 ? "Ücretsiz" : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n) + " TL";

export const tlShort = (n: number) => {
  if (n === 0) return "Ücretsiz";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mn TL";
  if (n >= 1_000) return Math.round(n / 1000) + " b TL";
  return n + " TL";
};

export const num = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export function ago(ts: number, now = Date.now()) {
  const d = Math.max(0, now - ts);
  const m = Math.floor(d / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  const g = Math.floor(h / 24);
  if (g === 1) return "dün";
  if (g < 30) return `${g} gün önce`;
  const ay = Math.floor(g / 30);
  return `${ay} ay önce`;
}

export const dateTR = (ts: number) =>
  new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

export const slugify = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const normalize = (s: string) =>
  s.toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, " ").trim();
