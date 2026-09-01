# OzIlan

Çok kategorili ilan platformu — emlak, vasıta ve ikinci el. Klasik ilan sitelerinden farkı:
**fiyatı göstermekle kalmaz, fiyatın ne anlama geldiğini gösterir.**

> Demo amaçlı bir projedir. Katalogdaki ilanlar kurgusaldır; kullanıcı verisi yalnızca
> tarayıcının yerel deposunda tutulur, hiçbir sunucuya gönderilmez.

## Öne çıkan özellikler

| | |
|---|---|
| **Cümleyle arama** | "İzmir Karşıyaka 3+1 daire 5 milyon altı" → şehir, ilçe, oda sayısı, bütçe, model yılı, kilometre, yakıt ve vites otomatik ayrıştırılır; ne anlaşıldığı kullanıcıya geri gösterilir. |
| **Piyasa konumu** | Her ilan için kendi karşılaştırma kümesi kurulur (aynı marka, ±3 model yılı, benzer km, aynı oda tipi…) ve fiyat o kümenin ortancasına göre konumlandırılır. Emlakta m² ve şehir endeksiyle normalize edilir. |
| **Güven taraması** | Satıcı geçmişi, ilan bütünlüğü, görsel sayısı, baskı dili, platform dışı iletişim / IBAN kalıpları, fiyat anomalisi ve kopya ilan taraması tek bir 0–100 skoruna indirgenir. |
| **Fiyat önerisi** | İlan verirken girilen özelliklere göre alt çeyrek / ortanca / üst çeyrek fiyat önerilir; girilen fiyatın ortancaya uzaklığı anlık gösterilir. |
| **Canlı güven önizlemesi** | İlan formu doldurulurken skor gerçek zamanlı hesaplanır, eksikler yazarken bildirilir. |
| **Moderasyon paneli** | Risk kuyruğu (skoru düşük ilanlar), şikâyet yönetimi ve toplu ilan tablosu. |

Bunların yanında: dinamik kategori filtreleri, favoriler, kayıtlı aramalar, ilan içi
mesajlaşma, kullanıcı portföyü ve tam responsive arayüz.

## Teknoloji

- **Next.js 16** (App Router) — `output: "export"` ile tamamen statik çıktı
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS 3** — özel tasarım sistemi (`tailwind.config.ts`)
- Sunucu, veritabanı ve dış API bağımlılığı **yok**

### Veri katmanı

Katalog, `src/data/seed.ts` içindeki deterministik üreteçle derleme anında oluşturulur
(sabit tohumlu PRNG → her derlemede aynı sonuç). Kullanıcının oluşturduğu ilanlar,
favoriler, mesajlar ve hesap `localStorage` üzerinde saklanır (`src/lib/store.tsx`).

Gerçek bir arka uca geçmek istersen değiştirmen gereken tek yer `src/lib/store.tsx`:
arayüz katmanı veri kaynağından bağımsızdır.

## Yerelde çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # statik çıktı → out/
```

## GitHub Pages'e yayınlama

Depoda hazır bir GitHub Actions iş akışı var (`.github/workflows/deploy.yml`).

1. Bu projeyi kendi GitHub deponuza push edin (varsayılan dal: `main`).
2. Depo → **Settings → Pages → Build and deployment → Source: GitHub Actions** seçin.
3. `main` dalına her push'ta site otomatik derlenip yayınlanır.

Adres: `https://<kullanıcı-adınız>.github.io/<depo-adı>/`

İş akışı `NEXT_PUBLIC_BASE_PATH` değişkenini depo adından otomatik türetir; alt dizinde
yayınlandığında varlık yolları bu sayede doğru kalır. Özel alan adı kullanacaksanız
bu değişkeni boş bırakın.

### Vercel'e yayınlama (alternatif)

Depoyu Vercel'e bağlamak yeterli; ek yapılandırma gerekmez. Vercel'de statik export
yerine sunucu tarafı çalıştırmak isterseniz `next.config.mjs` içindeki
`output: "export"` ve `basePath` satırlarını kaldırın.

## Dizin yapısı

```
src/
  app/            sayfalar (App Router)
    arama/        arama sonuçları + dinamik filtreler
    ilan/         ilan detayı (?id=…)
    ilan-ver/     4 adımlı ilan oluşturma sihirbazı
    hesap/        kullanıcı portföyü
    panel/        moderasyon paneli
  components/     Header, Omnibox, ListingCard, Filters, MarketGauge, Trust, Artwork
  lib/
    search.ts     doğal dil ayrıştırıcı + sorgu motoru
    market.ts     karşılaştırma kümesi ve piyasa konumu hesabı
    trust.ts      güven skoru ve kopya ilan tespiti
    store.tsx     istemci tarafı veri katmanı
  data/
    taxonomy.ts   kategori ve özellik şeması
    seed.ts       deterministik katalog üreteci
    geo.ts        il / ilçe verisi
```

## Tasarım notu

Görseller dış kaynaktan gelmez; her ilan için kategorisine ve ürün tipine göre
deterministik SVG kompozisyon üretilir (`src/components/Artwork.tsx`). Böylece proje
tek bir dış istek yapmadan, tamamen kendi kendine yeter.

## Lisans

MIT
