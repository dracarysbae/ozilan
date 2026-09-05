import { CATEGORIES, findSub } from "./taxonomy";
import type { Node } from "./tree";
import { GEO, CITIES, CITY_INDEX } from "./geo";
import { mulberry32, pick, int, chance } from "@/lib/prng";
import type { Listing, Seller, AttrValue } from "@/lib/types";

const FIRST = ["Ahmet", "Mehmet", "Elif", "Zeynep", "Burak", "Cem", "Deniz", "Selin", "Emre", "Merve", "Kaan", "Ayşe", "Onur", "Gizem", "Hakan", "Sibel", "Tolga", "Ceren", "Serkan", "Pelin"];
const LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç"];
const FIRMS = ["Meydan Gayrimenkul", "Nova Otomotiv", "Kule Emlak", "Anadolu Motors", "Piksel Teknoloji", "Marmara Yapı", "Ege Oto Galeri", "Zirve Emlak", "Atlas Ticaret", "Levent Gayrimenkul"];

const PREMIUM_AUTO = ["BMW", "Mercedes-Benz", "Audi", "Porsche", "Land Rover", "Range Rover", "Jaguar", "Volvo", "Lexus", "Maserati", "Tesla", "Bentley", "Ferrari", "Lamborghini", "Alfa Romeo", "Mini", "Cupra", "DS Automobiles", "Genesis", "Infiniti"];
const PREMIUM_MOTO = ["BMW", "Ducati", "KTM", "Kawasaki", "Triumph", "Harley-Davidson", "Aprilia", "MV Agusta", "Moto Guzzi", "Indian"];

/* ─────────────────────────────────────── ağaçtan rastgele yaprak seç */

function pickPath(r: () => number, tree: Node[] | undefined): { path: string[]; labels: string[] } {
  const path: string[] = [];
  const labels: string[] = [];
  let level = tree;
  let guard = 0;
  while (level && level.length && guard++ < 8) {
    const n = level[int(r, 0, level.length - 1)];
    path.push(n.slug);
    labels.push(n.label);
    level = n.kids;
  }
  return { path, labels };
}

/* Etiketlerdeki "50-100 m²", "20+ yaş", "5-20 dönüm" gibi aralıkları sayıya çevirir. */
function bandNum(r: () => number, label: string, lo: number, hi: number, openTop = 2.2): number {
  const nums = (label.match(/\d+/g) || []).map(Number);
  if (nums.length >= 2) return int(r, Math.max(nums[0], 1), Math.max(nums[1], nums[0] + 1));
  if (nums.length === 1) {
    if (/üzeri|\+|üstü/.test(label)) return int(r, nums[0] || 1, Math.round((nums[0] || 1) * openTop) + 5);
    return nums[0];
  }
  return int(r, lo, hi);
}

function roomsIn(labels: string[]): string | null {
  for (let i = labels.length - 1; i >= 0; i--) {
    const m = labels[i].match(/\d\+\d|\d\+\d ve üzeri/);
    if (m) return m[0];
  }
  return null;
}

function ageFrom(r: () => number, labels: string[]): number {
  const l = labels[labels.length - 1] ?? "";
  if (/sıfır/i.test(l)) return 0;
  const m = l.match(/(\d+)\s*-\s*(\d+)\s*yaş/);
  if (m) return int(r, +m[1], +m[2]);
  const p = l.match(/(\d+)\s*\+?\s*yaş/);
  if (p) return int(r, +p[1], +p[1] + 22);
  return int(r, 0, 34);
}

function m2From(r: () => number, labels: string[], lo: number, hi: number): number {
  const l = labels[labels.length - 1] ?? "";
  if (/dönüm/.test(l)) return bandNum(r, l, 1, 20, 3) * 1000;
  if (/m²/.test(l)) return bandNum(r, l, lo, hi, 2.4);
  return int(r, lo, hi);
}

/* motor / yakıt tutarlılığı — paket adından çıkarılır */
function fuelFrom(r: () => number, text: string, brand: string): string {
  const t = text.toLowerCase();
  if (/elektrik|kwh|\bah\b|\bev\b|e-tron|edrive|\bid\.|ioniq|kona electric|model [3ysx]|taycan|\bbev\b|\bi[3478]\b|\bix\d?\b|eqa|eqb|eqc|eqe|eqs|\beq\b|e-208|e-2008|zoe|leaf|ariya|enyaq|born|megane e|bolt|\bmg4\b|atto|dolphin|seal\b/.test(t) || brand === "Tesla") return "Elektrik";
  if (/hybrid|hibrit|hev|phev|e-power|e:hev/.test(t)) return "Hibrit";
  if (/dizel|diesel|tdi|dci|cdti|bluehdi|tdci|crdi|hdi|jtd|multijet|d-4d|bluetec|\bcdi\b|\bdi-d\b|\bd\b(?!\w)/.test(t)) return "Dizel";
  if (/benzin|petrol/.test(t)) return pick(r, ["Benzin", "Benzin", "Benzin", "LPG & Benzin"]);
  if (/tsi|tce|tfsi|vti|puretech|mpi|gdi|ecoboost|turbo|vvt|fsi|\bt\d\b/.test(t)) return pick(r, ["Benzin", "Benzin", "Benzin", "LPG & Benzin"]);
  return pick(r, ["Benzin", "Benzin", "Dizel", "LPG & Benzin", "Hibrit"]);
}

