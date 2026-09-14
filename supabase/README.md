# Ortak veri altyapısını açma

Bu klasör yeni, ayrı bir OzBirArada Supabase projesi içindir. Başka uygulamanın veritabanına uygulanmaz. Henüz canlı projeye uygulanmamıştır.

## Ücretsiz kurulum

1. Kullanıcı Supabase hizmet şartlarının kabulünü onayladıktan sonra kendi hesabında **Free** kuruluş/proje oluşturulur. Ücretli plan, ödeme kartı veya eklenti açılmaz. Limit dolması yükseltme yetkisi sayılmaz.
2. Veritabanı parolasını kullanıcı oluşturur ve güvenli biçimde saklar. Parola kaynak koda veya sohbet metnine yazılmaz.
3. SQL Editor'da `migrations/` içindeki SQL dosyaları dosya adı sırasıyla yeni projeye birer kez uygulanır. Tablolar, RLS, kolon izinleri, RPC, trigger ve fotoğraf kovası aynı transaction içindedir.
4. Canlı pazaryeri Cloudflare Pages Free üzerinde açılacak; ayrıntılar [FREE_LAUNCH.md](../FREE_LAUNCH.md). Aşağıdaki GitHub adresleri eski önizleme örnekleridir. Canlı Authentication URL Configuration değerleri, oluşturulan gerçek Pages adresiyle değiştirilmelidir:
   - Site URL: `https://dracarysbae.github.io/ozilan/`
   - Redirect: `https://dracarysbae.github.io/ozilan/giris/`
   - Recovery: `https://dracarysbae.github.io/ozilan/giris/?mod=yenile`
   - Geliştirme gerekiyorsa yalnızca bilinen loopback yönlendirmeleri ayrıca eklenir. Üretim için geniş wildcard kullanılmaz.
5. İlk açılış için `NEXT_PUBLIC_AUTH_METHOD=google` kullanılır. Google Auth Platform üzerinde ayrı web OAuth istemcisi oluşturulur; yalnızca `openid`, `userinfo.email`, `userinfo.profile` kapsamları kullanılır. Supabase panelinde gösterilen tam callback adresi Google istemcisine eklenir. İstemci kimliği ve gizli anahtarı yalnızca Supabase Google provider ayarında tutulur. E-posta sağlayıcısı kullanılmayacaksa kapalı bırakılır; Gmail/Drive gibi ek erişimler veya ödeme hesabı açılmaz. Google ile giriş SMTP gerektirmez.

   E-posta üyeliği sonradan açılırsa doğrulama açık, minimum parola uzunluğu 8 olmalı. **Varsayılan e-posta servisi herkese açık üyelik için yeterli değildir.** Supabase varsayılan SMTP yalnızca proje ekibindeki önceden yetkili adreslere gönderir; herkese açık e-posta kaydı/kurtarma için doğrulanmış bir göndericiyle SMTP kurulup denenmelidir. Ücretli servis açılmaz ve doğrulama kapatılarak bu adım atlanmaz.
6. Proje URL ve **publishable** anahtarını yerel `.env.local` içine ve Cloudflare Pages üretim ortam değişkenleri alanına aynı adlarla ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_AUTH_METHOD=google`
   Public anahtar tarayıcıya gider; yetki sınırı RLS'dir. `service_role`, secret key, veritabanı parolası ve SMTP parolası **asla** `NEXT_PUBLIC_` değişkenine konmaz.
7. Gerçek iki Google hesabıyla ilk giriş, sonraki giriş, iptal edilen giriş, oturum, fotoğraf, ilan düzenleme, favori ve mesaj/yanıt uçtan uca denenir. E-posta yöntemi açılırsa doğrulama ve şifre kurtarma da denenir. Güncel test ve build başarılı olmadan canlıya geçilmez.
8. Yetkili yönetici gerekirse yalnızca kullanıcının belirlediği hesaba sunucu tarafında `app_metadata.role=admin` atanır. `user_metadata` veya tarayıcıdaki role değerleri yetki vermez.

## Veri erişimi

| Veri | Okuma / değiştirme |
|---|---|
| Profil adı ve hesap türü | Herkese açık; hesap sahibi yalnızca kendi ad/kind/city alanını değiştirir |
| Aktif ilan | Herkese açık; sahip veya yetkili admin düzenler |
| Kaldırılmış ilan | Sahip, yönetici ve mevcut görüşme katılımcıları |
| Favori, kayıtlı arama | Yalnızca sahibi |
| Görüşme, mesaj | Yalnızca alıcı ve satıcı; yönetici için toplu okuma politikası yok |
| Şikâyet | Bildiren ve yönetici; yalnızca yönetici çözümler |
| Fotoğraf | Public URL; Edge Function doğrulanmış hesaba Cloudinary dosyası kaydeder, silme yalnızca hiçbir ilana bağlı olmayan kendi dosyasına |

İlan başına 1–6 fotoğraf, hazırlanmış fotoğraf başına 512 KiB; kullanıcı başına günde 20 yeni ilan, saatte 30 görüşme ve dakikada 30 mesaj sınırı vardır. İlan tarihini güncelleme 24 saatte bir mümkündür. Bu sınırlar ücretsiz kaynakların kötüye kullanımını tamamen önlemez; kullanım izlenmelidir.

## Yayın öncesi tamamlanacaklar

- Gerçek projenin kurulması ve izin testlerinin o projede doğrulanması.
- Google OAuth istemcisi ve canlı giriş testi; e-posta yöntemi açılacaksa SMTP ve teslim testi.
- İşletmeci iletişim bilgisi, kullanıcı veri talepleri ve hesap silme süreci.
- Cloudflare değişkenleri, üretim build ve Pages yayın doğrulaması.
- [Cloudinary bağlantısı ve zamanlanmış temizlik](MEDIA.md).

Kaynaklar: [SMTP kısıtları](https://supabase.com/docs/guides/auth/auth-smtp), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [yönlendirmeler](https://supabase.com/docs/guides/auth/redirect-urls), [plan/faturalama](https://supabase.com/docs/guides/platform/billing-on-supabase).
