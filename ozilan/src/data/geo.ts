export const GEO: Record<string, string[]> = {
  "İstanbul": ["Kadıköy", "Beşiktaş", "Şişli", "Üsküdar", "Bakırköy", "Ataşehir", "Maltepe", "Beylikdüzü", "Sarıyer", "Kartal", "Pendik", "Başakşehir", "Esenyurt", "Fatih", "Zeytinburnu"],
  "Ankara": ["Çankaya", "Keçiören", "Yenimahalle", "Etimesgut", "Mamak", "Sincan", "Gölbaşı", "Pursaklar"],
  "İzmir": ["Konak", "Karşıyaka", "Bornova", "Buca", "Bayraklı", "Çeşme", "Urla", "Gaziemir", "Karabağlar"],
  "Bursa": ["Nilüfer", "Osmangazi", "Yıldırım", "Gemlik", "Mudanya", "İnegöl"],
  "Antalya": ["Muratpaşa", "Konyaaltı", "Kepez", "Alanya", "Manavgat", "Serik", "Kaş"],
  "Adana": ["Seyhan", "Çukurova", "Yüreğir", "Sarıçam"],
  "Konya": ["Selçuklu", "Meram", "Karatay"],
  "Gaziantep": ["Şahinbey", "Şehitkamil", "Oğuzeli"],
  "Kocaeli": ["İzmit", "Gebze", "Darıca", "Körfez", "Başiskele"],
  "Muğla": ["Bodrum", "Fethiye", "Marmaris", "Milas", "Menteşe", "Datça"],
  "Eskişehir": ["Odunpazarı", "Tepebaşı"],
  "Samsun": ["Atakum", "İlkadım", "Canik"],
  "Trabzon": ["Ortahisar", "Akçaabat", "Yomra"],
  "Kayseri": ["Melikgazi", "Kocasinan", "Talas"],
  "Mersin": ["Yenişehir", "Mezitli", "Toroslar", "Erdemli"],
  "Denizli": ["Merkezefendi", "Pamukkale"],
  "Balıkesir": ["Altıeylül", "Karesi", "Ayvalık", "Edremit"],
  "Sakarya": ["Adapazarı", "Serdivan", "Erenler"],
  "Aydın": ["Efeler", "Kuşadası", "Didim", "Nazilli"],
  "Tekirdağ": ["Süleymanpaşa", "Çorlu", "Çerkezköy"],
};

export const CITIES = Object.keys(GEO);

/** rough price multiplier per city — feeds the market model */
export const CITY_INDEX: Record<string, number> = {
  "İstanbul": 1.62, "Muğla": 1.44, "Ankara": 1.12, "İzmir": 1.28, "Antalya": 1.30,
  "Bursa": 1.05, "Kocaeli": 1.04, "Tekirdağ": 0.95, "Eskişehir": 0.92, "Aydın": 0.98,
  "Denizli": 0.86, "Balıkesir": 0.9, "Sakarya": 0.9, "Mersin": 0.93, "Adana": 0.88,
  "Konya": 0.84, "Gaziantep": 0.82, "Kayseri": 0.83, "Samsun": 0.85, "Trabzon": 0.94,
};
