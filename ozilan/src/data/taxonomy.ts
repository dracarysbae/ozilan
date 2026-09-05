import { parseTree, type Node, countLeaves, countNodes } from "./tree";
import { OTO_1 } from "./veh-oto-1";
import { OTO_2 } from "./veh-oto-2";
import { OTO_3 } from "./veh-oto-3";
import { SUV, MOTO, MINIVAN, TICARI, KARAVAN, DENIZ } from "./veh-other";
import { KONUT, ISYERI, ARSA, DEVREMULK, TURISTIK } from "./trees-emlak";
import { ELEKTRONIK, EV_YASAM, HOBI_SPOR, MODA as MODA_TREE } from "./trees-ikinci-el";

export type AttrType = "select" | "number" | "bool" | "text";

export type AttrDef = {
  key: string;
  label: string;
  type: AttrType;
  unit?: string;
  options?: string[];
  /** show as a primary facet in listing cards */
  spotlight?: boolean;
  /** used by the market-price model as a comparability dimension */
  comparable?: boolean;
  required?: boolean;
  /** render the number without thousand separators (years, etc.) */
  plain?: boolean;
};

export type SubCategory = {
  slug: string;
  label: string;
  attrs: AttrDef[];
  /** typical price band, used to seed market stats */
  band: [number, number];
  /** çok kademeli seçim ağacı (marka → seri → paket gibi) */
  tree?: Node[];
  /** ağacın kademe adları; ağacın derinliğiyle aynı uzunlukta olmalı */
  treeLabels?: string[];
};

export type Category = {
  slug: string;
  label: string;
  tagline: string;
  /** 'sale' listings carry a deal type facet */
  dealTypes?: string[];
  subs: SubCategory[];
};

const cond: AttrDef = {
  key: "durum", label: "Durum", type: "select", spotlight: true, comparable: true,
  options: ["Sıfır", "Az kullanılmış", "İyi", "Yıpranmış", "Arızalı / parçalık"],
};

/* ─────────────────────────────────────────────── araç ortak alanları */

const YIL: AttrDef = { key: "yil", label: "Model yılı", type: "number", spotlight: true, comparable: true, required: true, plain: true };
const KM: AttrDef = { key: "km", label: "Kilometre", type: "number", unit: "km", spotlight: true, comparable: true, required: true };
const YAKIT: AttrDef = {
  key: "yakit", label: "Yakıt", type: "select", spotlight: true, comparable: true,
  options: ["Benzin", "Dizel", "LPG & Benzin", "Hibrit", "Elektrik"],
};
const VITES: AttrDef = {
  key: "vites", label: "Vites", type: "select", spotlight: true, comparable: true,
  options: ["Manuel", "Otomatik", "Yarı otomatik"],
};
const RENK: AttrDef = {
  key: "renk", label: "Renk", type: "select",
  options: ["Beyaz", "Siyah", "Gri", "Gümüş", "Mavi", "Kırmızı", "Lacivert", "Yeşil", "Bordo", "Bej", "Turuncu", "Kahverengi"],
};
const HASAR: AttrDef = { key: "hasar", label: "Ağır hasar kayıtlı", type: "bool" };
const TAKAS: AttrDef = { key: "takas", label: "Takasa uygun", type: "bool" };
const CEKIS: AttrDef = { key: "cekis", label: "Çekiş", type: "select", options: ["Önden çekiş", "Arkadan itiş", "4WD (Sürekli)", "AWD (Elektronik)"] };
const KIMDEN: AttrDef = { key: "kimden", label: "Kimden", type: "select", options: ["Sahibinden", "Galeriden", "Yetkili bayiden"] };

const OTO_ATTRS: AttrDef[] = [
  YIL, KM, YAKIT, VITES,
  { key: "kasa", label: "Kasa tipi", type: "select", options: ["Sedan", "Hatchback 5 kapı", "Hatchback 3 kapı", "Station wagon", "Coupe", "Cabrio", "MPV", "Roadster"] },
  { key: "motorHacmi", label: "Motor hacmi", type: "number", unit: "cc" },
  { key: "guc", label: "Motor gücü", type: "number", unit: "hp" },
  CEKIS, RENK,
  { key: "garanti", label: "Garantisi var", type: "bool" },
  { key: "agirBakim", label: "Ağır bakımı yapıldı", type: "bool" },
  HASAR, TAKAS, KIMDEN,
];

/* ══════════════════════════════════════════════════════ kategoriler */