function engineCc(r: () => number, text: string): number {
  const m = text.match(/(\d)\.(\d)\b/);
  if (m) return +m[1] * 1000 + +m[2] * 100;
  return pick(r, [1000, 1200, 1300, 1400, 1500, 1600, 1800, 2000, 2500, 3000]);
}

function ccFrom(r: () => number, text: string): number {
  const m = text.match(/\b(\d{3,4})\b/);
  if (m && +m[1] >= 50 && +m[1] <= 2500) return +m[1];
  return pick(r, [125, 150, 200, 250, 300, 400, 500, 650, 750, 900, 1000]);
}

/** "4 Mevsim" gibi etiketlerden marka uydurmamak için */
const NOT_A_BRAND = new Set(["dijital", "elektrikli", "akustik", "klasik", "modern", "vintage", "katlanır", "ayarlanabilir", "profesyonel", "çocuk", "kadın", "erkek", "unisex", "büyük", "küçük", "orta", "tek", "çift", "set", "takım", "yeni", "eski", "deri", "ahşap", "metal", "cam", "altın", "gümüş", "şişme", "otomatik", "manuel", "kısa", "uzun", "geniş", "ince"]);
function brandToken(label: string): string | null {
  const t = (label || "").split(" ")[0];
  if (!/^[A-ZÇĞİÖŞÜ][\wçğıöşüÇĞİÖŞÜ.-]{2,}$/.test(t)) return null;
  return NOT_A_BRAND.has(t.toLocaleLowerCase("tr")) ? null : t;
}

const WEAR: Record<string, number> = { "Sıfır": 1, "Az kullanılmış": 0.78, "İyi": 0.58, "Yıpranmış": 0.38, "Arızalı / parçalık": 0.18 };
const COND = ["Sıfır", "Az kullanılmış", "Az kullanılmış", "İyi", "İyi", "Yıpranmış"];

/** yaşı ve kullanımı olan bir şey "Sıfır" olamaz */
function condFor(r: () => number, age: number, used: number, usedNew = 1200): string {
  if (age <= 0 && used <= usedNew) return "Sıfır";
  if (age <= 2 && used < usedNew * 12) return pick(r, ["Sıfır", "Az kullanılmış", "Az kullanılmış"]);
  if (age <= 6) return pick(r, ["Az kullanılmış", "İyi", "İyi"]);
  if (age <= 12) return pick(r, ["İyi", "İyi", "Yıpranmış"]);
  return pick(r, ["İyi", "Yıpranmış", "Yıpranmış", "Arızalı / parçalık"]);
}

/** L1 zaten L2'nin içinde geçiyorsa tekrar etme */
function joinLabel(a: string, b: string): string {
  const words = a.split(/[\s&]+/).filter((w) => w.length > 2);
  return words.some((w) => b.toLocaleLowerCase("tr").includes(w.toLocaleLowerCase("tr"))) ? b : `${a} ${b}`;
}

/* ─────────────────────────────────────────────────────── açıklamalar */

function desc(r: () => number, l: Omit<Listing, "desc">): string {
  const openers = [
    "İlanımız hakkında detaylı bilgi için mesaj yoluyla ulaşabilirsiniz.",
    "Aşağıdaki bilgiler eksiksiz ve doğrudur, gezmeden karar vermeyin.",
    "Acil ihtiyaç sebebiyle satılıktır, ciddi alıcılar dikkate alınacaktır.",
    "Uzun süredir özenle kullanılmıştır, tüm bakımları zamanında yapılmıştır.",
  ];
  const closers = [
    "Takas ve pazarlık konusunda net bilgi mesajlaşarak paylaşılır.",
    "Hafta içi 09:00–19:00 arası görüşülebilir.",
    "Fatura ve tüm evraklar mevcuttur.",
    "Yer gösterimi randevu ile yapılmaktadır.",
  ];
  const body: string[] = [pick(r, openers)];
  if (l.pathLabels?.length) body.push(`Kategori: ${l.pathLabels.join(" › ")}.`);
  if (l.cat === "emlak") {
    body.push(`${l.district} bölgesinde, ulaşımı kolay bir konumda yer almaktadır. Toplu taşıma, market ve okullara yürüme mesafesindedir.`);
    if (l.attrs.site) body.push("Güvenlikli site içerisinde, 7/24 kameralı sistem ve otopark mevcuttur.");
    if (l.attrs.esya) body.push("Eşyalı olarak devredilecektir; beyaz eşya ve mobilyalar fiyata dahildir.");
    if (l.attrs.havuz) body.push("Ortak havuz ve bahçe kullanımı ilan fiyatına dahildir.");
  } else if (l.cat === "vasita") {
    if (l.attrs.yil) {
      const km = l.attrs.km ? `${Number(l.attrs.km).toLocaleString("tr-TR")} km'dedir` : "düşük kullanımlıdır";
      body.push(`Aracımız ${l.attrs.yil} model olup ${km}. Periyodik bakımları yetkili serviste yapılmıştır.`);
    }
    body.push(l.attrs.hasar ? "Ağır hasar kaydı bulunmaktadır, fiyata yansıtılmıştır." : "Ağır hasar kaydı yoktur, boyalı parçalar ekspertiz raporunda belirtilmiştir.");
  } else {
    body.push("Ürün fotoğraflardaki gibidir, ek görsel talep edebilirsiniz. Kargo alıcıya aittir, elden teslim tercih edilir.");
  }
  body.push(pick(r, closers));
  return body.join("\n\n");
}

