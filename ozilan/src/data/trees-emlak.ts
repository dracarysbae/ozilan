/* Emlak ağaçları — tür → alt tür → özellik kırılımı */

export const KONUT = `
Daire
  1+0 (Stüdyo): Sıfır, 0-5 yaş, 5-10 yaş, 10-20 yaş, 20+ yaş
  1+1: Sıfır, 0-5 yaş, 5-10 yaş, 10-20 yaş, 20+ yaş
  2+1: Sıfır, 0-5 yaş, 5-10 yaş, 10-20 yaş, 20+ yaş
  3+1: Sıfır, 0-5 yaş, 5-10 yaş, 10-20 yaş, 20+ yaş
  4+1: Sıfır, 0-5 yaş, 5-10 yaş, 10-20 yaş, 20+ yaş
  5+1: Sıfır, 0-5 yaş, 5-10 yaş, 10-20 yaş, 20+ yaş
  6+1 ve üzeri: Sıfır, 0-10 yaş, 10+ yaş
Rezidans
  1+1: Eşyalı, Eşyasız
  2+1: Eşyalı, Eşyasız
  3+1: Eşyalı, Eşyasız
  4+1 ve üzeri: Eşyalı, Eşyasız
Villa
  Müstakil Villa: 3+1, 4+1, 5+1, 6+1 ve üzeri
  İkiz Villa: 3+1, 4+1, 5+1
  Sıra Villa: 3+1, 4+1, 5+1
  Triplex: 4+1, 5+1, 6+1
  Dubleks: 3+1, 4+1, 5+1
Müstakil Ev
  Bahçeli Ev: 2+1, 3+1, 4+1
  Köy Evi: 2+1, 3+1, 4+1
  Taş Ev: 2+1, 3+1
Yazlık
  Yazlık Daire: 1+1, 2+1, 3+1
  Yazlık Villa: 3+1, 4+1, 5+1
  Devremülk: 1+1, 2+1
Çiftlik Evi
  Bağ Evi: 1+1, 2+1, 3+1
  Hobi Bahçesi Evi: 1+0, 1+1, 2+1
Prefabrik
  Prefabrik Ev: 1+1, 2+1, 3+1
  Konteyner Ev: 1+0, 1+1
`;

export const ISYERI = `
Dükkan & Mağaza
  Cadde Üstü Dükkan: 0-50 m², 50-100 m², 100-200 m², 200 m² üzeri
  AVM Mağazası: 0-50 m², 50-100 m², 100 m² üzeri
  Çarşı İçi Dükkan: 0-50 m², 50-100 m², 100 m² üzeri
  Köşe Dükkan: 0-100 m², 100 m² üzeri
Ofis & Büro
  Plaza Katı: 0-100 m², 100-250 m², 250-500 m², 500 m² üzeri
  Müstakil Ofis: 0-100 m², 100-250 m², 250 m² üzeri
  Home Ofis: 1+1, 2+1, 3+1
  Hazır Ofis: Tek kişilik, 2-5 kişilik, 5+ kişilik
Depo & Antrepo
  Kapalı Depo: 0-250 m², 250-1000 m², 1000-5000 m², 5000 m² üzeri
  Soğuk Hava Deposu: 0-500 m², 500-2000 m², 2000 m² üzeri
  Antrepo: 0-1000 m², 1000 m² üzeri
Fabrika & Üretim
  Üretim Tesisi: 0-1000 m², 1000-5000 m², 5000-20000 m², 20000 m² üzeri
  Atölye: 0-250 m², 250-1000 m², 1000 m² üzeri
  Organize Sanayi Parseli: 0-5000 m², 5000 m² üzeri
Turizm İşletmesi
  Otel: 0-30 oda, 30-100 oda, 100 oda üzeri
  Apart Otel: 0-20 daire, 20 daire üzeri
  Pansiyon: 0-15 oda, 15 oda üzeri
  Restoran & Kafe: 0-100 m², 100-300 m², 300 m² üzeri
Sağlık & Eğitim
  Klinik: 0-100 m², 100-300 m², 300 m² üzeri
  Eczane: 0-50 m², 50 m² üzeri
  Kurs & Dershane: 0-250 m², 250-1000 m², 1000 m² üzeri
  Kreş: 0-250 m², 250 m² üzeri
Diğer
  Benzin İstasyonu: Akaryakıt, Akaryakıt + LPG
  Oto Yıkama: Kapalı, Açık
  Kuaför & Güzellik: 0-50 m², 50 m² üzeri
  Spor Salonu: 0-250 m², 250-1000 m², 1000 m² üzeri
`;

export const ARSA = `
Konut İmarlı
  Ayrık Nizam: 0-500 m², 500-1000 m², 1000-5000 m², 5000 m² üzeri
  Bitişik Nizam: 0-500 m², 500-1000 m², 1000 m² üzeri
  Blok Nizam: 0-1000 m², 1000-5000 m², 5000 m² üzeri
  Villa İmarlı: 0-1000 m², 1000-5000 m², 5000 m² üzeri
Ticari İmarlı
  Ticari Alan: 0-1000 m², 1000-5000 m², 5000 m² üzeri
  Ticari + Konut: 0-1000 m², 1000 m² üzeri
  Turizm İmarlı: 0-5000 m², 5000 m² üzeri
Sanayi İmarlı
  Sanayi Parseli: 0-2000 m², 2000-10000 m², 10000 m² üzeri
  Depolama Alanı: 0-5000 m², 5000 m² üzeri
Tarla
  Sulu Tarla: 0-5 dönüm, 5-20 dönüm, 20-100 dönüm, 100 dönüm üzeri
  Kuru Tarla: 0-5 dönüm, 5-20 dönüm, 20-100 dönüm, 100 dönüm üzeri
Bağ & Bahçe
  Zeytinlik: 0-5 dönüm, 5-20 dönüm, 20 dönüm üzeri
  Bağ: 0-5 dönüm, 5-20 dönüm, 20 dönüm üzeri
  Meyve Bahçesi: 0-5 dönüm, 5-20 dönüm, 20 dönüm üzeri
  Fındıklık: 0-10 dönüm, 10 dönüm üzeri
  Hobi Bahçesi: 0-1 dönüm, 1-5 dönüm
Diğer
  Zeytin Ağaçlı Tarla: 0-10 dönüm, 10 dönüm üzeri
  Orman Vasıflı: 0-10 dönüm, 10 dönüm üzeri
  Mera: 0-50 dönüm, 50 dönüm üzeri
`;

export const DEVREMULK = `
Devremülk
  Deniz Kenarı: 1 hafta, 2 hafta, 3 hafta ve üzeri
  Termal: 1 hafta, 2 hafta, 3 hafta ve üzeri
  Dağ & Kayak: 1 hafta, 2 hafta
Devre Tatil
  Yurt İçi: 1 hafta, 2 hafta
  Yurt Dışı: 1 hafta, 2 hafta
`;

export const TURISTIK = `
Günlük Kiralık
  Daire: 1+1, 2+1, 3+1
  Villa: 3+1, 4+1, 5+1 ve üzeri
  Bungalov: 1 odalı, 2 odalı
  Tiny House: 1 odalı, 2 odalı
Aylık Kiralık
  Daire: 1+1, 2+1, 3+1
  Rezidans: 1+1, 2+1
  Villa: 3+1, 4+1
`;
