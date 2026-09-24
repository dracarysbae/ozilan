# OzBirArada — geliştirme devri (24 Eylül 2026)

## Kaynak ve çalışma dizini

- Git deposu: https://github.com/dracarysbae/ozilan — `main`.
- Bu bilgisayarda depo: `E:\uygulamalar\ozbirarada`.
- Next.js uygulaması: deponun **`ozilan/`** alt dizini. Komutları burada çalıştır.
- Sunucu kodu, migration ve RLS kuralları: `supabase/`.
- Proje artık Tetris klasörünün altında değildir. Git geçmişi ve yerel değişiklikler taşınırken korunmuştur.

```sh
git clone https://github.com/dracarysbae/ozilan.git
cd ozilan/ozilan
npm ci
npm test
npm run lint
npm run check:media
npm run dev
```

Node.js 22 kullan. `.env.example` yalnızca yapılandırma örneğidir. `.env.local`, sağlayıcı sırları, node_modules ve derleme çıktıları Git'e dahil edilmez. Backend olmadan örnek katalog görüntülenir; canlı hesaplar için ilgili ortamın public yapılandırması gerekir. Sunucu sırları yalnızca sağlayıcının gizli ayarlarında kalmalıdır.

## Bu teslimdeki son değişiklikler

- Mobil ilan detayında resim şeridinin sayfayı yatay genişletmesi düzeltildi.
- Google Fonts isteği ilk boyamayı engellemeyecek şekilde yüklendi.
- Kartların sağdan/soldan 3D girişleri, yakınlaşması ve ışık geçişi korunuyor; kartlar okuma alanına gelmeden düzleşiyor.
- Dar ekranda hareket genliği azaltılarak kartların kenarlardan taşması azaltıldı.
- Kategori sahneleri arasında kaydırmada her sahnenin ortada okunabilecek kadar kalması sağlandı.
- Son hareket davranışlarının testleri güncellendi.

## Doğrulama

24 Eylül 2026, Node 22.12.0:

- `npm test`: **27/27 başarılı**.
- `npm run lint`: başarılı (TypeScript).
- `npm run check:media`: başarılı.
- GitHub Pages önizleme ortamıyla production static export: **16 sayfa ve 220 yerel dosya referansı doğrulandı**. `NODE_ENV=production`, `NEXT_PUBLIC_BASE_PATH=/ozilan`, public backend değişkenleri boş.
- Bu turda canlı Google OAuth, gerçek hesapla yükleme veya fiziksel telefon testi yapılmadı.

## Yayın ve devam noktaları

GitHub Pages workflow'u `main` push'unda tasarım önizlemesi üretir. Gerçek pazaryeri için Cloudflare Pages Direct Upload kurulumu kullanılmıştır; bu push Cloudflare'ı kendiliğinden güncellemez. Önce [LIVE_SETUP.md](LIVE_SETUP.md), [ozilan/README.md](ozilan/README.md) ve [supabase/MEDIA.md](supabase/MEDIA.md) dosyalarını oku. LIVE_SETUP, 14 Eylül'de doğrulanmış dış hizmet durumunun tarihsel kaydıdır; panellerdeki bugünkü durum ayrıca doğrulanmalıdır.

Önceki kayıtta açık kalan başlıklar: Google OAuth/Supabase sağlayıcısının tamamlanması ve gerçek hesaplı kabul testleri; saatlik medya temizliği; hesap/veri silme akışı ve işletmeci iletişimi. Kullanıcı Google kurulumuna devam onayı vermiştir; geçmişteki “onay bekleniyor” notunu güncel teknik tamamlanma kanıtı sayma.

Ürün beklentileri: yedi kategori, güçlü mobil kaydırma ve kategori efektleri korunmalı. Geliştirme sırasında efektler kaldırılmamalı. Ücretli plan, ödeme veya kart kaydı açılmamalı. Mevcut özelliklerin ve henüz doğrulanmamış canlı akışların ayrımı korunmalı.