/* ───────────────────────────────────────────────── ilan gövdesi üret */

type Made = { attrs: Record<string, AttrValue>; title: string; price: number; path: string[]; pathLabels: string[] };

function makeAttrs(r: () => number, cat: string, sub: string, city: string): Made {
  const s = findSub(cat, sub)!;
  const idx = CITY_INDEX[city] ?? 1;
  const { path, labels } = pickPath(r, s.tree);
  const L0 = labels[0] ?? "", L1 = labels[1] ?? "", L2 = labels[labels.length - 1] ?? "";
  const a: Record<string, AttrValue> = {};
  let title = labels.join(" ");
  let price = 0;
  const YEAR = 2026;

  if (sub === "konut") {
    const oda = roomsIn(labels) ?? pick(r, ["1+1", "2+1", "2+1", "3+1", "3+1", "4+1"]);
    const rooms = parseInt(oda) + 1;
    const villa = /villa|müstakil|çiftlik|dubleks|triplex/i.test(L0 + L1);
    const m2 = int(r, 45 + rooms * (villa ? 24 : 12), 60 + rooms * (villa ? 55 : 32));
    const yas = ageFrom(r, labels);
    a.oda = oda; a.m2 = m2; a.netM2 = Math.round(m2 * (0.8 + r() * 0.1)); a.binaYasi = yas;
    a.kat = villa ? "Villa katı" : pick(r, ["Zemin", "1", "2", "3", "4", "5", "6-10", "Çatı katı", "Bahçe katı"]);
    a.katSayisi = villa ? int(r, 2, 3) : int(r, 3, 14);
    a.banyo = pick(r, ["1", "1", "2", "2", "3"]);
    a.isitma = pick(r, ["Doğalgaz kombi", "Doğalgaz kombi", "Merkezi", "Yerden ısıtma", "Klima"]);
    a.cephe = pick(r, ["Kuzey", "Güney", "Doğu", "Batı", "Güneydoğu", "Güneybatı"]);
    a.esya = /eşyalı/i.test(L2) ? true : /eşyasız/i.test(L2) ? false : chance(r, 0.22);
    a.site = /rezidans|villa/i.test(L0) ? chance(r, 0.85) : chance(r, 0.42);
    a.otopark = chance(r, 0.55);
    a.asansor = villa ? false : Number(a.katSayisi) >= 5 ? chance(r, 0.95) : chance(r, 0.35);
    a.balkon = chance(r, 0.78); a.depo = chance(r, 0.4); a.krediye = chance(r, 0.8);
    const perM2 = (30000 + r() * 12000) * idx * (1 - Math.min(yas, 40) * 0.008) * (a.site ? 1.1 : 1) * (villa ? 1.25 : 1);
    price = Math.round((m2 * perM2) / 5000) * 5000;
    title = `${oda} · ${m2} m² · ${yas < 2 ? "Sıfır" : yas < 6 ? "Yeni" : "Bakımlı"} ${L1.replace(/^\d\+\d.*/, L0)}${a.site ? " · Site İçinde" : ""}`;
  } else if (sub === "isyeri") {
    const odaSayisi = /oda|daire/.test(L2) ? bandNum(r, L2, 8, 60, 1.8) : 0;
    const m2 = odaSayisi ? odaSayisi * int(r, 28, 46) : m2From(r, labels, 40, 900);
    a.m2 = m2; a.bolum = odaSayisi || int(r, 1, 8); a.katSayisi = int(r, 1, 4);
    a.isitma = pick(r, ["Doğalgaz", "Merkezi", "Klima", "Yok"]);
    a.kirada = chance(r, 0.3); a.devren = chance(r, 0.18);
    a.otopark = chance(r, 0.45); a.krediye = chance(r, 0.6);
    const heavy = /depo|fabrika|üretim|antrepo|sanayi/i.test(L0 + L1) ? 0.45 : 1;
    price = Math.round((m2 * (24000 + r() * 14000) * idx * heavy) / 10000) * 10000;
    title = `${joinLabel(L0, L1)} · ${m2.toLocaleString("tr-TR")} m²${odaSayisi ? ` · ${odaSayisi} Oda` : ""}`;
  } else if (sub === "arsa") {
    const m2 = m2From(r, labels, 300, 9000);
    a.m2 = m2;
    a.kaks = /tarla|bağ|bahçe|mera|orman/i.test(L0) ? "-" : pick(r, ["0.30", "0.50", "1.00", "1.50", "2.00"]);
    a.gabari = a.kaks === "-" ? "-" : pick(r, ["6.50 m", "9.50 m", "12.50 m", "15.50 m", "Serbest"]);
    a.tapu = pick(r, ["Müstakil parsel", "Müstakil parsel", "Hisseli", "Kat irtifakı"]);
    a.adaParsel = `${int(r, 100, 3200)} / ${int(r, 1, 240)}`;
    a.yolu = chance(r, 0.7); a.elektrik = chance(r, 0.6); a.su = chance(r, 0.55); a.krediye = chance(r, 0.5);
    const perM2 = (/tarla|mera|orman/i.test(L0) ? 900 : /bağ|bahçe|zeytin|fındık/i.test(L0) ? 1600 : /sanayi/i.test(L0) ? 4200 : /ticari/i.test(L0) ? 8800 : 6500) * (0.85 + r() * 0.3) * idx;
    price = Math.round((m2 * perM2) / 25000) * 25000;
    title = `${joinLabel(L0, L1)} · ${m2 >= 5000 ? `${Math.round(m2 / 1000)} Dönüm` : `${m2.toLocaleString("tr-TR")} m²`}`;
  } else if (sub === "devremulk") {
    const hafta = Math.min(bandNum(r, L2, 1, 3, 1.6), 6);
    a.hafta = hafta; a.donem = pick(r, ["Sabit dönem", "Değişken dönem", "Altın dönem"]);
    a.m2 = int(r, 45, 140); a.oda = pick(r, ["1+0", "1+1", "1+1", "2+1", "3+1"]);
    a.tapulu = chance(r, 0.72);
    const kind = /deniz/i.test(L1) ? 1.6 : /termal/i.test(L1) ? 1.15 : /dağ|kayak/i.test(L1) ? 1.35 : 1;
    price = Math.round((160_000 * kind * hafta * (a.donem === "Altın dönem" ? 1.45 : 1) * (0.85 + r() * 0.4)) / 5000) * 5000;
    title = `${L1} ${L0} · ${hafta} Hafta · ${a.oda}`;
  } else if (sub === "turistik-kiralik") {
    const oda = roomsIn(labels) ?? pick(r, ["1+1", "2+1", "3+1"]);
    const rooms = parseInt(oda) + 1;
    a.oda = oda; a.kapasite = rooms * 2;
    a.m2 = int(r, 40 + rooms * 14, 70 + rooms * 40);
    a.havuz = /villa|bungalov/i.test(L1) ? chance(r, 0.8) : chance(r, 0.25);
    a.denize = chance(r, 0.35); a.wifi = chance(r, 0.92); a.klima = chance(r, 0.88); a.evcil = chance(r, 0.3);
    const gunluk = (2600 + r() * 5200) * (a.havuz ? 1.6 : 1) * (a.denize ? 1.35 : 1) * (rooms / 3) * idx;
    price = /aylık/i.test(L0) ? Math.round((gunluk * 16) / 500) * 500 : Math.round(gunluk / 250) * 250;
    title = `${L1} · ${oda} · ${a.kapasite} Kişilik${a.havuz ? " · Havuzlu" : ""} ${/aylık/i.test(L0) ? "Aylık" : "Günlük"} Kiralık`;
  } else if (sub === "otomobil" || sub === "arazi-suv-pickup" || sub === "minivan-panelvan") {
    const marka = L0, seri = L1, paket = L2;
    const yil = int(r, 2007, YEAR);
    const age = YEAR - yil;
    const km = Math.round(int(r, 3, 30) * 1000 * Math.max(age, 0.35));
    const yakit = fuelFrom(r, paket + " " + seri, marka);
    const vites = yakit === "Elektrik" ? "Otomatik" : pick(r, ["Otomatik", "Otomatik", "Otomatik", "Manuel", "Yarı otomatik"]);
    a.yil = yil; a.km = km; a.yakit = yakit; a.vites = vites;
    a.renk = pick(r, ["Beyaz", "Beyaz", "Siyah", "Siyah", "Gri", "Gümüş", "Mavi", "Kırmızı", "Lacivert", "Bej"]);
    a.hasar = chance(r, 0.11); a.takas = chance(r, 0.45);
    a.garanti = age <= 3 && chance(r, 0.55); a.agirBakim = age >= 6 && chance(r, 0.5);
    a.kimden = pick(r, ["Sahibinden", "Sahibinden", "Galeriden", "Yetkili bayiden"]);
    const suv = sub === "arazi-suv-pickup";
    const van = sub === "minivan-panelvan";
    if (sub !== "minivan-panelvan") {
      a.motorHacmi = yakit === "Elektrik" ? 0 : engineCc(r, paket);
      const cc = Number(a.motorHacmi) || 1600;
      a.guc = yakit === "Elektrik" ? int(r, 150, 520)
        : Math.round((cc / 1000) * int(r, 60, 105) * (/gti|\bgt\b|\br\b|amg|\bm\d|rs\b|\bs\d|abarth|type r|\bn\b/i.test(paket) ? 1.5 : 1));
      a.cekis = suv ? pick(r, ["4WD (Sürekli)", "AWD (Elektronik)", "Önden çekiş", "Arkadan itiş"]) : pick(r, ["Önden çekiş", "Önden çekiş", "Arkadan itiş", "AWD (Elektronik)"]);
      a.kasa = suv ? "MPV" : pick(r, ["Sedan", "Sedan", "Hatchback 5 kapı", "Hatchback 3 kapı", "Station wagon", "Coupe", "Cabrio", "MPV"]);
    } else {
      a.koltuk = pick(r, ["2", "3", "5", "5", "6", "7", "8", "9+"]);
      a.tavan = pick(r, ["Normal", "Normal", "Yüksek", "Ekstra yüksek"]);
      a.sasi = pick(r, ["Kısa", "Orta", "Orta", "Uzun", "Ekstra uzun"]);
    }
    const premium = PREMIUM_AUTO.includes(marka) ? 2.3 : ["Volkswagen", "Skoda", "Toyota", "Honda", "Mazda", "Subaru"].includes(marka) ? 1.25 : 1;
    let p = (van ? 1_500_000 : suv ? 2_900_000 : 1_950_000) * premium * Math.pow(0.875, age) * (1 - Math.min(km / 420000, 0.55)) * (vites !== "Manuel" ? 1.12 : 1);
    if (yakit === "Elektrik") p *= 1.5;
    if (yakit === "Hibrit") p *= 1.22;
    if (a.hasar) p *= 0.7;
    price = Math.round((p * (0.9 + r() * 0.2)) / 5000) * 5000;
    title = `${marka} ${seri} ${paket} · ${yil} · ${vites}`;
  } else if (sub === "motosiklet") {
    const yil = int(r, 2011, YEAR);
    const km = int(r, 400, 68000);
    const cc = ccFrom(r, L2 + " " + L1);
    a.yil = yil; a.km = km; a.silindir = cc;
    a.motoTip = /scooter|nmax|pcx|xmax|forza|burgman|maxsym/i.test(L1 + L2) ? "Scooter"
      : /adventure|gs\b|africa|versys|v-strom|tenere/i.test(L1 + L2) ? "Adventure"
      : /\br\d|ninja|cbr|gsx-r|rr\b|panigale/i.test(L1 + L2) ? "Sport"
      : /chopper|bobber|vulcan|rebel|harley/i.test(L0 + L1) ? "Chopper"
      : /cross|enduro|exc|\bmx\b/i.test(L1 + L2) ? "Cross / Enduro"
      : pick(r, ["Naked", "Naked", "Touring", "Cafe Racer", "Sport"]);
    a.sogutma = cc >= 250 ? pick(r, ["Su", "Su", "Yağ"]) : pick(r, ["Hava", "Hava", "Yağ"]);
    a.renk = pick(r, ["Siyah", "Beyaz", "Kırmızı", "Mavi", "Gri", "Yeşil", "Turuncu"]);
    a.durum = condFor(r, YEAR - yil, km, 800); a.hasar = chance(r, 0.09); a.takas = chance(r, 0.35);
    a.kimden = pick(r, ["Sahibinden", "Sahibinden", "Galeriden", "Yetkili bayiden"]);
    const premium = PREMIUM_MOTO.includes(L0) ? 2.4 : 1;
    price = Math.round((96_000 * premium * (0.55 + cc / 420) * Math.pow(0.9, YEAR - yil) * (1 - Math.min(km / 170000, 0.5)) * (0.88 + r() * 0.26)) / 1000) * 1000;
    title = `${L0} ${L1} ${L2 === L1 ? "" : L2} · ${yil} · ${cc} cc`.replace(/\s+/g, " ");
  } else if (sub === "ticari") {
    const yil = int(r, 2009, YEAR);
    const all = labels.join(" ");
    a.yil = yil;
    a.tip = /çekici|tır|actros|tgx|\bfh\b|\bxf\b|stralis|s-way/i.test(all) ? "Çekici"
      : /otobüs|travego|tourismo|safir|maraton|avenue|citaro|\bbus\b/i.test(all) ? "Otobüs"
      : /midibüs|prestij|otoyol/i.test(all) ? "Midibüs"
      : /minibüs|sprinter|transit|master|ducato|daily/i.test(all) ? "Minibüs"
      : /kamyonet|\bnpr\b|\bnkr\b|canter/i.test(all) ? "Kamyonet"
      : /tanker/i.test(all) ? "Tanker" : /damper/i.test(all) ? "Damperli" : /frigo/i.test(all) ? "Frigo"
      : pick(r, ["Kamyon", "Kamyonet", "Çekici"]);
    const km = Math.round(int(r, 25, 62) * 1000 * Math.max(YEAR - yil, 0.4));
    a.km = km;
    const agir = ["Kamyon", "Çekici", "Otobüs", "Tanker", "Damperli"].includes(String(a.tip));
    a.motorGucu = agir ? int(r, 280, 560) : int(r, 110, 210);
    a.dingil = agir ? pick(r, ["2", "3", "3", "4", "5+"]) : "2";
    a.istiap = agir ? int(r, 8000, 26000) : int(r, 1200, 4500);
    a.renk = pick(r, ["Beyaz", "Beyaz", "Gri", "Mavi", "Kırmızı", "Siyah"]);
    a.hasar = chance(r, 0.14); a.takas = chance(r, 0.4);
    a.kimden = pick(r, ["Sahibinden", "Galeriden", "Yetkili bayiden"]);
    const heavy = agir ? 2.6 : 1;
    price = Math.round((1_450_000 * heavy * Math.pow(0.885, YEAR - yil) * (1 - Math.min(km / 1_500_000, 0.5)) * (0.9 + r() * 0.22)) / 10000) * 10000;
    title = `${L0} ${L1} ${L2 === L1 ? "" : L2} · ${yil} · ${a.tip}`.replace(/\s+/g, " ");
  } else if (sub === "karavan") {
    const yil = int(r, 2008, YEAR);
    a.yil = yil;
    const allK = labels.join(" ");
    a.karavanTip = /motokaravan|motorhome|integral|alkoven|semi/i.test(allK) ? "Motokaravan"
      : /çekme|treyler|römork|\bcaravan\b/i.test(allK) ? "Çekme karavan"
      : /panelvan|dönüşüm|\bvan\b|camper/i.test(allK) ? "Panelvan dönüşüm"
      : pick(r, ["Motokaravan", "Motokaravan", "Çekme karavan", "Panelvan dönüşüm"]);
    a.km = a.karavanTip === "Çekme karavan" || a.karavanTip === "Kamp römorku" ? 0 : int(r, 8000, 260000);
    a.yatak = pick(r, ["2", "2", "3", "4", "4", "5", "6+"]);
    a.wc = chance(r, 0.72); a.solar = chance(r, 0.55); a.isitici = chance(r, 0.68);
    a.durum = condFor(r, YEAR - yil, Number(a.km), 2000); a.takas = chance(r, 0.3);
    a.kimden = pick(r, ["Sahibinden", "Sahibinden", "Galeriden"]);
    const kind = a.karavanTip === "Motokaravan" ? 2.4 : a.karavanTip === "Panelvan dönüşüm" ? 1.5 : 1;
    price = Math.round((900_000 * kind * Math.pow(0.93, YEAR - yil) * (WEAR[String(a.durum)] * 0.5 + 0.6) * (0.9 + r() * 0.25)) / 10000) * 10000;
    title = `${L0} ${L1} ${L2 === L1 ? "" : L2} · ${yil} · ${a.yatak} Yatak`.replace(/\s+/g, " ");
  } else if (sub === "deniz-araci") {
    const yil = int(r, 1998, YEAR);
    const boy = /şişme|bot|jet ski|kano|kayak|sandal/i.test(L0) ? int(r, 3, 7)
      : /gulet|trawler|mega|yelkenli yat/i.test(L0) ? int(r, 14, 38)
      : /yat|motoryat/i.test(L0) ? int(r, 10, 26)
      : /sürat|day cruiser|rib/i.test(L0) ? int(r, 6, 14)
      : int(r, 5, 13);
    a.yil = yil; a.boy = boy;
    a.motorSaat = int(r, 40, 4200);
    a.motorGucu = Math.round(boy * int(r, 18, 55));
    a.malzeme = /ahşap|gulet/i.test(L0 + L1) ? "Ahşap"
      : /şişme|rib/i.test(L0) ? pick(r, ["Fiber", "Polyester"])
      : boy > 24 ? pick(r, ["Çelik", "Alüminyum", "Fiber"])
      : pick(r, ["Fiber", "Fiber", "Fiber", "Polyester", "Alüminyum"]);
    a.kabin = boy < 7 ? "0" : boy < 11 ? pick(r, ["1", "2"]) : pick(r, ["2", "3", "4+"]);
    a.durum = condFor(r, YEAR - yil, Number(a.motorSaat), 60); a.takas = chance(r, 0.22);
    a.kimden = pick(r, ["Sahibinden", "Sahibinden", "Galeriden"]);
    price = Math.round((Math.pow(boy, 2.35) * 9000 * Math.pow(0.965, YEAR - yil) * (WEAR[String(a.durum)] * 0.45 + 0.65) * (0.85 + r() * 0.35)) / 5000) * 5000;
    title = `${L1} ${L2 === L1 ? "" : L2} · ${boy} m · ${yil}`.replace(/\s+/g, " ");
  } else if (sub === "elektronik") {
    const durum = pick(r, COND);
    a.durum = durum;
    a.garanti = durum === "Sıfır" ? true : chance(r, 0.35);
    a.kutulu = durum === "Sıfır" ? true : chance(r, 0.5);
    a.fatura = chance(r, 0.62);
    if (/telefon|tablet|bilgisayar|konsol/i.test(L0)) a.hafiza = pick(r, ["64 GB", "128 GB", "128 GB", "256 GB", "512 GB", "1 TB"]);
    a.renk = pick(r, ["Siyah", "Beyaz", "Gri", "Mavi", "Gümüş", "Yeşil"]);
    a.kimden = pick(r, ["Sahibinden", "Sahibinden", "Galeriden"]);
    const base = /bilgisayar|laptop|masaüstü/i.test(L0) ? 58000 : /telefon/i.test(L0) ? 46000
      : /kamera|fotoğraf/i.test(L0) ? 68000 : /televizyon|tv/i.test(L0) ? 42000
      : /ekran kartı|bileşen/i.test(L0) ? 34000 : /konsol|oyun/i.test(L0) ? 28000
      : /tablet/i.test(L0) ? 24000 : /ses|kulaklık/i.test(L0) ? 11000 : 16000;
    const flag = /pro max|ultra|max\b|pro\b|rtx 40|m3|m4/i.test(L2) ? 1.55 : 1;
    price = Math.max(900, Math.round((base * flag * WEAR[durum] * (0.85 + r() * 0.3)) / 250) * 250);
    title = `${L1} ${L2} · ${L0}${durum === "Sıfır" ? " · Sıfır Kapalı Kutu" : ""}`;
  } else if (sub === "ev-yasam") {
    const durum = pick(r, COND);
    a.durum = durum;
    a.malzeme = pick(r, ["Masif ahşap", "MDF", "Deri", "Kumaş", "Paslanmaz çelik", "Cam", "Rattan"]);
    a.renk = pick(r, ["Antrasit", "Bej", "Beyaz", "Kahve", "Gri", "Lacivert"]);
    a.olcu = `${int(r, 60, 320)} × ${int(r, 50, 220)} cm`;
    a.montaj = chance(r, 0.4);
    a.kimden = pick(r, ["Sahibinden", "Sahibinden", "Galeriden"]);
    const base = /koltuk|kanepe|oturma/i.test(L0 + L1) ? 34000 : /yatak odası|yatak/i.test(L0 + L1) ? 42000
      : /yemek|masa/i.test(L0 + L1) ? 32000 : /beyaz eşya|buzdolabı|çamaşır|bulaşık|fırın/i.test(L0 + L1) ? 24000
      : /halı/i.test(L0 + L1) ? 12000 : /aydınlatma|avize|lamba/i.test(L0 + L1) ? 4500
      : /bahçe/i.test(L0 + L1) ? 16000 : 7000;
    price = Math.max(350, Math.round((base * WEAR[durum] * (0.85 + r() * 0.3)) / 100) * 100);
    title = joinLabel(L2, L1);
  } else if (sub === "hobi-spor") {
    const durum = pick(r, COND);
    a.durum = durum; a.marka = brandToken(L2) ?? brandToken(L1) ?? L1;
    a.beden = pick(r, ["S", "M", "L", "XL", "Tek beden", "26\"", "29\"", "170 cm"]);
    a.kutulu = chance(r, 0.3);
    a.kimden = pick(r, ["Sahibinden", "Sahibinden", "Galeriden"]);
    const base = /bisiklet/i.test(L0 + L1) ? 28000 : /müzik|gitar|piyano|davul/i.test(L0 + L1) ? 34000
      : /kamp|çadır|outdoor/i.test(L0 + L1) ? 6000 : /fitness|kondisyon|ağırlık/i.test(L0 + L1) ? 18000
      : /koleksiyon|antika/i.test(L0 + L1) ? 22000 : /kitap|dergi/i.test(L0 + L1) ? 3000
      : /su spor|dalış|kano|sörf/i.test(L0 + L1) ? 26000 : /kayak|snowboard/i.test(L0 + L1) ? 19000 : 9000;
    price = Math.max(250, Math.round((base * WEAR[durum] * (0.85 + r() * 0.3)) / 100) * 100);
    title = joinLabel(L1, L2);
  } else {
    const durum = pick(r, COND);
    a.durum = durum; a.marka = brandToken(L2) ?? brandToken(L1) ?? L1;
    a.beden = /ayakkabı|bot|sneaker/i.test(L0 + L1) ? String(int(r, 36, 46)) : pick(r, ["XS", "S", "M", "L", "XL", "38", "40", "42", "44", "Tek beden"]);
    a.renk = pick(r, ["Siyah", "Beyaz", "Bej", "Kahve", "Lacivert", "Bordo", "Gri"]);
    a.orijinal = chance(r, 0.6);
    a.kimden = pick(r, ["Sahibinden", "Sahibinden", "Galeriden"]);
    const base = /saat/i.test(L0 + L1) ? 26000 : /takı|mücevher|altın/i.test(L0 + L1) ? 34000
      : /çanta|valiz/i.test(L0 + L1) ? 9000 : /ayakkabı|bot/i.test(L0 + L1) ? 5500
      : /aksesuar|gözlük|kemer/i.test(L0 + L1) ? 4500 : 6500;
    price = Math.max(150, Math.round((base * WEAR[durum] * (0.85 + r() * 0.3)) / 50) * 50);
    title = joinLabel(L1, L2);
  }

  price = Math.min(Math.max(price, s.band[0] * 0.35), s.band[1] * 1.8);
  return { attrs: a, title: title.trim(), price: Math.round(price), path, pathLabels: labels };
}

