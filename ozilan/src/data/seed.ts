import { CATEGORIES, findSub } from "./taxonomy";
import { GEO, CITIES, CITY_INDEX } from "./geo";
import { mulberry32, pick, int, chance } from "@/lib/prng";
import type { Listing, Seller, AttrValue } from "@/lib/types";

const FIRST = ["Ahmet", "Mehmet", "Elif", "Zeynep", "Burak", "Cem", "Deniz", "Selin", "Emre", "Merve", "Kaan", "Ayşe", "Onur", "Gizem", "Hakan", "Sibel", "Tolga", "Ceren", "Serkan", "Pelin"];
const LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç"];
const FIRMS = ["Meydan Gayrimenkul", "Nova Otomotiv", "Kule Emlak", "Anadolu Motors", "Piksel Teknoloji", "Marmara Yapı", "Ege Oto Galeri", "Zirve Emlak", "Atlas Ticaret", "Levent Gayrimenkul"];

const OTO_MODELS: Record<string, string[]> = {
  Volkswagen: ["Golf 1.6 TDI", "Passat 1.5 TSI", "Polo 1.0 TSI", "Tiguan 1.5 TSI", "Jetta 1.4"],
  Renault: ["Clio 1.0 TCe", "Megane 1.5 dCi", "Symbol 1.0", "Captur 1.3", "Talisman 1.6"],
  Fiat: ["Egea 1.4 Fire", "Egea Cross 1.5", "Doblo Combi", "500 1.2", "Linea 1.3"],
  Ford: ["Focus 1.5 TDCi", "Fiesta 1.0", "Kuga 1.5", "Mondeo 2.0", "Puma 1.0"],
  Toyota: ["Corolla 1.8 Hybrid", "C-HR 1.8", "Yaris 1.5", "RAV4 2.5", "Auris 1.4"],
  Hyundai: ["i20 1.4", "Tucson 1.6", "Elantra 1.6", "Accent Blue", "Bayon 1.4"],
  Opel: ["Astra 1.6 CDTI", "Corsa 1.2", "Insignia 1.6", "Grandland 1.5"],
  Peugeot: ["308 1.5 BlueHDi", "3008 1.5", "208 1.2", "301 1.6"],
  BMW: ["320i", "520d", "116d", "X1 sDrive", "418i Gran Coupe"],
  "Mercedes-Benz": ["C 200 d", "E 220 d", "A 180 d", "GLA 200", "CLA 200"],
  Audi: ["A3 Sedan 1.6", "A4 2.0 TDI", "A6 2.0", "Q3 1.5"],
  Honda: ["Civic 1.6", "CR-V 1.5", "Jazz 1.3", "City 1.5"],
  "Citroën": ["C3 1.2", "C4 1.5", "C-Elysee 1.6", "C5 Aircross"],
  Dacia: ["Duster 1.5", "Sandero 1.0", "Logan 1.0", "Jogger 1.0"],
  Skoda: ["Octavia 1.6", "Superb 1.5", "Fabia 1.0", "Kamiq 1.0"],
  Seat: ["Leon 1.6", "Ibiza 1.0", "Arona 1.0", "Ateca 1.5"],
  Nissan: ["Qashqai 1.3", "Juke 1.0", "Micra 1.0", "X-Trail 1.6"],
  Kia: ["Sportage 1.6", "Ceed 1.4", "Rio 1.4", "Stonic 1.4"],
  Volvo: ["XC40 T4", "S60 T4", "V40 D2", "XC60 B4"],
  Tesla: ["Model 3 Long Range", "Model Y RWD", "Model 3 SR+"],
};

