# Canlı kurulum durumu

## 24 Eylül 2026 doğrulaması

Aşağıdaki 14 Eylül kaydı tarihseldir. 24 Eylül'de panellerden okunan durum ve yapılan işlemler: [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md). Özetle: Supabase projesi duraklatılmıştı ve ücretsiz olarak yeniden açıldı; Google sağlayıcısı açık ve 14 Eylül'de bir gerçek Google girişi yapılmış; migration 4–5 uygulandı; listing-media güncellendi; saatlik temizlik Cron'u kuruldu; Cloudflare Pages'e 7d0e6aee dağıtımı yapıldı. Aşağıdaki "Google OAuth istemcisi henüz oluşturulmadı", "Cron henüz kurulmadı" ve "push tamamlanmadı" cümleleri artık güncel değildir.

## 14 Eylül 2026 kaydı (tarihsel)

- Kullanıcı Cloudinary ve Supabase ücretsiz hizmet şartlarını kabul etti; `dracarysbae` GitHub hesabındaki temel profil/e-posta okuma iznini ayrıca onayladı.
- Her iki GitHub OAuth girişi tamamlandı. Kod deposuna erişim izni verilmedi.
- Cloudinary hesabı açıldı; panelde **Free / $0 / Current Plan / 25 monthly credits** doğrulandı. Cloud name: `vv2ggaqx`. Mevcut aktif anahtar panelde hazır; gizli anahtar kaynak koduna veya yerel dosyaya alınmadı.
- Cloudinary `ml_default` yükleme önayarı **Signed**. Strict image/video transformations açıldı, uzak image/video fetch kısıtlandı, üç imzasız video işlemi kapatıldı. Kaydedilip sayfa yeniden yüklenerek değerlerin kalıcı olduğu doğrulandı.
- Supabase **OzBirArada** kuruluşu Free olarak oluşturuldu. Kuruluş kimliği: `mtjcoimrolpwvoowsbtd`.
- Kullanıcı proje parolasını kendisi girerek **ozbirarada** projesini oluşturdu. Proje referansı `iaaajytulwtholkolbmd`, bölge `Central EU (Frankfurt)`, ücretsiz nano kaynak. Parola okunmadı veya kaydedilmedi.
- Üç SQL migration'ı Dashboard SQL Editor üzerinden sırayla uygulandı; her biri `Success. No rows returned` verdi. Canlı katalog sorgusu: RLS etkin 8 tablo, korumasız 0 tablo, anonim medya tablo erişimi ve authenticated medya RPC erişimi kapalı, service_role RPC erişimi açık; eski doğrudan Storage yükleme politikası kaldırılmış.
- **listing-media** Edge Function yayımlandı. Aktarılan handler içeriği yerel kaynakla satır sonları normalize edilerek karşılaştırıldı (8315 karakter, FNV32 2364886954). Gateway'in legacy JWT seçeneği kapalı; handler normal isteklerde Supabase Auth üzerinden gerçek kullanıcı oturumunu doğrular.
- Sunucu adresi: `https://iaaajytulwtholkolbmd.supabase.co/functions/v1/listing-media`. Kullanıcının devam onayıyla Cloudinary mevcut API key/secret yalnızca Supabase şifreli Edge secrets alanına kaydedildi. Kaynak koduna, yerel dosyaya veya istemciye alınmadı. Canlı GET HTTP 405; oturumsuz POST HTTP 401 verdi. Gerçek hesaplı fotoğraf yüklemesi henüz denenmedi.
- `MEDIA_ALLOWED_ORIGINS=https://ozbirarada.pages.dev` kaydedildi. Canlı preflight testi bu kökene 204 ve doğru CORS başlığı, farklı kökene 403 ve hiçbir izin başlığı döndürdü.
- Yerel, Git tarafından yok sayılan `.env.local` artık Supabase public URL/publishable anahtarını, herkese açık Cloudinary adını ve giriş yöntemini içeriyor; gizli anahtar yok. Bu değerlerle üretim build'i geçti: 16 sayfa, 220 yerel dosya referansı.
- `node --env-file=.env.local scripts/verify-live-backend.mjs` gerçek projeye yalnızca okuma istekleriyle geçti. Genel katalog erişimi, özel tabloların anonim erişime kapalı olması, görüşme satırlarının RLS ile gizlenmesi ve işlevin çalışması kontrol edildi. Bu test gerçek Google girişi veya fotoğraf yüklemesi testi değildir.
- Cloudflare hesabı, kullanıcının hizmet şartları ve GitHub temel profil/e-posta onayıyla açıldı. Hesap kimliği: `e426e4073693804a796493adc11df53b`. Repo erişimi verilmeden **Pages Direct Upload** kullanıldı; kart, domain veya ücretli ürün açılmadı.
- **https://ozbirarada.pages.dev/** yayımlandı. 107/107 dosya ve `Success! Your project is deployed` sonucu görüldü; Production deployment `1227284b` (`https://1227284b.ozbirarada.pages.dev`). Paket: uygulama klasörünün yok sayılan `.preview-root/ozbirarada-951aef6.zip` dosyası; 951aef6 kaynak sürümü ve public üretim değişkenleriyle derlenmiş çıktı.
- Ana sayfa ve Vasıta sayfası gerçek yayın adresinde tarayıcıdan açıldı; tarayıcı hata kaydında hata yoktu. Dar görünümde taşma görülmedi (gözlenen gerçek genişlik 566 px; 390 px fiziksel telefon testi tamamlandı denmemeli). Bilgisayardaki Node/.NET üzerinden bağımsız HTTPS kontrolü TLS/kimlik bilgisi hatasıyla tamamlanamadı; DNS çözümlemesi başarılı. Tarayıcı dışından erişim ve gerçek telefon kabul testi ayrıca doğrulanmalı; güvenlik denetimi veya TLS doğrulaması kapatılmadı.
- Supabase Auth Site URL `https://ozbirarada.pages.dev`, tek redirect URL `https://ozbirarada.pages.dev/giris/` olarak kaydedildi. Geniş wildcard eklenmedi.
- `zuberozcan24` Google hesabında ayrı **OzBirArada** projesi oluşturuldu; proje ID `ozbirarada`. Google Auth formunda uygulama adı ve destek iletişimi hazır, hedef kitle External. Son ekrandaki **Google API Services: User Data Policy** için özel onay soruldu; henüz işaretlenmedi. Google OAuth istemcisi ve Supabase Google sağlayıcısı henüz oluşturulup etkinleştirilmedi.

