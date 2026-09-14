# Cloudinary fotoğraf bağlantısı

Bu değişiklik hazır kodu ve yerel testleri içerir. Cloudinary/Supabase hesaplarının açılması, gizli ortam değişkenleri, Edge Function dağıtımı ve zamanlanmış temizlik ayrıca tamamlanmadan canlı bağlantı çalışmaz. Ücretsiz Image & Video API planı kullanılır; Assets/DAM denemesi, kart veya ücretli eklenti açılmaz.

## Kurulum sırası

1. Yeni OzBirArada Supabase projesine tüm `migrations/*.sql` dosyalarını sırayla uygula. Üçüncü migration yeni yüklemeleri Cloudinary'ye geçirir; eski Supabase fotoğraflarını okumaya ve mevcut ilanlarda kullanmaya devam eder.
2. Cloudinary Image & Video API **Free** hesabında cloud name, API key ve API secret alınır. Cloud name herkese açık yapılandırmadır. API secret yalnızca Supabase Edge Function secrets alanına yazılır; kaynak koduna, istemciye veya `NEXT_PUBLIC_` değişkenlerine konmaz. Ücretli eklenti veya unsigned upload preset açılmaz.
3. Supabase Edge Function secrets:

   | Anahtar | Değer |
   |---|---|
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary panelindeki cloud name |
   | `CLOUDINARY_API_KEY` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret |
   | `MEDIA_ALLOWED_ORIGINS` | Gerçek üretim kökeni, ör. atanan `https://…pages.dev`; yönlendirme yolu içermez |
   | `MEDIA_CLEANUP_SECRET` | Yalnızca zamanlanmış temizliğe ait rastgele, en az 32 baytlık gizli değer |

   `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` Edge ortamının yerleşik değerleridir. Bunları tarayıcıya aktarma. Local test kaynağı açıkça eklenmedikçe loopback kökeni kabul edilmez.
4. `supabase functions deploy listing-media --project-ref GERCEK_PROJE_REF` ile veya Dashboard'ın Edge Functions editöründe aynı iki TypeScript dosyasını yükleyerek dağıt. `supabase/config.toml` gateway'in eski JWT denetimini kapatır; handler her normal çağrıda gerçek bearer token'ı Supabase Auth `/user` üzerinden doğrular. Kimlik doğrulamasız yükleme yoktur.
5. Cloudflare Pages üretim build'inde `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_AUTH_METHOD=google`, `NODE_ENV=production` ayarla. `NEXT_PUBLIC_BASE_PATH` boş kalır. Frontend içinde hiçbir gizli anahtar bulunmaz.
6. Supabase Cron'da her saat, `/functions/v1/listing-media?cleanup=1` adresine POST gönderen iş oluştur. Authorization başlığında `Bearer MEDIA_CLEANUP_SECRET` kullan; sırrı Supabase Vault'ta tut ve işte Vault'tan oku. Gövde gerekmez. Gerçek anahtarı migration'a yazma. Her çalıştırma en fazla 50 eski dosyayı işler; sıralama en eski kayıttan başlar. `failed>0` durumunda 502 döner ve sonraki saat yeniden denenir. Bu iş kurulmadan otomatik temizliğin çalıştığı söylenemez.

## Akış ve sınırlar

- Tarayıcı fotoğrafı en fazla 1600 piksel uzun kenara getirir, konum/kamera üst verilerini aktarmadan WebP olarak hazırlar. 0,84 / 0,78 / 0,72 kalitelerinde dosya boyutunu dener; ayrıntılı fotoğraf 512 KiB'ye sığmıyorsa sessizce bulanıklaştırmak yerine kullanıcıdan daha küçük görsel ister.
- Fotoğraf Supabase Edge Function üzerinden Cloudinary'ye gönderilir. Bu bilinçli olarak doğrudan, tekrar kullanılabilen istemci imzası vermez: dosya boyutu, türü, sahipliği ve kota sunucuda denetlenir. Yalnızca sabit `image/upload` uç noktası kullanılır. Video, uzaktan URL çekme, ek dönüşüm, ücretli eklenti ve mevcut dosya üzerine yazma seçeneği istemciye verilmez.
- Proxy aktarımı **Supabase çıkış trafiği de tüketir**. Bu nedenle yeni fotoğraf aktarımları proje genelinde son 30 günde 3 GB ile sınırlandırılır; Supabase Free'nin diğer veri istekleri için kalan payı da izlenmelidir. Bu, ayda 10 GB ücretsiz yükleme sözü değildir. 10 GB kalıcı fotoğraf alanı birden fazla ayda dolabilir.
- Depolama kabul sınırı 10 GB; Cloudinary'nin 25 ortak kredisi içinde görsel trafiğine pay bırakır. CDN trafiği ayrıca Cloudinary kotasından düşer. Bu uygulama sınırları Cloudinary'nin tüm hesap kullanımını ölçen sayaç değildir; hesap başka projeler için de kullanılırsa panelden toplam kullanım kontrol edilir.
- Kullanıcı başına saatte 30, günde 120 fotoğraf denemesi; ilan başına 1–6 fotoğraf. Hatalı/silinmiş denemeler de dönemsel yükleme kotasında sayılır.
- Dosyalar yalnızca başarılı Cloudinary cevabı doğrulandıktan sonra ilana bağlanabilir. Bekleyen veya silinmekte olan dosya yayınlanamaz. Başkasının hazır dosyası da kullanılamaz.
- Kullanılan fotoğrafı silme isteği dosyayı kaldırmaz. İlan düzenlemesi kaydedildikten sonra bağlantısız kalan fotoğraflar 24 saatlik temizlik kapsamına girer. İlanı yayından kaldırmak fotoğraflarını silmez; tekrar yayınlama ve görüşme bağlamı korunur.
- Yükleme yanıtı kaybolursa kayıt beklemede kalır ve kotadan düşmez. Zamanlanmış iş 24 saat sonra sağlayıcıdaki olası dosyayı temizler. Silme başarısızsa kayıt yeniden denenmek üzere tutulur; dosya silinmeden kapasite boşaltılmaz.

## Doğrulama

`npm test` içindeki medya testleri gerçek PostgreSQL/PGlite üzerinde tüm migration'ları uygular; yalnızca dış Auth/Cloudinary HTTP taşımalarını taklit eder. Sahte oturum, izinsiz köken, bozuk/büyük dosya, başka hesaba ait fotoğraf, doğrudan tablo/RPC/kova yazma, silme-yayın bağı, kayıp upload yanıtı, tekrar silme, temizleme, aylık ve toplam kota sınırları test edilir. URL oluşturma testleri dönüşüm/alan adı enjeksiyonunu engeller.

Canlı kabul testi ayrıca gereklidir: iki gerçek hesapla fotoğraf yükle → ilan yayınla → başka cihazdan gör → düzenle → çıkarılan dosyayı temizle; sonra Cron çalıştırmasını kontrol et. Yerel taklit HTTP testinin geçmesi gerçek OAuth/Cloudinary bağlantısının kurulduğu anlamına gelmez.

Kaynaklar: [Cloudinary API](https://cloudinary.com/documentation/image_upload_api_reference), [imza](https://cloudinary.com/documentation/authentication_signatures), [ücretsiz plan/kredi hesabı](https://cloudinary.com/documentation/billing_and_plans), [Supabase Edge kimlik denetimi](https://supabase.com/docs/guides/functions/auth).
