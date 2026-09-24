# OzBirArada — geliştirme devri (24 Eylül 2026, akşam)

## Kaynak ve çalışma dizini

- Git deposu: https://github.com/dracarysbae/ozilan — `main`.
- Bu bilgisayarda depo: `E:\uygulamalar\ozbirarada`.
- Next.js uygulaması: deponun **`ozilan/`** alt dizini. Komutları burada çalıştır.
- Sunucu kodu, migration ve RLS kuralları: `supabase/`. Tek seferlik canlı işlemler: `supabase/ops/`.

```sh
git clone https://github.com/dracarysbae/ozilan.git
cd ozilan/ozilan
npm ci
npm test
npm run lint
npm run check:media
npm run dev
```

Node.js 22. `.env.local`, sağlayıcı sırları, node_modules ve derleme çıktıları Git'e girmez. Sunucu sırları yalnızca sağlayıcının gizli ayarlarında kalır.

## Canlı ortamın 24 Eylül'deki gerçek durumu (panelden doğrulandı)

| Başlık | Durum |
|---|---|
| Supabase projesi | Ücretsiz planda hareketsizlikten **duraklatılmıştı**; ücretsiz "Resume" ile yeniden açıldı. Tekrarını önlemek için `.github/workflows/supabase-keepalive.yml` eklendi (repo değişkenleri gerekli, aşağıda). |
| Google ile giriş | Supabase'de Google sağlayıcısı **açık**. 14 Eylül'de bir Google hesabıyla gerçek giriş yapılmış (auth.identities). Canlı sitede buton Google hesap seçme ekranına doğru callback (`…supabase.co/auth/v1/callback`), dönüş (`/giris/`) ve yalnız `email profile` kapsamıyla gidiyor. Bu turda uçtan uca giriş yapılmadı. |
| URL ayarları | Site URL `https://ozbirarada.pages.dev`, redirect `https://ozbirarada.pages.dev/giris/`. |
| Cloudinary yükleme | 14 Eylül'de gerçek bir yükleme `ready` durumuna gelmiş (ilana bağlanmamış). Yükleme hattı canlıda en az bir kez çalışmış demektir. |
| Migration | 1–3 önceden uygulanmış; **4 ve 5 (`202609240001`, `202609240002`) bu turda uygulandı** ve fonksiyon/izin/constraint sorgularıyla doğrulandı. |
| listing-media | Yayındaki kod 14 Eylül sürümüyle birebir aynıydı (FNV 2364886954). Bu turda yeni sürüm yayımlandı (FNV 4137026485, `a43f51d` ile aynı). |
| Saatlik temizlik | `listing-media-cleanup` Cron işi (`17 * * * *`) aktif. Anahtar Vault'ta üretildi, kimseye gösterilmedi. Doğru anahtar 200, yanlış anahtar 401 döndü. İlk çalıştırma 14 Eylül'den kalan bağlantısız test fotoğrafını sildi. |
| Cloudflare Pages | `https://ozbirarada.pages.dev` üretim dağıtımı **7d0e6aee** (24 Eylül), kaynak `459a387` (+ `a43f51d` yalnız Edge Function değişikliği). Önceki 1227284b (14 Eylül). |
| GitHub Pages | Tasarım önizlemesi. Bu turun commit'leri buluttan push edilemedi (aşağıda). |

## Bu turda eklenenler