const MOTO_MODELS: Record<string, string[]> = {
  Honda: ["PCX 125", "CB 500F", "Forza 250", "CBR 650R"],
  Yamaha: ["NMAX 125", "MT-07", "XMAX 250", "R25"],
  Bajaj: ["Pulsar NS200", "Dominar 400", "Pulsar 125"],
  Kawasaki: ["Z650", "Ninja 400", "Versys 650"],
  Suzuki: ["Burgman 400", "GSX-S750", "V-Strom 650"],
  KTM: ["Duke 390", "RC 390", "Adventure 250"],
  BMW: ["G 310 R", "F 750 GS", "R 1250 GS"],
  Ducati: ["Monster 797", "Scrambler Icon"],
  Mondial: ["Drift 125", "Turismo 250"],
  Kuba: ["CR5 125", "Zenit 200"],
};

const ELEK: Record<string, string[]> = {
  Telefon: ["iPhone 14 Pro 256GB", "iPhone 13 128GB", "Samsung Galaxy S23", "Xiaomi 13T", "Google Pixel 8", "Samsung A54"],
  "Dizüstü bilgisayar": ["MacBook Air M2", "MacBook Pro 14 M3", "Lenovo Legion 5", "Asus TUF F15", "HP Victus 16", "Dell XPS 13"],
  "Masaüstü": ["Ryzen 5 / RTX 3060 sistem", "i5 12400F / RTX 4060", "iMac 24 M1"],
  Tablet: ["iPad 10. nesil", "iPad Air M1", "Galaxy Tab S8", "Xiaomi Pad 6"],
  Televizyon: ["LG 55 OLED C2", "Samsung 65 QLED", "Philips 50 Ambilight"],
  "Kulaklık": ["AirPods Pro 2", "Sony WH-1000XM4", "Bose QC45"],
  "Fotoğraf makinesi": ["Canon R6", "Sony A7 III", "Fujifilm X-T30", "Nikon Z50"],
  "Oyun konsolu": ["PlayStation 5 Slim", "Xbox Series X", "Nintendo Switch OLED"],
  "Ekran kartı": ["RTX 4070 Super", "RTX 3080 10GB", "RX 6700 XT"],
};

const EV: Record<string, string[]> = {
  "Koltuk takımı": ["3+3+1 modern koltuk takımı", "L köşe koltuk, yataklı", "Chester üçlü kanepe"],
  "Yatak odası": ["Bazalı yatak odası takımı", "Modern gardıroplu set", "Tek kişilik genç odası"],
  "Yemek odası": ["Açılır masa + 6 sandalye", "Vitrinli yemek odası takımı"],
  "Beyaz eşya": ["Bosch A+++ çamaşır makinesi", "Arçelik no-frost buzdolabı", "Siemens bulaşık makinesi", "Ankastre fırın seti"],
  "Halı": ["Uşak el dokuma halı 200x300", "Modern shaggy halı"],
  "Aydınlatma": ["Pirinç sarkıt avize", "Endüstriyel zemin lambası"],
  "Bahçe": ["Rattan bahçe takımı", "Ahşap piknik masası"],
  "Mutfak": ["Paslanmaz tencere seti", "Kahve makinesi + değirmen"],
};

const HOBI: Record<string, string[]> = {
  Bisiklet: ["Trek Marlin 7 dağ bisikleti", "Bianchi yol bisikleti", "Salcano 29 jant", "Katlanır elektrikli bisiklet"],
  "Müzik aleti": ["Fender Stratocaster", "Yamaha P-125 dijital piyano", "Cort akustik gitar", "Roland elektro davul"],
  Kamp: ["4 kişilik tünel çadır", "-10 uyku tulumu", "Kamp ocağı seti"],
  Fitness: ["Ayarlanabilir dambıl seti 40kg", "Kürek çekme aleti", "Katlanır koşu bandı"],
  Koleksiyon: ["1970 baskı plak seti", "Osmanlı dönemi madeni para", "Vintage fotoğraf makinesi"],
  Kitap: ["Sahaf koleksiyonu 40 kitap", "Sanat tarihi seti"],
  "Su sporları": ["Şişme kano 2 kişilik", "Dalış regülatör seti"],
  "Kayak": ["Atomic kayak takımı 170cm", "Snowboard + bağlama"],
};

