# Canlı kurulum durumu — 14 Eylül 2026

- Kullanıcı Cloudinary ve Supabase ücretsiz hizmet şartlarını kabul etti; `dracarysbae` GitHub hesabındaki temel profil/e-posta okuma iznini ayrıca onayladı.
- Her iki GitHub OAuth girişi tamamlandı. Kod deposuna erişim izni verilmedi.
- Cloudinary hesabı açıldı; panelde **Free / $0 / Current Plan / 25 monthly credits** doğrulandı. Cloud name: `vv2ggaqx`. Mevcut aktif anahtar panelde hazır; gizli anahtar kaynak koduna veya yerel dosyaya alınmadı.
- Cloudinary `ml_default` yükleme önayarı **Signed**. Strict image/video transformations açıldı, uzak image/video fetch kısıtlandı, üç imzasız video işlemi kapatıldı. Kaydedilip sayfa yeniden yüklenerek değerlerin kalıcı olduğu doğrulandı.
- Supabase **OzBirArada** kuruluşu Free olarak oluşturuldu. Kuruluş kimliği: `mtjcoimrolpwvoowsbtd`.
- Kullanıcı proje parolasını kendisi girerek **ozbirarada** projesini oluşturdu. Proje referansı `iaaajytulwtholkolbmd`, bölge `Central EU (Frankfurt)`, ücretsiz nano kaynak. Parola okunmadı veya kaydedilmedi.
- Üç SQL migration'ı Dashboard SQL Editor üzerinden sırayla uygulandı; her biri `Success. No rows returned` verdi. Canlı katalog sorgusu: RLS etkin 8 tablo, korumasız 0 tablo, anonim medya tablo erişimi ve authenticated medya RPC erişimi kapalı, service_role RPC erişimi açık; eski doğrudan Storage yükleme politikası kaldırılmış.
- **listing-media** Edge Function yayımlandı. Aktarılan handler içeriği yerel kaynakla satır sonları normalize edilerek karşılaştırıldı (8315 karakter, FNV32 2364886954). Gateway'in legacy JWT seçeneği kapalı; handler normal isteklerde Supabase Auth üzerinden gerçek kullanıcı oturumunu doğrular.
- Sunucu adresi: `https://iaaajytulwtholkolbmd.supabase.co/functions/v1/listing-media`. Canlı GET isteğinde beklenen HTTP 405 görüldü. Cloudinary secrets ve temizlik anahtarı henüz kaydedilmediği için gerçek yükleme açık değil.
- Yerel, Git tarafından yok sayılan `.env.local` artık Supabase public URL/publishable anahtarını, herkese açık Cloudinary adını ve giriş yöntemini içeriyor; gizli anahtar yok. Bu değerlerle üretim build'i geçti: 16 sayfa, 220 yerel dosya referansı.
- `node --env-file=.env.local scripts/verify-live-backend.mjs` gerçek projeye yalnızca okuma istekleriyle geçti. Genel katalog erişimi, özel tabloların anonim erişime kapalı olması, görüşme satırlarının RLS ile gizlenmesi ve işlevin çalışması kontrol edildi. Bu test gerçek Google girişi veya fotoğraf yüklemesi testi değildir.

## Devam için kalan işler

1. Cloudinary mevcut API key/secret bilgisinin yalnızca Supabase şifreli sunucu ayarlarına aktarımı için özel kullanıcı onayı istendi; yanıt bekleniyor. Sunucu anahtarı kaynak koduna veya tarayıcı paketine konmayacak.
2. `supabase/MEDIA.md` içindeki gizli ayarları ve saatlik temizlik işini tamamla. Cron henüz kurulmadı.
3. Google OAuth istemcisini gerçek Supabase callback'i ile bağla. Google giriş sağlayıcısı henüz yapılandırılmadı.
4. Cloudflare Pages Free üzerinde üretim barındırmasını hazırla. Giriş ekranındaki zorunlu hizmet şartları ve GitHub temel profil/e-posta girişi için kullanıcı onayı istendi; yanıt bekleniyor. Henüz Cloudflare hesabı/projesi oluşturulmadı.
5. Gerçek yayın kökenini medya CORS ve Auth yönlendirmelerine ekle; iki hesapla fotoğraf/ilan/mesaj ve temizlik kabul testlerini tamamla. Henüz gerçek sağlayıcılı yükleme yapılmadı.
6. Yerel backend commit'leri henüz GitHub'a itilmedi. Eski GitHub Pages tasarım önizlemesi yerinde duruyor; ticari sürüm Cloudflare'a yayımlanacak.

Hiçbir kart, ücretli plan veya ödeme açılmadı. Bu kayıt canlıya çıkış tamamlandı anlamına gelmez.
