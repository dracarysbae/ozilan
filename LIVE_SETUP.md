# Canlı kurulum durumu — 14 Eylül 2026

- Kullanıcı Cloudinary ve Supabase ücretsiz hizmet şartlarını kabul etti; `dracarysbae` GitHub hesabındaki temel profil/e-posta okuma iznini ayrıca onayladı.
- Her iki GitHub OAuth girişi tamamlandı. Kod deposuna erişim izni verilmedi.
- Cloudinary hesabı açıldı; panelde **Free / $0 / Current Plan / 25 monthly credits** doğrulandı. Cloud name: `vv2ggaqx`. Mevcut aktif anahtar panelde hazır; gizli anahtar kaynak koduna veya yerel dosyaya alınmadı.
- Cloudinary `ml_default` yükleme önayarı **Signed**. Strict image/video transformations açıldı, uzak image/video fetch kısıtlandı, üç imzasız video işlemi kapatıldı. Kaydedilip sayfa yeniden yüklenerek değerlerin kalıcı olduğu doğrulandı.
- Supabase **OzBirArada** kuruluşu Free olarak oluşturuldu. Kuruluş kimliği: `mtjcoimrolpwvoowsbtd`.
- Yeni proje formu hazır: ad `ozbirarada`, bölge `Central EU (Frankfurt)`, Data API açık, otomatik yeni tablo izinleri kapalı, otomatik RLS açık.
- **Beklenen kullanıcı adımı:** Database password alanına güçlü parolayı kullanıcı girip güvenli biçimde kaydetmeli ve Create new project düğmesine kendisi basmalı. Proje henüz oluşmadı; parola istenmedi veya okunmadı.
- Yerel, Git tarafından yok sayılan `.env.local` yalnızca herkese açık Cloudinary adını ve giriş yöntemini içeriyor. Supabase URL/publishable anahtar eklenmediği için canlı hesap bağlantısı henüz etkin değil.

## Proje oluşunca devam

1. Gerçek proje referansını panelden al; üç SQL migration'ını sırayla uygula.
2. `supabase/MEDIA.md` içindeki Edge Function, gizli ayarlar ve saatlik temizlik işini kur. Cloudinary sırrı sadece sunucu ayarına gider.
3. Google OAuth istemcisini gerçek Supabase callback'i ile bağla.
4. Cloudflare Pages Free üzerinde üretim barındırmasını hazırla. GitHub Pages tasarım önizlemesi kalır. Henüz Cloudflare hesabı/projesi oluşturulmadı.
5. Üretim public değişkenleriyle build al; gerçek hesap/fotoğraf/ilan/mesaj ve temizlik testlerini yap. Henüz gerçek sağlayıcılı yükleme yapılmadı.

Hiçbir kart, ücretli plan veya ödeme açılmadı. Bu kayıt canlıya çıkış tamamlandı anlamına gelmez.