const MODA: Record<string, string[]> = {
  Giyim: ["Kuzu derisi ceket", "Yün palto", "Vintage denim ceket"],
  "Ayakkabı": ["Nike Air Force 1", "Timberland bot", "Klasik deri ayakkabı"],
  "Çanta": ["Deri postacı çantası", "Seyahat valizi 65L"],
  Saat: ["Seiko 5 otomatik", "Casio G-Shock", "Tissot PRX"],
  "Takı": ["22 ayar bilezik", "Gümüş kolye seti"],
  Aksesuar: ["Ray-Ban güneş gözlüğü", "Deri kemer seti"],
};

const ISYERI = ["Cadde üzeri dükkan", "Plaza katı ofis", "Lojistik depo", "Üretim atölyesi", "Köşe başı dükkan"];
const ARSA = ["Ana yola cepheli arsa", "Denize yürüme mesafesi arsa", "İmarlı köşe parsel", "Verimli tarla", "Villa imarlı parsel"];

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
  if (l.cat === "emlak") {
    body.push(`${l.district} bölgesinde, ulaşımı kolay bir konumda yer almaktadır. Toplu taşıma, market ve okullara yürüme mesafesindedir.`);
    if (l.attrs.site) body.push("Güvenlikli site içerisinde, 7/24 kameralı sistem ve otopark mevcuttur.");
    if (l.attrs.esya) body.push("Eşyalı olarak devredilecektir; beyaz eşya ve mobilyalar fiyata dahildir.");
  } else if (l.cat === "vasita") {
    body.push(`Aracımız ${l.attrs.yil} model olup ${Number(l.attrs.km).toLocaleString("tr-TR")} km'dedir. Periyodik bakımları yetkili serviste yapılmıştır.`);
    body.push(l.attrs.hasar ? "Ağır hasar kaydı bulunmaktadır, fiyata yansıtılmıştır." : "Ağır hasar kaydı yoktur, boyalı parçalar ekspertiz raporunda belirtilmiştir.");
  } else {
    body.push("Ürün fotoğraflardaki gibidir, ek görsel talep edebilirsiniz. Kargo alıcıya aittir, elden teslim tercih edilir.");
  }
  body.push(pick(r, closers));
  return body.join("\n\n");
}

