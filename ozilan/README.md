# OzBirArada uygulaması

Next.js 16 / React 19 / TypeScript / Tailwind. Ortak veri için Supabase Auth/PostgreSQL, yeni fotoğraflar için Cloudinary. Canlı pazaryeri Cloudflare Pages üzerinde yapılandırılacak; GitHub Pages `/ozilan/` çıktısı yalnızca tasarım önizlemesidir.

## Çalışan kod akışları

- Varsayılan Google ile giriş arayüzü; Supabase üzerinde Google OAuth yapılandırılmalı. SMTP tamamlanırsa e-posta ile üyelik ve şifre kurtarma `NEXT_PUBLIC_AUTH_METHOD=email` veya `both` ile ayrıca açılabilir.
- Yedi alanda fotoğraflı ilan oluşturma, düzenleme, yayından kaldırma ve yeniden yayınlama.
- JPG/PNG/WebP fotoğrafları sırayla en fazla 1600 piksele dönüştürme, üst verileri atma; en fazla 6 fotoğraf, her çıktıda en fazla 512 KiB. Cloudinary yüklemesi hesap ve kota denetleyen Edge Function üzerinden yapılır; API sırrı tarayıcıya verilmez.
- Arama, alt kategori, şehir ve fiyat filtreleri; favoriler ve hesaba bağlı kayıtlı aramalar.
- İlan sahibine özel görüşme; ikinci el teklifini mesaj olarak gönderme. Otomatik satıcı yanıtı yok.
- Şikâyet ve yönetici moderasyonu. İzinler istemci rolüne değil PostgreSQL RLS politikalarına dayanır.
- Mevcut 3D kart, ışık, kaydırma ve kategori geçişleri korunur. Mobil varlık kurtarma ve görünmeyen sahnelerin durdurulması devam eder.

Bu sürüm doğrudan ilan sahibiyle iletişim kurar. Kart ödemesi, stok rezervasyonu, kargo siparişi veya emanet ödeme oluşturmaz. Bunlar entegrasyonu tamamlanmış hizmetler gibi sunulmaz.

## Geliştirme

Node 22 kullanılır. Bu dizinde:

```sh
npm ci
npm test
npm run lint
npm run dev
```

`.env.example` dosyasını `.env.local` olarak kopyalayıp yalnızca projenin public URL ve publishable anahtarını gir. Gerçek kurulum adımları [supabase/README.md](../supabase/README.md) içinde.

```sh
NODE_ENV=production NEXT_PUBLIC_BASE_PATH=/ozilan npm run build
```

Statik çıktı `out/` dizinine yazılır. `npm run build`, alt dizin yollarını ve kurtarma betiğinin yükleme sırasını da doğrular. `next start` statik export sunucusu değildir; `out/` bir statik HTTP sunucusuyla sunulmalıdır.

Public backend değişkenleri eksikse örnek katalog okunabilir, üyelik formu kapalıdır. Demo şifreleri ve tarayıcıda değiştirilmiş admin işaretleri canlı hesaplara taşınmaz. Önceki yerel demo verilerinin bir kısmı cihazda kalır ancak sunucuya aktarılmaz.

## Testin kapsamı

`npm test`: 24 test. Arama bağlantıları/filtreleri, güvenli giriş dönüşü, kayıt eşleme, kart hareketleri, mobil varlık kurtarma, gerçek PostgreSQL politikaları ve Cloudinary medya handler'ı.

Veritabanı testi PGlite içinde üretim SQL dosyasını çalıştırır. Başka kullanıcının ilanını değiştirme, mesajını okuma/gönderici taklidi, yabancı fotoğraf yükleme, admin tarafından kapatılan ilanı yeniden açma girişimleri engellenir. Sahiplik ve özel favoriler, görüşme katılımcıları ve anonim erişim denetlenir.

### Tarayıcı entegrasyon testi

`npm run test:local-api`, yalnızca `127.0.0.1:54329` üzerinde bellekte bir test API'si açar. Supabase HTTP/Auth/Storage taşımasını taklit eder, **gerçek kimlik doğrulama sunucusu değildir ve yayımlanmamalıdır**. Veritabanı güncel SQL/RLS kurallarını kullanır. Cloudinary migration'ı eski kova yüklemelerini kapatır; bu HTTP fixture artık yeni fotoğraf kabul testi değildir. Medya handler'ının dış sağlayıcı taşımasını taklit edip gerçek SQL ile doğrulayan test `tests/cloudinary-media.test.mjs` dosyasıdır. Kabul ettiği ön yüz origin'i `http://127.0.0.1:4173`.

İzole test derlemesinde değişkenler:

```text
NEXT_PUBLIC_BASE_PATH=/ozilan
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=integration-public-key
NEXT_PUBLIC_AUTH_METHOD=email
```

Hesaplar: `qa.seller@ozilan.test` ve `qa.buyer@ozilan.test`; test parolası `LocalQaOnly!24`. Yalnızca bellekteki yerel fixture içindir. Yeniden başlatma tüm test kayıtlarını sıfırlar. Test anahtarını veya fixture çıktısını GitHub Pages'e koyma.

Cloudinary değişikliğinden önceki 14 Eylül yerel tarayıcı kontrolü (Supabase Storage sürümü): gerçek dosya seçimiyle fotoğraflı ilan oluşturma, fiyat/başlık düzenleme, iki hesap arasında mesaj ve yanıt, favori, arama, kaldırılan ilanı anonim katalogdan gizleme ve yeniden yayınlama başarılı. Bu sonuç gerçek Supabase e-posta servisini veya fiziksel iPhone/Samsung cihazlarını doğrulamaz.

## Mevcut sınırlar

- Her yenilemede en yeni 1000 erişilebilir ilan ve en fazla 1000 profil alınır; 200 görüşme ve son 1000 mesaj sınırı vardır. Çok daha büyük katalog için sunucu tarafı sayfalama, tek ilan/görüşme yükleme ve geçmiş mesaj sayfalaması eklenmelidir.
- Görünür oturumda 30 saniyelik kontrol ve elle yenileme var; push bildirim yok.
- Taslaklar otomatik kaydedilmez. Bağlantısız fotoğrafları 24 saat sonra temizleyen sunucu işlemi hazır; [canlı Cron kurulumu](../supabase/MEDIA.md) henüz yapılmadı. Ücretsiz depolama ve trafik panelden izlenmelidir.
- Satıcı kimliği ve değerlendirme puanı doğrulaması uygulanmadı. Skorlar kural temelli ilan incelemesidir, güvenlik garantisi değildir.
- Arşivleme geri alınabilir; hesap silme/anonymizasyon süreci ve işletmeci iletişim/aydınlatma detayları ticari açılıştan önce tamamlanmalıdır.
- Google ile girişin canlı testi gerçek Supabase projesi ve Google OAuth istemcisi bekliyor. İlk açılış Google ile giriş üzerinden yapılabilir; bu akış SMTP istemez. E-posta kaydı/kurtarma ayrıca açılırsa SMTP ve teslim testi gerekir.