- **Hesap silme**: Hesap ekranında onay metinli kalıcı silme. Giriş kimliği, profil adı, favoriler, kayıtlı aramalar, şikâyetler silinir; kimsenin yazışmadığı ilanlar silinir; görüşülen ilanlar içeriği temizlenmiş olarak yayından kalkar; gönderilen mesaj metni kaldırılır. Silinmiş hesabın hâlâ geçerli token'ı yazamaz (RLS + `active_member()`).
- **Tekrar denemeye dayanıklı kayıt**: İlan ve mesaj istemcide seçilen id ile yazılır; bağlantı kopup yeniden denenirse çift ilan/mesaj oluşmaz.
- **Gerçek "yeni mesaj" işareti**: Menüdeki sayı artık tüm görüşme sayısı değil, karşı taraftan gelip bu cihazda açılmamış görüşmeler. Okundu bilgisi karşı tarafa gönderilmez.
- **Cihazda ilan taslağı**: Üye kimliğine bağlı, 14 gün; fotoğraflar 20 saat sonra taslaktan düşer (sunucu temizliğiyle çakışmaz).
- **Alan bazlı ilan alanları**: Alışveriş, Çiçek & hediye, Yerel hizmetler, Freelance için zorunlu/öne çıkan alanlar ve alana uygun ilk mesaj; çiçekte tercih günü ve kart notu mesaja eklenir (teslim sözü yok).
- **listing-media hata düzeltmesi**: Dönüşsüz RPC'lerin boş 204 yanıtı hata sayılıyordu; üye fotoğraf silmesi ve temizlik "başarısız" görünüyordu. Canlıda ilk temizlikte yakalandı, düzeltildi ve yeniden yayımlandı.
- Gizlilik sayfasına hesap silme ve eksik işletmeci bilgisi açıkça eklendi.

## Doğrulama (24 Eylül 2026, Node 22.22)

- `npm test`: **34/34** (başlangıç tabanı 27/27).
- `npm run lint` (TypeScript denetimi, ESLint değil): başarılı. `npm run check:media`: başarılı.
- Önizleme build'i (`/ozilan`, backend boş) ve üretim build'i (boş base path, public Supabase/Cloudinary değişkenleri): 16 sayfa, 220 yerel dosya referansı. Üretim çıktısında gizli anahtar veya localhost backend yok.
- Emüle tarayıcı (Chromium): 320/390/430/1440 px × 14 sayfa; yatay taşma yok, konsol hatası ve 404 yok. Kategori sahneleri 7 panel, kartların 3D girişi ve düzleşmesi, hero paralaks değişkenleri, Vasıta → filtre → ilan → geri (filtreler URL'de korunuyor), favori/karşılaştır düğmeleri ilana gitmiyor. Fiziksel telefon testi değildir.
- Canlı: 13 alt sayfa doğrudan açılış 200, olmayan sayfa 404, 13 JS/CSS dosyası 200, Supabase okuma istekleri 200, konsol hatası yok.

## Hareket tercihi hakkında not

`Motion.tsx` işletim sisteminin "hareketi azalt" ayarını yalnız ipucu sayar; efektler, kullanıcı sitedeki **Hareket** düğmesiyle kapatmadıkça açıktır. Bu, Windows "animasyon efektleri kapalı" ayarı yüzünden efektlerin kaybolmasını önlemek için bilinçli bir karar. Değiştirilmedi.

## Push ve kullanıcıdan beklenenler

- Bulut çalışma alanının `dracarysbae/ozilan` için yazma yetkisi yok. Commit'ler `ozbirarada-24eylul.bundle` olarak yerel depoya bırakıldı; `git pull` + `git push` ile gönderilmeli.
- Keepalive için GitHub → Settings → Secrets and variables → Actions → **Variables**: `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` (üretim build'indeki public değerler). Eklenmezse iş uyarı verip atlar.

## Açık kalanlar (öncelik sırasıyla)

1. İki gerçek Google hesabıyla uçtan uca kabul: giriş → fotoğraflı ilan → diğer hesaptan bulma → mesaj/teklif → yanıt → favori/kayıtlı arama → düzenleme → yayından kaldırma → hesap silme. Test ilanları "TEST" olarak işaretlenmeli.
2. İşletmeci unvanı, adresi ve veri talebi iletişimi (gizlilik sayfası şu an eksik olduğunu açıkça söylüyor).
3. Supabase'de "Email" sağlayıcısı da açık; arayüz yalnız Google kullanıyor. Varsayılan SMTP herkese açık kayıt için uygun değil — kullanılmayacaksa kapatılması önerilir (panel ayarı, onay gerekir).
4. Sunucu tarafı sayfalama (şu an 1000 ilan / 200 görüşme / 1000 mesaj sınırı), mesaj geçmişini parça parça yükleme.
5. Supabase projesi yeniden duraklarsa: Dashboard → Resume (ücretsiz). Keepalive değişkenleri eklendikten sonra beklenmez.