## Devam için kalan işler

1. Kullanıcı Google onayını verince Auth Platform kurulumunu tamamla; Web OAuth istemcisinde yalnızca temel giriş kapsamları ve `https://iaaajytulwtholkolbmd.supabase.co/auth/v1/callback` kullan. İstemci sırrı yalnızca Supabase Google sağlayıcısına gider.
2. `supabase/MEDIA.md` içindeki ayrı temizlik anahtarı ve saatlik Cron işini tamamla. Cron henüz kurulmadı.
3. İki hesapla giriş/fotoğraf/ilan/mesaj ve temizlik kabul testlerini tamamla. Henüz gerçek sağlayıcılı fotoğraf yüklemesi yapılmadı.
4. Google girişi etkinleşmeden ilk kullanıcılara üyelik hazır denmemeli. İşletmeci iletişimi ve hesap/veri silme süreci de açık kalan ürün işleridir.
5. Yerel backend commit'leri henüz GitHub'a itilmedi. Uzak `629eb7f` tasarım ağacının yerel backend öncesi `51906db` ağacıyla satır sonları dışında aynı olduğu doğrulandı; geçmişler `44e5940` merge commit'iyle birleştirildi. Merge sonrası uygulama, sunucu ve workflow dosyalarında içerik değişikliği olmadığı ayrıca doğrulandı. Normal push, bu bilgisayarda GitHub kimlik doğrulaması bulunmadığı için tamamlanmadı (`gh auth status` da oturum yok dedi); force push yapılmadı. Eski GitHub Pages tasarım önizlemesi yerinde duruyor; güncel derlenmiş ön yüz Cloudflare üzerinde yayımlandı. Sonraki yayınlar Pages Direct Upload üzerinden yapılır; tüm dosyalar güncel production build'den alınmalı.

Hiçbir kart, ücretli plan veya ödeme açılmadı. Bu kayıt canlıya çıkış tamamlandı anlamına gelmez.