function makeAttrs(r: () => number, cat: string, sub: string, city: string): { attrs: Record<string, AttrValue>; title: string; price: number } {
  const s = findSub(cat, sub)!;
  const idx = CITY_INDEX[city] ?? 1;
  const a: Record<string, AttrValue> = {};
  let title = "";
  let price = 0;

  if (sub === "konut") {
    const oda = pick(r, ["1+1", "2+1", "2+1", "3+1", "3+1", "4+1", "5+1"]);
    const rooms = parseInt(oda) + 1;
    const m2 = int(r, 45 + rooms * 12, 60 + rooms * 32);
    const yas = int(r, 0, 38);
    a.oda = oda; a.m2 = m2; a.binaYasi = yas;
    a.kat = pick(r, ["Zemin", "1", "2", "3", "4", "5", "6-10", "Çatı katı", "Bahçe katı"]);
    a.isitma = pick(r, ["Doğalgaz kombi", "Doğalgaz kombi", "Merkezi", "Yerden ısıtma", "Klima"]);
    a.esya = chance(r, 0.22); a.site = chance(r, 0.45); a.otopark = chance(r, 0.55);
    a.asansor = chance(r, 0.6); a.krediye = chance(r, 0.8);
    const perM2 = (30000 + r() * 12000) * idx * (1 - Math.min(yas, 40) * 0.008) * (a.site ? 1.1 : 1);
    price = Math.round((m2 * perM2) / 5000) * 5000;
    title = `${oda} ${a.site ? "Site İçerisinde " : ""}${m2} m² ${yas < 2 ? "Sıfır" : yas < 6 ? "Yeni Bina" : "Bakımlı"} Daire`;
  } else if (sub === "isyeri") {
    const m2 = int(r, 40, 900);
    a.m2 = m2; a.tip = pick(r, ["Dükkan", "Ofis", "Depo", "Fabrika", "Plaza katı", "Atölye"]);
    a.bolum = int(r, 1, 6); a.kirada = chance(r, 0.3);
    price = Math.round((m2 * (24000 + r() * 14000) * idx) / 10000) * 10000;
    title = `${pick(r, ISYERI)} · ${m2} m²`;
  } else if (sub === "arsa") {
    const m2 = int(r, 300, 9000);
    a.m2 = m2; a.imar = pick(r, ["Konut imarlı", "Ticari imarlı", "Tarla", "Bağ / bahçe", "Villa imarlı"]);
    a.kaks = pick(r, ["0.30", "0.50", "1.00", "1.50", "2.00", "-"]);
    a.tapu = pick(r, ["Müstakil parsel", "Hisseli", "Kat irtifakı"]);
    const perM2 = (a.imar === "Tarla" ? 900 : a.imar === "Bağ / bahçe" ? 1600 : 6500) * (0.85 + r() * 0.3) * idx;
    price = Math.round((m2 * perM2) / 25000) * 25000;
    title = `${pick(r, ARSA)} · ${m2.toLocaleString("tr-TR")} m²`;
  } else if (sub === "otomobil") {
    const marka = pick(r, Object.keys(OTO_MODELS));
    const model = pick(r, OTO_MODELS[marka]);
    const yil = int(r, 2008, 2026);
    const age = 2026 - yil;
    const km = Math.round(int(r, 2, 32) * 1000 * Math.max(age, 0.4));
    // yakıt, model adındaki motor koduyla tutarlı olsun (TDI dizel, TSI benzin...)
    let yakit = pick(r, ["Benzin", "Benzin", "Dizel", "LPG & Benzin", "Hibrit"]);
    const mn = model.toLowerCase();
    if (/tdi|dci|cdti|bluehdi|tdci|\bd\b|xdrive.*d|220 d|200 d|180 d/.test(mn)) yakit = "Dizel";
    else if (/tsi|tce|tfsi|vti|puretech/.test(mn)) yakit = pick(r, ["Benzin", "Benzin", "LPG & Benzin"]);
    else if (/hybrid|hibrit/.test(mn)) yakit = "Hibrit";
    if (marka === "Tesla") yakit = "Elektrik";
    const vites = marka === "Tesla" || yakit === "Elektrik" ? "Otomatik" : pick(r, ["Otomatik", "Otomatik", "Manuel", "Yarı otomatik"]);
    a.marka = marka; a.model = model; a.yil = yil; a.km = km; a.yakit = yakit; a.vites = vites;
    a.kasa = pick(r, ["Sedan", "Hatchback", "SUV", "Station wagon", "Coupe", "MPV"]);
    a.motorHacmi = pick(r, [1000, 1200, 1300, 1400, 1500, 1600, 1800, 2000]);
    a.guc = int(r, 75, 320); a.renk = pick(r, ["Beyaz", "Siyah", "Gri", "Gümüş", "Mavi", "Kırmızı", "Lacivert", "Bej"]);
    a.hasar = chance(r, 0.12); a.takas = chance(r, 0.45);
    const premium = ["BMW", "Mercedes-Benz", "Audi", "Volvo", "Tesla"].includes(marka) ? 2.2 : 1;
    let p = 1_950_000 * premium * Math.pow(0.87, age) * (1 - Math.min(km / 400000, 0.55)) * (vites === "Otomatik" ? 1.12 : 1);
    if (yakit === "Elektrik") p *= 1.5; if (yakit === "Hibrit") p *= 1.25;
    if (a.hasar) p *= 0.72;
    price = Math.max(185_000, Math.round((p * (0.9 + r() * 0.2)) / 5000) * 5000);
    title = `${marka} ${model} · ${yil} · ${vites}`;
  } else if (sub === "motosiklet") {
    const marka = pick(r, Object.keys(MOTO_MODELS));
    const model = pick(r, MOTO_MODELS[marka]);
    const yil = int(r, 2012, 2026);
    const km = int(r, 500, 62000);
    a.marka = marka; a.model = model; a.yil = yil; a.km = km;
    a.silindir = pick(r, [125, 200, 250, 400, 500, 650, 750, 1000]);
    a.durum = pick(r, ["Sıfır", "Az kullanılmış", "İyi", "İyi", "Yıpranmış"]);
    const premium = ["BMW", "Ducati", "KTM", "Kawasaki"].includes(marka) ? 2.4 : 1;
    price = Math.max(52_000, Math.round((205_000 * premium * Math.pow(0.9, 2026 - yil) * (1 - km / 160000) * (0.9 + r() * 0.22)) / 1000) * 1000);
    title = `${marka} ${model} · ${yil} · ${a.silindir} cc`;
  } else if (sub === "ticari") {
    const marka = pick(r, ["Ford", "Mercedes-Benz", "Volkswagen", "Iveco", "Renault", "Fiat", "Isuzu", "Man", "Scania"]);
    const tip = pick(r, ["Panelvan", "Minibüs", "Kamyonet", "Kamyon", "Çekici", "Otobüs"]);
    const yil = int(r, 2010, 2026);
    const km = int(r, 20000, 720000);
    a.marka = marka; a.tip = tip; a.yil = yil; a.km = km;
    const heavy = ["Kamyon", "Çekici", "Otobüs"].includes(tip) ? 2.6 : 1;
    price = Math.max(280_000, Math.round((1_550_000 * heavy * Math.pow(0.88, 2026 - yil) * (1 - km / 1400000) * (0.9 + r() * 0.22)) / 10000) * 10000);
    title = `${marka} ${tip} · ${yil}`;
  } else if (sub === "elektronik") {
    const tur = pick(r, Object.keys(ELEK));
    const model = pick(r, ELEK[tur]);
    a.tur = tur; a.marka = model.split(" ")[0];
    a.durum = pick(r, ["Sıfır", "Az kullanılmış", "Az kullanılmış", "İyi", "Yıpranmış"]);
    a.garanti = chance(r, 0.4); a.kutulu = chance(r, 0.55); a.fatura = chance(r, 0.6);
    const base: Record<string, number> = { Telefon: 46000, "Dizüstü bilgisayar": 58000, "Masaüstü": 52000, Tablet: 24000, "Televizyon": 42000, "Kulaklık": 11000, "Fotoğraf makinesi": 72000, "Oyun konsolu": 30000, "Ekran kartı": 34000 };
    const wear = a.durum === "Sıfır" ? 1 : a.durum === "Az kullanılmış" ? 0.82 : a.durum === "İyi" ? 0.66 : 0.44;
    price = Math.max(900, Math.round((base[tur] * wear * (0.88 + r() * 0.26)) / 250) * 250);
    title = `${model}${a.durum === "Sıfır" ? " · Sıfır Kapalı Kutu" : ""}`;
  } else if (sub === "ev-yasam") {
    const tur = pick(r, Object.keys(EV));
    a.tur = tur; a.durum = pick(r, ["Sıfır", "Az kullanılmış", "İyi", "Yıpranmış"]);
    a.malzeme = pick(r, ["Masif ahşap", "MDF", "Deri", "Kumaş", "Paslanmaz çelik", "Cam"]);
    const base: Record<string, number> = { "Koltuk takımı": 34000, "Yatak odası": 42000, "Yemek odası": 38000, "Beyaz eşya": 22000, "Halı": 12000, "Aydınlatma": 4500, "Bahçe": 16000, "Mutfak": 7000 };
    const wear = a.durum === "Sıfır" ? 1 : a.durum === "Az kullanılmış" ? 0.7 : a.durum === "İyi" ? 0.5 : 0.3;
    price = Math.max(350, Math.round((base[tur] * wear * (0.88 + r() * 0.26)) / 100) * 100);
    title = pick(r, EV[tur]);
  } else if (sub === "hobi-spor") {
    const tur = pick(r, Object.keys(HOBI));
    const model = pick(r, HOBI[tur]);
    a.tur = tur; a.marka = model.split(" ")[0];
    a.durum = pick(r, ["Sıfır", "Az kullanılmış", "İyi", "Yıpranmış"]);
    const base: Record<string, number> = { Bisiklet: 28000, "Müzik aleti": 34000, Kamp: 6000, Fitness: 18000, Koleksiyon: 22000, Kitap: 3000, "Su sporları": 26000, "Kayak": 19000 };
    const wear = a.durum === "Sıfır" ? 1 : a.durum === "Az kullanılmış" ? 0.75 : a.durum === "İyi" ? 0.55 : 0.34;
    price = Math.max(250, Math.round((base[tur] * wear * (0.88 + r() * 0.26)) / 100) * 100);
    title = model;
  } else {
    const tur = pick(r, Object.keys(MODA));
    const model = pick(r, MODA[tur]);
    a.tur = tur; a.marka = model.split(" ")[0];
    a.beden = pick(r, ["XS", "S", "M", "L", "XL", "38", "40", "42", "44", "Tek beden"]);
    a.durum = pick(r, ["Sıfır", "Az kullanılmış", "İyi", "Yıpranmış"]);
    const base: Record<string, number> = { Giyim: 6500, "Ayakkabı": 5500, "Çanta": 9000, Saat: 26000, "Takı": 34000, Aksesuar: 4500 };
    const wear = a.durum === "Sıfır" ? 1 : a.durum === "Az kullanılmış" ? 0.72 : a.durum === "İyi" ? 0.52 : 0.32;
    price = Math.max(150, Math.round((base[tur] * wear * (0.88 + r() * 0.26)) / 50) * 50);
    title = model;
  }

  price = Math.min(Math.max(price, s.band[0] * 0.35), s.band[1] * 1.8);
  return { attrs: a, title, price: Math.round(price) };
}

