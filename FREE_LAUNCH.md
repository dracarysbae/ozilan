# Sıfır bütçeyle ilk yayın

14 Eylül 2026'da resmi plan sayfaları kontrol edildi. Ücretli deneme, promosyon kredisi, ödeme kartı veya otomatik ücretli yükseltme kullanılmayacak. Aşağıdakiler henüz kurulmuş hesaplar değil, doğrulanmış başlangıç seçenekleridir.

| Seçenek | Ücretsiz kapsam | Bu projedeki rolü |
|---|---|---|
| Supabase Free | 500 MB veritabanı, 1 GB dosya alanı, 5 GB egress; sosyal giriş dahil | İlan, hesap ve mesaj katmanı; eski fotoğraflara okuma desteği |
| Appwrite Free | 2 GB depolama, 5 GB bant genişliği, 1 veritabanı ve 1 bucket | Alternatif ortak sunucu; mevcut Supabase veri katmanını ve izin testlerini uyarlamak gerekir |
| Cloudflare Pages | Ücretsiz statik barındırma, kart gerektirmeyen başlangıç | Gerçek pazaryeri ön yüzü için önerilen barındırma |
| Cloudinary Image & Video API Free | Kart gerektirmeyen, süreli deneme olmayan 25 kredi; depolama, trafik ve dönüşümler ortak havuzu tüketir | Yeni fotoğraf sağlayıcısı; kod ve yerel testler hazır, canlı hesap/dağıtım bekliyor |
| ImageKit Forever Free | 3 GB dosya alanı, aylık 20 GB trafik | Daha küçük, ayrı kotalı alternatif medya hizmeti |

Supabase ve Appwrite ücretsiz projeleri bir haftalık hareketsizlikten sonra duraklatabilir. Depolama ve trafik sınırsız değildir. Appwrite Free kota aşımında ilgili işlemler kısıtlanır; yeni ücretli kaynak satın alınmaz. Limitlere yaklaşınca ücretli plana geçmek yerine sınırlarla çalışılır ve kullanıcı bilgilendirilir.

Firebase Spark ücretsiz olsa da Cloud Storage artık Blaze/faturalandırma hesabı gerektiriyor. Fotoğraflı ilanlar için sıfır ödeme hesabı koşuluna uygun bütünleşik seçenek sayılmadı.

## Önerilen kurulum

1. Cloudflare Pages Free üzerinde statik ön yüz; ilk yayında sağlayıcının ücretsiz `pages.dev` adresi. Alan adı satın alınmaz.
2. Supabase Free üzerinde PostgreSQL ve Auth. Yeni fotoğraf yüklemeleri Cloudinary bağlantısına geçirildi. Supabase Storage eski fotoğrafları okumak ve temizlemek için korunur.
3. Üyeler için Google ile giriş; yalnızca temel profil ve e-posta kapsamları. SMS, ücretli e-posta sağlayıcısı ve kart kaydı yok. Varsayılan `NEXT_PUBLIC_AUTH_METHOD=google`; e-posta üyeliği SMTP hazır olana kadar açılmaz.

Google ile giriş kodu ve OAuth profil kayıt testi eklendi. Cloudinary ve Supabase ücretsiz hizmet şartları ile GitHub temel profil/e-posta erişimi kullanıcı tarafından onaylandı; iki hizmetin girişi tamamlandı. Cloudinary Free hesabı ve Supabase Free kuruluşu oluştu. Supabase proje parolasının kullanıcı tarafından girilmesi, gerçek Google OAuth istemcisi ve canlı testler bekliyor. Güncel durum: [LIVE_SETUP.md](LIVE_SETUP.md). Hiçbir ücretli kaynak veya ödeme açılmadı.

## Daha fazla ücretsiz fotoğraf

Cloudinary Image & Video API Free planında 1 kredi; 1 GB depolama, 1 GB görsel trafiği veya 1.000 dönüşüme karşılık gelir. Üç kalemin toplamı 25 krediyi aşmamalıdır. Bu, ayrı ayrı 25 GB depolama ve 25 GB trafik hakkı değildir. Depolama mevcut toplam boyuttur; trafik ve dönüşümler son 30 gün üzerinden hesaplanır. Aynı sitedeki Assets/DAM ürününün 30 günlük denemesi bu öneriye dahil değildir.

