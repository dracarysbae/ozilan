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

export const CATEGORIES: Category[] = [
  {
    slug: "emlak",
    label: "Emlak",
    tagline: "Konut, iş yeri, arsa",
    dealTypes: ["Satılık", "Kiralık", "Devren"],
    subs: [
      {
        slug: "konut", label: "Konut", band: [900_000, 14_000_000],
        attrs: [
          { key: "oda", label: "Oda sayısı", type: "select", spotlight: true, comparable: true, required: true,
            options: ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "6+ üzeri"] },
          { key: "m2", label: "Brüt alan", type: "number", unit: "m²", spotlight: true, comparable: true, required: true },
          { key: "kat", label: "Bulunduğu kat", type: "select",
            options: ["Bodrum", "Zemin", "Bahçe katı", "1", "2", "3", "4", "5", "6-10", "10+", "Çatı katı"] },
          { key: "binaYasi", label: "Bina yaşı", type: "number", unit: "yıl", comparable: true },
          { key: "isitma", label: "Isıtma", type: "select",
            options: ["Doğalgaz kombi", "Merkezi", "Merkezi (pay ölçer)", "Klima", "Yerden ısıtma", "Soba", "Yok"] },
          { key: "esya", label: "Eşyalı", type: "bool", spotlight: true },
          { key: "site", label: "Site içerisinde", type: "bool" },
          { key: "otopark", label: "Otopark", type: "bool" },
          { key: "asansor", label: "Asansör", type: "bool" },
          { key: "krediye", label: "Krediye uygun", type: "bool" },
        ],
      },
      {
        slug: "isyeri", label: "İş yeri", band: [1_200_000, 22_000_000],
        attrs: [
          { key: "m2", label: "Alan", type: "number", unit: "m²", spotlight: true, comparable: true, required: true },
          { key: "tip", label: "İş yeri tipi", type: "select", spotlight: true, comparable: true,
            options: ["Dükkan", "Ofis", "Depo", "Fabrika", "Plaza katı", "Atölye"] },
          { key: "bolum", label: "Bölüm sayısı", type: "number" },
          { key: "kirada", label: "Kiracılı", type: "bool" },
        ],
      },
      {
        slug: "arsa", label: "Arsa", band: [400_000, 30_000_000],
        attrs: [
          { key: "m2", label: "Yüzölçümü", type: "number", unit: "m²", spotlight: true, comparable: true, required: true },
          { key: "imar", label: "İmar durumu", type: "select", spotlight: true, comparable: true,
            options: ["Konut imarlı", "Ticari imarlı", "Tarla", "Bağ / bahçe", "Sanayi", "Villa imarlı"] },
          { key: "kaks", label: "KAKS / Emsal", type: "text" },
          { key: "tapu", label: "Tapu durumu", type: "select", options: ["Müstakil parsel", "Hisseli", "Kat irtifakı"] },
        ],
      },
    ],
  },
  {
    slug: "vasita",
    label: "Vasıta",
    tagline: "Otomobil, motosiklet, ticari",
    dealTypes: ["Satılık", "Kiralık"],
    subs: [
      {
        slug: "otomobil", label: "Otomobil", band: [180_000, 4_500_000],
        attrs: [
          { key: "marka", label: "Marka", type: "select", spotlight: true, comparable: true, required: true,
            options: ["Volkswagen", "Renault", "Fiat", "Ford", "Toyota", "Hyundai", "Opel", "Peugeot", "BMW", "Mercedes-Benz", "Audi", "Honda", "Citroën", "Dacia", "Skoda", "Seat", "Nissan", "Kia", "Volvo", "Tesla"] },
          { key: "model", label: "Model", type: "text", spotlight: true, required: true },
          { key: "yil", label: "Model yılı", type: "number", spotlight: true, comparable: true, required: true, plain: true },
          { key: "km", label: "Kilometre", type: "number", unit: "km", spotlight: true, comparable: true, required: true },
          { key: "yakit", label: "Yakıt", type: "select", spotlight: true, comparable: true,
            options: ["Benzin", "Dizel", "LPG & Benzin", "Hibrit", "Elektrik"] },
          { key: "vites", label: "Vites", type: "select", spotlight: true, comparable: true,
            options: ["Manuel", "Otomatik", "Yarı otomatik"] },
          { key: "kasa", label: "Kasa tipi", type: "select",
            options: ["Sedan", "Hatchback", "Station wagon", "SUV", "Coupe", "Cabrio", "MPV"] },
          { key: "motorHacmi", label: "Motor hacmi", type: "number", unit: "cc" },
          { key: "guc", label: "Motor gücü", type: "number", unit: "hp" },
          { key: "renk", label: "Renk", type: "select",
            options: ["Beyaz", "Siyah", "Gri", "Gümüş", "Mavi", "Kırmızı", "Lacivert", "Yeşil", "Bordo", "Bej"] },
          { key: "hasar", label: "Ağır hasar kayıtlı", type: "bool" },
          { key: "takas", label: "Takasa uygun", type: "bool" },
        ],
      },
      {
        slug: "motosiklet", label: "Motosiklet", band: [45_000, 1_200_000],
        attrs: [
          { key: "marka", label: "Marka", type: "select", spotlight: true, comparable: true, required: true,
            options: ["Honda", "Yamaha", "Bajaj", "Kawasaki", "Suzuki", "KTM", "BMW", "Ducati", "Mondial", "Kuba"] },
          { key: "model", label: "Model", type: "text", spotlight: true, required: true },
          { key: "yil", label: "Model yılı", type: "number", spotlight: true, comparable: true, required: true, plain: true },
          { key: "km", label: "Kilometre", type: "number", unit: "km", spotlight: true, comparable: true, required: true },
          { key: "silindir", label: "Silindir hacmi", type: "number", unit: "cc", comparable: true },
          cond,
        ],
      },
      {
        slug: "ticari", label: "Ticari araç", band: [350_000, 6_500_000],
        attrs: [
          { key: "marka", label: "Marka", type: "select", spotlight: true, comparable: true, required: true,
            options: ["Ford", "Mercedes-Benz", "Volkswagen", "Iveco", "Renault", "Fiat", "Isuzu", "Man", "Scania"] },
          { key: "tip", label: "Araç tipi", type: "select", spotlight: true, comparable: true,
            options: ["Panelvan", "Minibüs", "Kamyonet", "Kamyon", "Çekici", "Otobüs"] },
          { key: "yil", label: "Model yılı", type: "number", spotlight: true, comparable: true, required: true, plain: true },
          { key: "km", label: "Kilometre", type: "number", unit: "km", spotlight: true, comparable: true, required: true },
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
        slug: "elektronik", label: "Elektronik", band: [1_500, 120_000],
        attrs: [
          { key: "tur", label: "Ürün türü", type: "select", spotlight: true, comparable: true, required: true,
            options: ["Telefon", "Dizüstü bilgisayar", "Masaüstü", "Tablet", "Televizyon", "Kulaklık", "Fotoğraf makinesi", "Oyun konsolu", "Ekran kartı"] },
          { key: "marka", label: "Marka", type: "text", spotlight: true, comparable: true, required: true },
          cond,
          { key: "garanti", label: "Garantisi var", type: "bool", spotlight: true },
          { key: "kutulu", label: "Kutulu", type: "bool" },
          { key: "fatura", label: "Faturalı", type: "bool" },
        ],
      },
      {
        slug: "ev-yasam", label: "Ev & yaşam", band: [400, 90_000],
        attrs: [
          { key: "tur", label: "Ürün türü", type: "select", spotlight: true, comparable: true, required: true,
            options: ["Koltuk takımı", "Yatak odası", "Yemek odası", "Beyaz eşya", "Halı", "Aydınlatma", "Bahçe", "Mutfak"] },
          cond,
          { key: "malzeme", label: "Malzeme", type: "text" },
        ],
      },
      {
        slug: "hobi-spor", label: "Hobi & spor", band: [300, 180_000],
        attrs: [
          { key: "tur", label: "Ürün türü", type: "select", spotlight: true, comparable: true, required: true,
            options: ["Bisiklet", "Müzik aleti", "Kamp", "Fitness", "Koleksiyon", "Kitap", "Su sporları", "Kayak"] },
          cond,
          { key: "marka", label: "Marka", type: "text", spotlight: true },
        ],
      },
      {
        slug: "moda", label: "Moda", band: [150, 60_000],
        attrs: [
          { key: "tur", label: "Ürün türü", type: "select", spotlight: true, comparable: true, required: true,
            options: ["Giyim", "Ayakkabı", "Çanta", "Saat", "Takı", "Aksesuar"] },
          { key: "beden", label: "Beden", type: "text", spotlight: true },
          cond,
          { key: "marka", label: "Marka", type: "text", spotlight: true },
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

export function labelFor(cat: string, sub?: string) {
  const c = CAT_MAP[cat];
  if (!c) return cat;
  if (!sub) return c.label;
  return `${c.label} · ${c.subs.find((s) => s.slug === sub)?.label ?? sub}`;
}
