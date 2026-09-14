export type MarketArea = "alisveris" | "cicek-hediye" | "hizmet" | "freelance";
export type MarketArt = "headphones" | "lamp" | "bag" | "watch" | "chair" | "coffee" | "flowers" | "plant" | "gift" | "tools" | "home" | "camera" | "code" | "design" | "words";
export type MarketItem = {
  id: string; area: MarketArea; category: string; title: string; price: number;
  provider: string; city: string; days: number; art: MarketArt; tags: string[];
  description: string; includes: string[];
};
export const MARKET_AREAS = [
  {id:"alisveris" as const,label:"Alışveriş",eyebrow:"GÜNLÜK HAYATA İYİ GELENLER",title:"Küçük bir keşif.\nBüyük bir yenilik.",description:"Teknolojiden evine, stilinden günlük ritüellerine. Seç, karşılaştır, sepetini oluştur.",art:"bag" as const,categories:["Teknoloji","Ev & yaşam","Moda","Kahve & mutfak"]},
  {id:"cicek-hediye" as const,label:"Çiçek & hediye",eyebrow:"BİRİNİN GÜNÜNÜ GÜZELLEŞTİR",title:"Bazen bir çiçek,\nher şeyi anlatır.",description:"Çiçekler, yaşayan hediyeler ve küçük sürprizler. Mesajını ekle, özel gününü seç.",art:"flowers" as const,categories:["Buketler","Saksı bitkileri","Hediye kutuları","Kişiye özel"]},
  {id:"hizmet" as const,label:"Yerel hizmetler",eyebrow:"İYİ BİR UZMANLA DAHA KOLAY",title:"Aklındaki işi,\ndoğru ellere bırak.",description:"Evindeki yenilikten özel gününe kadar. İhtiyacını anlat, sana uygun hizmeti seç.",art:"tools" as const,categories:["Ev & temizlik","Tadilat","Nakliye","Fotoğraf","Özel ders"]},
  {id:"freelance" as const,label:"Freelance",eyebrow:"FİKRİNDEN BİR ADIM İLERİ",title:"Bir fikrin var.\nBirlikte büyütelim.",description:"Tasarım, yazılım, içerik ve dijital işler. Uzmanlıkları incele, proje kapsamını oluştur.",art:"code" as const,categories:["Tasarım","Yazılım","İçerik","Video","Dijital pazarlama"]},
];
export const MARKET_ITEMS: MarketItem[] = [
  {id:"shop-1",area:"alisveris",category:"Teknoloji",title:"Studio kablosuz kulaklık",price:3490,provider:"Form Studio",city:"İstanbul",days:2,art:"headphones",tags:["Kablosuz","32 saat pil"],description:"Günlük odaklanma ve müzik için yumuşak başlıklı, katlanabilir kulaklık konsepti.",includes:["Kulaklık ve taşıma kılıfı","USB-C şarj kablosu","Örnek ürün özellikleri"]},
  {id:"shop-2",area:"alisveris",category:"Ev & yaşam",title:"Halo masa lambası",price:1790,provider:"Yalın Ev",city:"İzmir",days:3,art:"lamp",tags:["Sıcak ışık","Dokunmatik"],description:"Çalışma köşesine yumuşak ışık taşıyan, mat gövdeli masa lambası konsepti.",includes:["Ayarlanabilir ışık seviyesi","Metal gövde","Adaptör"]},
  {id:"shop-3",area:"alisveris",category:"Moda",title:"Günlük şehir çantası",price:1290,provider:"Rota Atelier",city:"İstanbul",days:2,art:"bag",tags:["Su itici","Laptop bölmesi"],description:"İşe giderken ve kısa yolculuklarda günlük eşyalarını bir arada tutan çanta.",includes:["15 inç bilgisayar bölmesi","Ayarlanabilir askı","İç düzenleyici cepler"]},
  {id:"shop-4",area:"alisveris",category:"Teknoloji",title:"Pulse akıllı saat",price:4290,provider:"Form Studio",city:"Ankara",days:1,art:"watch",tags:["AMOLED","Spor modları"],description:"Günlük aktivite takibi ve bildirimler için hazırlanmış örnek saat seçkisi.",includes:["Saat ve silikon kordon","Manyetik şarj kablosu","Bildirim ve aktivite takibi"]},
  {id:"shop-5",area:"alisveris",category:"Ev & yaşam",title:"Curve dinlenme koltuğu",price:8490,provider:"Yalın Ev",city:"Bursa",days:7,art:"chair",tags:["Dokulu kumaş","Ahşap ayak"],description:"Okuma köşesi için yuvarlatılmış hatları ve doğal malzemeleri buluşturan koltuk.",includes:["Tekli koltuk","Çıkarılabilir minder","Montaj yönergesi"]},
  {id:"shop-6",area:"alisveris",category:"Kahve & mutfak",title:"Yavaş sabahlar kahve seti",price:890,provider:"Mola Objects",city:"İzmir",days:2,art:"coffee",tags:["Seramik","2 kişilik"],description:"Sabah ritüelleri için iki fincan ve küçük bir servis tabağından oluşan seçki.",includes:["2 seramik fincan","2 tabak","Hediye ambalajı"]},
  {id:"gift-1",area:"cicek-hediye",category:"Buketler",title:"Pembe bir gün buketi",price:990,provider:"Petal Atelier",city:"İstanbul",days:1,art:"flowers",tags:["Gül & mevsim çiçeği","Not kartı"],description:"Pembe tonların yeşil yapraklarla buluştuğu zarif bir buket tasarımı.",includes:["Mevsime uygun buket","Kişisel not kartı","Koruyucu ambalaj"]},
  {id:"gift-2",area:"cicek-hediye",category:"Saksı bitkileri",title:"Yeşil bir başlangıç",price:690,provider:"Kök & Dal",city:"Ankara",days:2,art:"plant",tags:["Kolay bakım","Seramik saksı"],description:"Yeni bir ev, yeni bir iş veya yalnızca güzel bir gün için yaşayan hediye.",includes:["Saksı bitkisi","Seramik saksı","Bakım kartı"]},
  {id:"gift-3",area:"cicek-hediye",category:"Hediye kutuları",title:"Biraz kendine zaman",price:1490,provider:"Mola Objects",city:"İzmir",days:3,art:"gift",tags:["Mum & fincan","Hediye kutusu"],description:"Yoğun bir güne küçük bir mola vermek için hazırlanmış hediye kutusu.",includes:["Seramik fincan","Kokulu mum","Kişisel mesaj kartı"]},
  {id:"gift-4",area:"cicek-hediye",category:"Buketler",title:"Beyaz orkide aranjmanı",price:1290,provider:"Petal Atelier",city:"İstanbul",days:1,art:"flowers",tags:["Orkide","Sade tasarım"],description:"Kutlamalar ve teşekkürler için açık tonlarda orkide aranjmanı konsepti.",includes:["Orkide aranjmanı","Dekoratif kap","Bakım ve not kartı"]},
  {id:"gift-5",area:"cicek-hediye",category:"Kişiye özel",title:"İlk kahvemiz fincanları",price:790,provider:"Harf Atölyesi",city:"İstanbul",days:5,art:"coffee",tags:["İsim eklenebilir","İkili set"],description:"Kısa bir isim veya mesajla kişiselleştirmek için tasarlanmış fincan seti.",includes:["2 fincan","Mesaja göre kişiselleştirme taslağı","Özel kutu"]},
  {id:"gift-6",area:"cicek-hediye",category:"Saksı bitkileri",title:"Minik orman teraryumu",price:1190,provider:"Kök & Dal",city:"İzmir",days:3,art:"plant",tags:["Cam fanus","Masa üstü"],description:"Çalışma masasında küçük bir doğa köşesi oluşturan bitki aranjmanı.",includes:["Cam fanus","Bitki aranjmanı","Bakım yönergesi"]},
  {id:"service-1",area:"hizmet",category:"Ev & temizlik",title:"Evin için detaylı temizlik",price:1800,provider:"Duru Yaşam Ekibi",city:"İstanbul",days:2,art:"home",tags:["Daire","Kapsama göre teklif"],description:"Oda sayısı, alan ve ihtiyaç duyulan işleri anlatarak bir temizlik talebi hazırlayabilirsin.",includes:["Alan ve ihtiyaç planı","Mutfak ve banyo kapsamı","Tercih edilen gün bilgisi"]},
  {id:"service-2",area:"hizmet",category:"Tadilat",title:"Boya ve küçük ev yenilikleri",price:4500,provider:"Renk Ustası",city:"Ankara",days:4,art:"tools",tags:["Boya","Keşif gerektirir"],description:"Duvar alanı ve mevcut duruma göre boya ve küçük tadilat kapsamı hazırlanır.",includes:["İş kapsamı taslağı","Malzeme tercihleri","Planlanan süre"]},
  {id:"service-3",area:"hizmet",category:"Nakliye",title:"Şehir içi eşya taşıma",price:3200,provider:"Rota Taşıma",city:"İzmir",days:2,art:"bag",tags:["Şehir içi","Eşya listesi"],description:"Taşınacak eşyaları, kat bilgisini ve tercih ettiğin günü talebine ekle.",includes:["Eşya listesine göre plan","Paketleme tercihi","Taşıma günü taslağı"]},
  {id:"service-4",area:"hizmet",category:"Fotoğraf",title:"Doğal ışıkta portre çekimi",price:2400,provider:"Deniz Fotoğraf",city:"İstanbul",days:3,art:"camera",tags:["Portre","1 saatlik çekim"],description:"Kişisel portre veya profesyonel profil için konum ve çekim tarzını birlikte planla.",includes:["1 saatlik çekim kapsamı","10 düzenlenmiş kare","Konum planı"]},
  {id:"service-5",area:"hizmet",category:"Özel ders",title:"Birebir İngilizce konuşma",price:650,provider:"Ece Dil Atölyesi",city:"Ankara",days:1,art:"words",tags:["Çevrim içi","60 dakika"],description:"Seviyeni ve hedefini belirterek konuşma pratiği için ders talebi oluştur.",includes:["Seviye ve hedef planı","60 dakika ders kapsamı","Çalışma notları"]},
  {id:"service-6",area:"hizmet",category:"Tadilat",title:"Mobilya montaj ve düzenleme",price:950,provider:"Atölye 24",city:"İzmir",days:1,art:"tools",tags:["Montaj","Küçük onarım"],description:"Mobilya modelini ve yapılmasını istediğin işleri seçerek montaj talebini hazırla.",includes:["Mobilya listesi","Montaj kapsamı","Uygun zaman aralığı"]},
  {id:"pro-1",area:"freelance",category:"Tasarım",title:"Markana bir görsel kimlik",price:6500,provider:"Ada Tasarım",city:"Uzaktan",days:7,art:"design",tags:["Logo","Figma","2 revizyon"],description:"Markanın kişiliğini logo, renk ve tipografiyle tutarlı bir kimliğe dönüştürmek için örnek hizmet paketi.",includes:["2 tasarım yönü","Logo ve renk paleti","Mini marka kılavuzu"]},
  {id:"pro-2",area:"freelance",category:"Yazılım",title:"Ürününe özel web arayüzü",price:12000,provider:"Mert Web Studio",city:"Uzaktan",days:14,art:"code",tags:["React","Next.js","Responsive"],description:"Yeni ürün fikrin için ekranları, etkileşimleri ve teslim kapsamını birlikte tanımla.",includes:["5 sayfalık arayüz kapsamı","Mobil uyarlama","Kaynak kod teslim planı"]},
  {id:"pro-3",area:"freelance",category:"İçerik",title:"Hikâyeni anlatan metinler",price:2500,provider:"Selin İçerik",city:"Uzaktan",days:4,art:"words",tags:["Marka dili","Web metni"],description:"Hedef kitlene uygun, açık ve tutarlı bir anlatım için içerik projesi oluştur.",includes:["Marka dili çalışması","3 sayfalık metin","1 revizyon turu"]},
  {id:"pro-4",area:"freelance",category:"Video",title:"Ürünün için kısa tanıtım",price:4800,provider:"Kare Motion",city:"Uzaktan",days:6,art:"camera",tags:["Motion","30 saniye"],description:"Ürün görsellerini ve mesajını kısa bir tanıtım videosuna dönüştürecek proje kapsamı.",includes:["30 saniyelik kurgu","Dikey ve yatay çıktı planı","2 revizyon turu"]},
  {id:"pro-5",area:"freelance",category:"Dijital pazarlama",title:"Sosyal medya içerik planı",price:3900,provider:"Denge Digital",city:"Uzaktan",days:5,art:"design",tags:["Strateji","İçerik takvimi"],description:"Markanın hedeflerine göre bir aylık içerik ve yayın planı oluştur.",includes:["12 paylaşım fikri","Yayın takvimi","Ölçüm önerileri"]},
  {id:"pro-6",area:"freelance",category:"Yazılım",title:"Mobil uygulama prototipi",price:8500,provider:"Piksel Lab",city:"Uzaktan",days:10,art:"code",tags:["Figma","UX","8 ekran"],description:"Fikrini geliştirmeden önce kullanıcı akışları ve tıklanabilir ekranlarla sınayacağın tasarım hizmeti.",includes:["Kullanıcı akışı","8 ekranlık prototip","Tasarım dosyası"]},
];
export const areaFor=(id:string|null)=>MARKET_AREAS.find(a=>a.id===id)??MARKET_AREAS[0];
export const marketMoney=(value:number)=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(value);
export const isGoods=(area:MarketArea)=>area==="alisveris"||area==="cicek-hediye";
export type MarketFilters={area:MarketArea;category:string;query:string;city:string;max:string;sort:string;fast:boolean};
/** Accept only filters that belong to this area, including when opening shared links. */
export function readMarketFilters(params:Pick<URLSearchParams,"get">):MarketFilters {
  const area=areaFor(params.get("alan"));
  const category=params.get("kategori")??"",city=params.get("il")??"",max=params.get("max")??"",sort=params.get("s")??"";
  return {area:area.id,category:area.categories.includes(category)?category:"",query:(params.get("q")??"").trim().slice(0,200),
    city:MARKET_ITEMS.some(item=>item.area===area.id&&item.city===city)?city:"",
    max:max.trim()!==""&&Number.isFinite(Number(max))&&Number(max)>=0?String(Number(max)):"",
    sort:["price-up","price-down","fast"].includes(sort)?sort:"curated",fast:params.get("fast")==="1"};
}
export function marketSearchHref(filters:Partial<MarketFilters>&{area:MarketArea}) {
  const params=new URLSearchParams({alan:filters.area});
  for(const [key,value] of [["kategori",filters.category],["q",filters.query],["il",filters.city],["max",filters.max],["s",filters.sort]]) {
    if(value&&value!=="curated")params.set(key!,value);
  }
  if(filters.fast)params.set("fast","1");
  return `/kesfet/?${params.toString()}`;
}
export function filterMarket(items:MarketItem[],filter:{area:MarketArea;category:string;query:string;city:string;max:string;sort:string;fast:boolean}) {
  const clean=(value:string)=>value.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const terms=clean(filter.query.trim()).split(/\s+/).filter(Boolean);
  const result=items.filter(item=>item.area===filter.area&&(!filter.category||item.category===filter.category)&&(!filter.city||item.city===filter.city)&&(!filter.max||item.price<=Number(filter.max))&&(!filter.fast||item.days<=2)&&terms.every(term=>clean(`${item.title} ${item.category} ${item.provider} ${item.tags.join(" ")}`).includes(term)));
  return [...result].sort((a,b)=>filter.sort==="price-up"?a.price-b.price:filter.sort==="price-down"?b.price-a.price:filter.sort==="fast"?a.days-b.days:0);
}
