# Ortak veri altyapısını açma

Bu klasör yeni, ayrı bir OzBirArada Supabase projesi içindir. Başka uygulamanın veritabanına uygulanmaz. Henüz canlı projeye uygulanmamıştır.

## Ücretsiz kurulum

1. Kullanıcı Supabase hizmet şartlarının kabulünü onayladıktan sonra kendi hesabında **Free** kuruluş/proje oluşturulur. Ücretli plan, ödeme kartı veya eklenti açılmaz. Limit dolması yükseltme yetkisi sayılmaz.
2. Veritabanı parolasını kullanıcı oluşturur ve güvenli biçimde saklar. Parola kaynak koda veya sohbet metnine yazılmaz.
3. SQL Editor'da `migrations/202609140001_marketplace.sql` dosyası yeni projeye bir kez uygulanır. Tablolar, RLS, kolon izinleri, RPC, trigger ve fotoğraf kovası aynı transaction içindedir.
4. Authentication URL Configuration:
   - Site URL: `https://dracarysbae.github.io/ozilan/`
   - Redirect: `https://dracarysbae.github.io/ozilan/giris/`
   - Recovery: `https://dracarysbae.github.io/ozilan/giris/?mod=yenile`
   - Geliştirme gerekiyorsa yalnızca bilinen loopback yönlendirmeleri ayrıca eklenir. Üretim için geniş wildcard kullanılmaz.
5. E-posta doğrulaması açık, minimum parola uzunluğu 8 olmalı. **Varsayılan e-posta servisi herkese açık üyelik için yeterli değildir.** Supabase varsayılan SMTP yalnızca proje ekibindeki önceden yetkili adreslere gönderir; herkese açık e-posta kaydı/kurtarma için doğrulanmış bir göndericiyle SMTP kurulup denenmelidir. Ücretli servis açılmaz ve doğrulama kapatılarak bu adım atlanmaz.
6. Proje URL ve **publishable** anahtarını yerel `.env.local` içine ve GitHub repository Actions variables alanına aynı adlarla ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   Public anahtar tarayıcıya gider; yetki sınırı RLS'dir. `service_role`, secret key, veritabanı parolası ve SMTP parolası **asla** `NEXT_PUBLIC_` değişkenine konmaz.
7. Gerçek iki hesapla kayıt, e-posta doğrulaması, oturum, fotoğraf, ilan düzenleme, favori, mesaj/yanıt ve şifre kurtarma uçtan uca denenir. Güncel test ve build başarılı olmadan canlıya geçilmez.
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
| Fotoğraf | Public URL; yükleme yalnızca kendi UUID klasörüne, silme yalnızca hiçbir ilana bağlı olmayan kendi dosyasına |

İlan başına 1–6 fotoğraf, fotoğraf başına 2 MB; kullanıcı başına günde 20 yeni ilan, saatte 30 görüşme ve dakikada 30 mesaj sınırı vardır. İlan tarihini güncelleme 24 saatte bir mümkündür. Bu sınırlar ücretsiz kaynakların kötüye kullanımını tamamen önlemez; kullanım izlenmelidir.

## Yayın öncesi tamamlanacaklar

- Gerçek projenin kurulması ve izin testlerinin o projede doğrulanması.
- Gerçek e-posta göndericisi/SMTP ve teslim testi.
- İşletmeci iletişim bilgisi, kullanıcı veri talepleri ve hesap silme süreci.
- GitHub değişkenleri, üretim build ve Pages yayın doğrulaması.

Kaynaklar: [SMTP kısıtları](https://supabase.com/docs/guides/auth/auth-smtp), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [yönlendirmeler](https://supabase.com/docs/guides/auth/redirect-urls), [plan/faturalama](https://supabase.com/docs/guides/platform/billing-on-supabase).