export function buildCatalogue(count = 620) {
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
  // real marketplaces are lopsided: housing, cars and electronics carry most of the inventory
  const WEIGHT: Record<string, number> = {
    konut: 5, isyeri: 1, arsa: 2,
    otomobil: 5, motosiklet: 1, ticari: 1,
    elektronik: 4, "ev-yasam": 2, "hobi-spor": 2, moda: 2,
  };
  const flat = CATEGORIES.flatMap((c) =>
    c.subs.flatMap((s) =>
      Array.from({ length: WEIGHT[s.slug] ?? 1 }, () => ({ cat: c.slug, sub: s.slug, deals: c.dealTypes ?? ["Satılık"] })),
    ),
  );

  for (let i = 0; i < count; i++) {
    const f = flat[i % flat.length];
    const city = pick(r, CITIES);
    const district = pick(r, GEO[city]);
    const { attrs, title, price: base } = makeAttrs(r, f.cat, f.sub, city);
    let deal = "Satılık";
    if (f.cat === "emlak") deal = chance(r, 0.34) ? "Kiralık" : chance(r, 0.05) ? "Devren" : "Satılık";
    else if (f.cat === "vasita") deal = f.sub !== "motosiklet" && chance(r, 0.06) ? "Kiralık" : "Satılık";
    else if (base < 4000 && chance(r, 0.05)) deal = "Ücretsiz";
    else if (chance(r, 0.07)) deal = "Takas";

    let price = base;
    if (deal === "Kiralık") price = Math.round((base * (f.cat === "emlak" ? 0.0042 : 0.022) * (0.9 + r() * 0.22)) / 250) * 250;
    if (deal === "Ücretsiz") price = 0;
    const seller = sellers[int(r, 0, sellers.length - 1)];
    const createdAt = now - int(r, 0, 90) * 86400000 - int(r, 0, 86400000);
    const l: Listing = {
      id: `L${(100000 + i).toString(36).toUpperCase()}`,
      title: `${deal === "Kiralık" ? "" : ""}${title}`,
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