/* ─────────────────────────────────────────────────────────── katalog */

export function buildCatalogue(count = 900) {
  const r = mulberry32(20260901);
  const sellers: Seller[] = [];
  const now = Date.UTC(2026, 8, 1, 9, 0, 0);

  for (let i = 0; i < 46; i++) {
    const corporate = i < 10;
    const city = pick(r, CITIES);
    sellers.push({
      id: `s${i + 1}`,
      name: corporate ? FIRMS[i] : `${pick(r, FIRST)} ${pick(r, LAST)[0]}.`,
      kind: corporate ? "kurumsal" : "bireysel",
      city,
      joinedAt: now - int(r, 40, 2600) * 86400000,
      verified: corporate || chance(r, 0.45),
      rating: Math.round((3.6 + r() * 1.4) * 10) / 10,
      reviews: int(r, 3, 480),
      responseMins: int(r, 4, 240),
      phone: `0${pick(r, ["532", "533", "541", "555", "505", "544"])} ${int(r, 100, 999)} ${int(r, 10, 99)} ${int(r, 10, 99)}`,
    });
  }

  const listings: Listing[] = [];
  // gerçek pazarlar dengesizdir: konut, otomobil ve elektronik envanterin çoğunu taşır
  const WEIGHT: Record<string, number> = {
    konut: 8, isyeri: 2, arsa: 3, devremulk: 1, "turistik-kiralik": 2,
    otomobil: 9, "arazi-suv-pickup": 4, motosiklet: 2, "minivan-panelvan": 2, ticari: 2, karavan: 1, "deniz-araci": 1,
    elektronik: 6, "ev-yasam": 3, "hobi-spor": 3, moda: 3,
  };
  const flat = CATEGORIES.flatMap((c) =>
    c.subs.flatMap((s) =>
      Array.from({ length: WEIGHT[s.slug] ?? 1 }, () => ({ cat: c.slug, sub: s.slug })),
    ),
  );

  for (let i = 0; i < count; i++) {
    const f = flat[i % flat.length];
    const city = pick(r, CITIES);
    const district = pick(r, GEO[city]);
    const { attrs, title, price: base, path, pathLabels } = makeAttrs(r, f.cat, f.sub, city);
    let deal = "Satılık";
    if (f.sub === "turistik-kiralik") deal = /aylık/i.test(pathLabels[0] ?? "") ? "Kiralık" : "Günlük kiralık";
    else if (f.sub === "devremulk") deal = "Satılık";
    else if (f.cat === "emlak") deal = chance(r, 0.34) ? "Kiralık" : chance(r, 0.05) ? "Devren" : "Satılık";
    else if (f.cat === "vasita") deal = f.sub !== "motosiklet" && chance(r, 0.06) ? "Kiralık" : "Satılık";
    else if (base < 4000 && chance(r, 0.05)) deal = "Ücretsiz";
    else if (chance(r, 0.07)) deal = "Takas";

    let price = base;
    if (deal === "Kiralık" && f.sub !== "turistik-kiralik") {
      price = Math.round((base * (f.cat === "emlak" ? 0.0042 : 0.035) * (0.9 + r() * 0.22)) / 250) * 250;
    }
    if (deal === "Ücretsiz") price = 0;
    const seller = sellers[int(r, 0, sellers.length - 1)];
    const createdAt = now - int(r, 0, 90) * 86400000 - int(r, 0, 86400000);
    const l: Listing = {
      id: `L${(100000 + i).toString(36).toUpperCase()}`,
      title,
      desc: "",
      cat: f.cat, sub: f.sub, deal, price,
      city, district, attrs,
      createdAt,
      bumpedAt: createdAt + int(r, 0, 6) * 86400000,
      sellerId: seller.id,
      views: int(r, 12, 9800),
      photos: int(r, 3, 9),
      status: "active",
      featured: chance(r, 0.08),
      path, pathLabels,
      art: int(r, 1, 999999),
    };
    l.desc = desc(r, l);
    listings.push(l);
  }

  listings.sort((a, b) => b.bumpedAt - a.bumpedAt);
  return { listings, sellers };
}

export const CATALOGUE = buildCatalogue();
export const SEED_LISTINGS = CATALOGUE.listings;
export const SEED_SELLERS = CATALOGUE.sellers;
export const SELLER_MAP = Object.fromEntries(SEED_SELLERS.map((s) => [s.id, s]));