export const CATEGORIES: Category[] = [
  {
    slug: "emlak",
    label: "Emlak",
    tagline: "Konut, iş yeri, arsa",
    dealTypes: ["Satılık", "Kiralık", "Devren", "Günlük kiralık"],
    subs: [
      {
        slug: "konut", label: "Konut", band: [900_000, 14_000_000],
        tree: parseTree(KONUT), treeLabels: ["Konut tipi", "Detay", "Yaş / özellik"],
        attrs: [
          { key: "oda", label: "Oda sayısı", type: "select", spotlight: true, comparable: true, required: true,
            options: ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "6+ üzeri"] },
          { key: "m2", label: "Brüt alan", type: "number", unit: "m²", spotlight: true, comparable: true, required: true },
          { key: "netM2", label: "Net alan", type: "number", unit: "m²" },
          { key: "kat", label: "Bulunduğu kat", type: "select",
            options: ["Bodrum", "Zemin", "Bahçe katı", "1", "2", "3", "4", "5", "6-10", "10+", "Çatı katı", "Villa katı"] },
          { key: "katSayisi", label: "Bina kat sayısı", type: "number" },
          { key: "binaYasi", label: "Bina yaşı", type: "number", unit: "yıl", comparable: true },
          { key: "banyo", label: "Banyo sayısı", type: "select", options: ["1", "2", "3", "4+"] },
          { key: "isitma", label: "Isıtma", type: "select",
            options: ["Doğalgaz kombi", "Merkezi", "Merkezi (pay ölçer)", "Klima", "Yerden ısıtma", "Soba", "Şömine", "Yok"] },
          { key: "cephe", label: "Cephe", type: "select", options: ["Kuzey", "Güney", "Doğu", "Batı", "Güneydoğu", "Güneybatı"] },
          { key: "esya", label: "Eşyalı", type: "bool", spotlight: true },
          { key: "site", label: "Site içerisinde", type: "bool" },
          { key: "otopark", label: "Otopark", type: "bool" },
          { key: "asansor", label: "Asansör", type: "bool" },
          { key: "balkon", label: "Balkon", type: "bool" },
          { key: "depo", label: "Depo / kiler", type: "bool" },
          { key: "krediye", label: "Krediye uygun", type: "bool" },
          KIMDEN,
        ],
      },
      {
        slug: "isyeri", label: "İş yeri", band: [1_200_000, 22_000_000],
        tree: parseTree(ISYERI), treeLabels: ["İş yeri türü", "Tip", "Büyüklük"],
        attrs: [
          { key: "m2", label: "Alan", type: "number", unit: "m²", spotlight: true, comparable: true, required: true },
          { key: "bolum", label: "Bölüm sayısı", type: "number" },
          { key: "katSayisi", label: "Kat sayısı", type: "number" },
          { key: "isitma", label: "Isıtma", type: "select", options: ["Doğalgaz", "Merkezi", "Klima", "Yok"] },
          { key: "kirada", label: "Kiracılı", type: "bool", spotlight: true },
          { key: "devren", label: "Devren", type: "bool" },
          { key: "otopark", label: "Otopark", type: "bool" },
          { key: "krediye", label: "Krediye uygun", type: "bool" },
          KIMDEN,
        ],
      },
      {
        slug: "arsa", label: "Arsa", band: [400_000, 30_000_000],
        tree: parseTree(ARSA), treeLabels: ["İmar durumu", "Nizam / tür", "Büyüklük"],
        attrs: [
          { key: "m2", label: "Yüzölçümü", type: "number", unit: "m²", spotlight: true, comparable: true, required: true },
          { key: "kaks", label: "KAKS / Emsal", type: "text" },
          { key: "gabari", label: "Gabari", type: "text" },
          { key: "tapu", label: "Tapu durumu", type: "select", options: ["Müstakil parsel", "Hisseli", "Kat irtifakı", "Tahsis"] },
          { key: "adaParsel", label: "Ada / parsel", type: "text" },
          { key: "yolu", label: "Yola cepheli", type: "bool" },
          { key: "elektrik", label: "Elektrik var", type: "bool" },
          { key: "su", label: "Su var", type: "bool" },
          { key: "krediye", label: "Krediye uygun", type: "bool" },
          KIMDEN,
        ],
      },
      {
        slug: "devremulk", label: "Devremülk", band: [90_000, 1_400_000],
        tree: parseTree(DEVREMULK), treeLabels: ["Tür", "Konum", "Dönem"],
        attrs: [
          { key: "donem", label: "Dönem", type: "select", spotlight: true, comparable: true, options: ["Sabit dönem", "Değişken dönem", "Altın dönem"] },
          { key: "hafta", label: "Hafta sayısı", type: "number", spotlight: true },
          { key: "m2", label: "Alan", type: "number", unit: "m²", comparable: true },
          { key: "oda", label: "Oda sayısı", type: "select", options: ["1+0", "1+1", "2+1", "3+1"] },
          { key: "tapulu", label: "Tapulu", type: "bool" },
          KIMDEN,
        ],
      },
      {
        slug: "turistik-kiralik", label: "Turistik kiralık", band: [1_500, 90_000],
        tree: parseTree(TURISTIK), treeLabels: ["Kiralama tipi", "Konut tipi", "Oda"],
        attrs: [
          { key: "kapasite", label: "Kapasite", type: "number", unit: "kişi", spotlight: true, comparable: true, required: true },
          { key: "oda", label: "Oda sayısı", type: "select", spotlight: true, options: ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1"] },
          { key: "m2", label: "Alan", type: "number", unit: "m²", comparable: true },
          { key: "havuz", label: "Havuz", type: "bool", spotlight: true },
          { key: "denize", label: "Denize sıfır", type: "bool" },
          { key: "wifi", label: "Wi-Fi", type: "bool" },
          { key: "klima", label: "Klima", type: "bool" },
          { key: "evcil", label: "Evcil hayvan kabul", type: "bool" },
          KIMDEN,
        ],
      },
    ],
  },

  {
    slug: "vasita",
    label: "Vasıta",
    tagline: "Otomobil, arazi & SUV, motosiklet, ticari",
    dealTypes: ["Satılık", "Kiralık"],
    subs: [
      {
        slug: "otomobil", label: "Otomobil", band: [180_000, 6_500_000],
        tree: parseTree(OTO_1 + OTO_2 + OTO_3), treeLabels: ["Marka", "Seri", "Model / paket"],
        attrs: OTO_ATTRS,
      },
      {
        slug: "arazi-suv-pickup", label: "Arazi, SUV & Pickup", band: [450_000, 12_000_000],
        tree: parseTree(SUV), treeLabels: ["Marka", "Seri", "Model / paket"],
        attrs: OTO_ATTRS,
      },
      {
        slug: "motosiklet", label: "Motosiklet", band: [45_000, 1_600_000],
        tree: parseTree(MOTO), treeLabels: ["Marka", "Seri", "Model"],
        attrs: [
          YIL, KM,
          { key: "silindir", label: "Silindir hacmi", type: "number", unit: "cc", spotlight: true, comparable: true },
          { key: "motoTip", label: "Motosiklet tipi", type: "select", spotlight: true, comparable: true,
            options: ["Naked", "Sport", "Touring", "Adventure", "Scooter", "Chopper", "Cross / Enduro", "Cafe Racer", "Elektrikli"] },
          { key: "sogutma", label: "Soğutma", type: "select", options: ["Hava", "Su", "Yağ"] },
          RENK, cond, HASAR, TAKAS, KIMDEN,
        ],
      },
      {
        slug: "minivan-panelvan", label: "Minivan & Panelvan", band: [350_000, 4_500_000],
        tree: parseTree(MINIVAN), treeLabels: ["Marka", "Seri", "Donanım"],
        attrs: [
          YIL, KM, YAKIT, VITES,
          { key: "koltuk", label: "Koltuk sayısı", type: "select", spotlight: true, comparable: true, options: ["2", "3", "5", "6", "7", "8", "9+"] },
          { key: "tavan", label: "Tavan yüksekliği", type: "select", options: ["Normal", "Yüksek", "Ekstra yüksek"] },
          { key: "sasi", label: "Şasi", type: "select", options: ["Kısa", "Orta", "Uzun", "Ekstra uzun"] },
          RENK, HASAR, TAKAS, KIMDEN,
        ],
      },
      {
        slug: "ticari", label: "Ticari araç", band: [800_000, 12_000_000],
        tree: parseTree(TICARI), treeLabels: ["Marka", "Seri", "Model"],
        attrs: [
          { key: "tip", label: "Araç tipi", type: "select", spotlight: true, comparable: true,
            options: ["Kamyonet", "Kamyon", "Çekici", "Otobüs", "Midibüs", "Minibüs", "Tanker", "Damperli", "Frigo"] },
          YIL, KM,
          { key: "motorGucu", label: "Motor gücü", type: "number", unit: "hp", comparable: true },
          { key: "dingil", label: "Dingil sayısı", type: "select", options: ["2", "3", "4", "5+"] },
          { key: "istiap", label: "İstiap haddi", type: "number", unit: "kg" },
          RENK, HASAR, TAKAS, KIMDEN,
        ],
      },
      {
        slug: "karavan", label: "Karavan", band: [400_000, 9_000_000],
        tree: parseTree(KARAVAN), treeLabels: ["Marka", "Seri", "Model"],
        attrs: [
          { key: "karavanTip", label: "Karavan tipi", type: "select", spotlight: true, comparable: true,
            options: ["Motokaravan", "Çekme karavan", "Panelvan dönüşüm", "Kamp römorku"] },
          YIL, KM,
          { key: "yatak", label: "Yatak kapasitesi", type: "select", spotlight: true, options: ["2", "3", "4", "5", "6+"] },
          { key: "wc", label: "Tuvalet & duş", type: "bool" },
          { key: "solar", label: "Solar panel", type: "bool" },
          { key: "isitici", label: "Isıtıcı", type: "bool" },
          cond, TAKAS, KIMDEN,
        ],
      },
      {
        slug: "deniz-araci", label: "Deniz aracı", band: [150_000, 25_000_000],
        tree: parseTree(DENIZ), treeLabels: ["Tekne tipi", "Marka", "Model"],
        attrs: [
          YIL,
          { key: "boy", label: "Boy", type: "number", unit: "m", spotlight: true, comparable: true },
          { key: "motorSaat", label: "Motor saati", type: "number", unit: "saat", spotlight: true },
          { key: "motorGucu", label: "Motor gücü", type: "number", unit: "hp" },
          { key: "malzeme", label: "Gövde malzemesi", type: "select", options: ["Fiber", "Ahşap", "Alüminyum", "Çelik", "Polyester"] },
          { key: "kabin", label: "Kabin sayısı", type: "select", options: ["0", "1", "2", "3", "4+"] },
          cond, TAKAS, KIMDEN,
        ],
      },
    ],
  },

  {
    slug: "ikinci-el",
    label: "İkinci el",
    tagline: "Elektronik, ev, moda, hobi",
    dealTypes: ["Satılık", "Takas", "Ücretsiz"],
    subs: [
      {
        slug: "elektronik", label: "Elektronik", band: [1_500, 180_000],
        tree: parseTree(ELEKTRONIK), treeLabels: ["Ürün türü", "Marka", "Model"],
        attrs: [
          cond,
          { key: "garanti", label: "Garantisi var", type: "bool", spotlight: true },
          { key: "kutulu", label: "Kutulu", type: "bool" },
          { key: "fatura", label: "Faturalı", type: "bool" },
          { key: "hafiza", label: "Hafıza", type: "select", options: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"] },
          { key: "renk", label: "Renk", type: "text" },
          KIMDEN,
        ],
      },
      {
        slug: "ev-yasam", label: "Ev & yaşam", band: [400, 160_000],
        tree: parseTree(EV_YASAM), treeLabels: ["Kategori", "Ürün", "Tip"],
        attrs: [
          cond,
          { key: "malzeme", label: "Malzeme", type: "text" },
          { key: "renk", label: "Renk", type: "text" },
          { key: "olcu", label: "Ölçü", type: "text" },
          { key: "montaj", label: "Montaj dahil", type: "bool" },
          KIMDEN,
        ],
      },
      {
        slug: "hobi-spor", label: "Hobi & spor", band: [300, 220_000],
        tree: parseTree(HOBI_SPOR), treeLabels: ["Kategori", "Ürün", "Tip"],
        attrs: [
          cond,
          { key: "marka", label: "Marka", type: "text", spotlight: true },
          { key: "beden", label: "Beden / ölçü", type: "text" },
          { key: "kutulu", label: "Kutulu", type: "bool" },
          KIMDEN,
        ],
      },
      {
        slug: "moda", label: "Moda", band: [150, 220_000],
        tree: parseTree(MODA_TREE), treeLabels: ["Kategori", "Ürün", "Tip / marka"],
        attrs: [
          { key: "beden", label: "Beden", type: "text", spotlight: true },
          cond,
          { key: "marka", label: "Marka", type: "text", spotlight: true },
          { key: "renk", label: "Renk", type: "text" },
          { key: "orijinal", label: "Orijinal / faturalı", type: "bool" },
          KIMDEN,
        ],
      },
    ],
  },
];

export const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

export function findSub(cat: string, sub: string): SubCategory | undefined {
  return CAT_MAP[cat]?.subs.find((s) => s.slug === sub);
}

export function attrsFor(cat: string, sub: string): AttrDef[] {
  return findSub(cat, sub)?.attrs ?? [];
}

export function treeFor(cat: string, sub: string): Node[] {
  return findSub(cat, sub)?.tree ?? [];
}

export function treeLabelsFor(cat: string, sub: string): string[] {
  return findSub(cat, sub)?.treeLabels ?? [];
}

export function labelFor(cat: string, sub?: string) {
  const c = CAT_MAP[cat];
  if (!c) return cat;
  if (!sub) return c.label;
  return `${c.label} · ${c.subs.find((s) => s.slug === sub)?.label ?? sub}`;
}

/* ağaç büyüklüğü — ana sayfadaki sayaçlar için */
export const TREE_STATS = (() => {
  let leaves = 0, nodes = 0, subs = 0;
  for (const c of CATEGORIES) {
    for (const s of c.subs) {
      subs += 1;
      if (s.tree) { leaves += countLeaves(s.tree); nodes += countNodes(s.tree); }
    }
  }
  return { leaves, nodes, subs };
})();