Örnek kapasite hesabı: 10 GB saklanan fotoğraf + son 30 günde 10 GB görsel trafiği + 5.000 dönüşüm = 25 kredi. Ortalama dosya gerçekten 200 KB olursa 10 GB yaklaşık 50.000 fotoğraf, ilan başına 6 fotoğrafla yaklaşık 8.300 ilan saklar. Bunlar ondalık birimlerle hesaplanan örneklerdir, trafik veya kalite garantisi değildir. 10 GB trafik de aynı boyutta yaklaşık 50.000 fotoğraf aktarımı eder; çok ziyaret edilen bir sitede trafik kotası depolamadan önce dolabilir. Türetilmiş görseller ve yedek sürümler de depolamaya dahildir.

Hazır entegrasyonda fotoğraflar tarayıcıda en fazla 1600 piksel ve 512 KiB WebP olarak hazırlanır. Sunucu doğrulanmış hesap ve kota denetiminden sonra dosyayı Cloudinary'ye kendisi imzalı olarak yükler; API secret tarayıcıya verilmez. Bu proxy yolu Supabase çıkış trafiği de tükettiği için proje genelinde son 30 günde 3 GB yükleme sınırı uygulanır. 10 GB saklama kapasitesi, bir ayda 10 GB ücretsiz yükleme anlamına gelmez. Dosya sahipliği, yayın/silme bağlantısı ve başarısız yükleme temizliği gerçek SQL testlerinde doğrulandı. Zamanlanmış temizlik canlıda ayrıca açılmalı. Ayrıntılar: [medya kurulum rehberi](supabase/MEDIA.md). Tasarım ve hareket kodları değiştirilmedi.

Backblaze B2'nin ücretsiz depolaması incelendi; ilk herkese açık bucket için ödeme geçmişi veya karta küçük bir ödeme şartı nedeniyle bu kullanıcıya kartsız fotoğraf yayını olarak önerilmedi. Cloudflare R2 de kullanım üzerinden faturalandırılan abonelik açılışı istediğinden ücretsiz Pages barındırmayla karıştırılmamalıdır. Publitio destek sayfaları ile güncel fiyat sayfasındaki ücretsiz plan bilgileri çeliştiği için doğrulanmış seçenek olarak listelenmedi.

Medya kaynakları: [Cloudinary ücretsiz plan](https://cloudinary.com/pricing), [Cloudinary ortak kredi hesabı](https://cloudinary.com/documentation/billing_and_plans), [ImageKit planları](https://imagekit.io/plans), [Backblaze public bucket koşulu](https://www.backblaze.com/docs/cloud-storage-create-and-manage-ewc-buckets), [R2 abonelik açılışı](https://developers.cloudflare.com/r2/get-started/).

## Yayın ayarları

Cloudflare Pages projesi seçildiğinde:

- Root directory: `ozilan`
- Build command: `npm ci && npm test && npm run build`
- Output directory: `out`
- Node: 22, `NODE_ENV=production`
- `NEXT_PUBLIC_BASE_PATH` boş (site yeni alan adının kökünde yayınlanır).
- Supabase public URL/publishable anahtar, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` ve `NEXT_PUBLIC_AUTH_METHOD=google` yapılandırılır.
- Auth Site URL ve izin verilen yönlendirme, gerçek atanan site adresiyle `/giris/` olacak şekilde ayarlanır. Google tarafında Supabase panelinin gösterdiği tam callback kullanılır.

Mevcut GitHub Pages adresi tasarım önizlemesidir. GitHub Pages çevrimiçi işletme ve ticari işlem odaklı siteler için kullanılamadığından gerçek üyelik/pazaryeri sürümü oraya yayımlanmayacak. Kaynak kodu GitHub'da kalabilir. Görsel efektleri kaldırmak veya siteyi baştan tasarlamak gerekmez.

Kaynaklar: [Supabase](https://supabase.com/pricing), [Appwrite planı](https://appwrite.io/pricing), [Appwrite kota davranışı](https://appwrite.io/docs/advanced/billing/free), [Cloudflare Pages](https://www.cloudflare.com/products/pages/), [Firebase Storage şartı](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), [GitHub Pages sınırları](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
