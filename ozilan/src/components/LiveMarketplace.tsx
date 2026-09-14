"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import {MARKET_AREAS,areaFor,isGoods,readMarketFilters,marketSearchHref} from "@/data/marketplace";
import {categorySlug} from "@/lib/publish-categories";
import {useStore} from "@/lib/store";
import {ListingImage} from "./ListingImage";
import {MarketplaceArt} from "./MarketplaceArt";
import {ScrollExperience} from "./ScrollExperience";
import {tl} from "@/lib/format";

export function LiveMarketplace(){
  const params=useSearchParams(),area=areaFor(params.get("alan"));
  return <Catalog key={params.toString()} area={area} initial={readMarketFilters(params)}/>;
}
function Catalog({area,initial}:{area:ReturnType<typeof areaFor>;initial:ReturnType<typeof readMarketFilters>}){
  const {pool,sellers,ready,toggleFav,isFav,refresh,busy,saveSearch,state}=useStore(),goods=isGoods(area.id);
  const [query,setQuery]=useState(initial.query),[category,setCategory]=useState(initial.category),[city,setCity]=useState(initial.city),[max,setMax]=useState(initial.max),[sort,setSort]=useState(initial.sort==="curated"?"new":initial.sort),[saved,setSaved]=useState(false);
  const [limit,setLimit]=useState(24),[shareLink,setShareLink]=useState(""),[copied,setCopied]=useState(false);
  useEffect(()=>{setLimit(24);setShareLink("");setCopied(false);},[query,category,city,max,sort,saved]);
  const searchHref=marketSearchHref({area:area.id,query,category,city,max,sort:sort==="price-up"||sort==="price-down"?sort:"curated",fast:false});
  const searchSaved=state.searches.some(s=>s.href===searchHref);
  async function shareSearch(){
    const url=`${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH??""}${searchHref}`;
    setShareLink(url);
    try{await navigator.clipboard.writeText(url);setCopied(true);}catch{setCopied(false);}
  }
  const available=useMemo(()=>pool.filter(l=>l.cat===area.id&&l.status==="active"),[pool,area.id]);
  const cities=useMemo(()=>[...new Set(available.map(l=>l.city))].sort((a,b)=>a.localeCompare(b,"tr")),[available]);
  const results=useMemo(()=>available.filter(l=>(!category||l.sub===categorySlug(category))&&(!city||l.city===city)&&(!max||l.price<=Number(max))&&(!saved||isFav(l.id))&&query.trim().toLocaleLowerCase("tr").split(/\s+/).every(word=>`${l.title} ${l.desc} ${sellers[l.sellerId]?.name??""}`.toLocaleLowerCase("tr").includes(word))).sort((a,b)=>sort==="price-up"?a.price-b.price:sort==="price-down"?b.price-a.price:b.bumpedAt-a.bumpedAt),[available,category,city,max,saved,isFav,query,sellers,sort]);
  const clear=()=>{setQuery("");setCategory("");setCity("");setMax("");setSaved(false);setSort("new");};
  return <div className={`market-hub market-${area.id}`}><ScrollExperience/>
    <div className="market-utility"><Link href="/">← OzBirArada ana sayfa</Link><div><Link href="/favorilerim/">Favorilerim</Link><Link href="/mesajlar/">Görüşmelerim</Link><Link href="/ilan-ver/">{goods?"Ürününü yayınla":"Hizmetini yayınla"} ↗</Link></div></div>
    <nav className="market-sector-nav" aria-label="Keşif alanları">{MARKET_AREAS.map(a=><Link key={a.id} href={`/kesfet/?alan=${a.id}`} aria-current={a.id===area.id?"page":undefined}>{a.label}</Link>)}<Link href="/vasita/">Vasıta ↗</Link><Link href="/arama/?k=emlak">Emlak ↗</Link><Link href="/akis/">İkinci el ↗</Link></nav>
    <section className="market-hero"><div><p className="market-eyebrow">{area.eyebrow}</p><h1>{area.title}</h1><p>{goods?"Gerçek ürünleri keşfet, favorilerine ekle ve sipariş detaylarını doğrudan satıcıyla görüş.":"Uzmanlıkları karşılaştır, ihtiyacını anlat ve hizmet sağlayıcıyla kapsamı birlikte netleştir."}</p><div className="market-hero-actions"><a href="#market-results">{goods?"Ürünleri keşfet":"Hizmetleri keşfet"} ↓</a><Link href="/ilan-ver/">İlan oluştur ↗</Link></div></div><div className="market-hero-art" aria-hidden="true"><span className="market-orbit"/><MarketplaceArt art={area.art}/><span className="market-hero-signature">KEŞİFTEN BAĞLANTIYA</span></div></section>
    <section id="market-results" className="market-results" aria-label="Keşif sonuçları"><div className="market-result-heading"><div><p className="market-eyebrow">SANA GÖRE ŞEKİLLENSİN</p><h2>{goods?"Aradığın, burada olsun.":"İşine uygun uzmanlık."}</h2></div><span aria-live="polite">{ready?`${results.length} ilan`:"Yükleniyor…"}</span></div>
      <div className="market-filter-shell"><div className="market-search-row"><label><span>{goods?"Ürün ara":"Hizmet veya uzman ara"}</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={goods?"Ürün adı, özellik…":"Tasarım, montaj, yazılım…"}/></label><label><span>Sıralama</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="new">En yeni ilanlar</option><option value="price-up">Fiyat: düşükten yükseğe</option><option value="price-down">Fiyat: yüksekten düşüğe</option></select></label></div>
      <div className="market-category-pills" role="group" aria-label="Alt kategori"><button aria-pressed={!category} onClick={()=>setCategory("")}>Tümü</button>{area.categories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      <div className="market-extra-filters"><label>Şehir<select value={city} onChange={e=>setCity(e.target.value)}><option value="">Tüm şehirler</option>{cities.map(c=><option key={c}>{c}</option>)}</select></label><label>En yüksek fiyat<input type="number" min={0} value={max} onChange={e=>setMax(e.target.value)} placeholder="TL"/></label><label className="market-check"><input type="checkbox" checked={saved} onChange={e=>setSaved(e.target.checked)}/>Favorilerim</label><button className="market-reset" onClick={clear}>Sıfırla</button><button className="market-reset" disabled={busy} onClick={()=>void refresh()}>Yenile ↻</button></div></div>
      <div className="market-share-search"><button type="button" onClick={()=>void shareSearch()}>{copied?"Bağlantı kopyalandı ✓":"Arama bağlantısını kopyala ↗"}</button><button type="button" disabled={searchSaved} onClick={()=>void saveSearch(`${area.label}: ${query||category||"Tümü"}`,searchHref)}>{searchSaved?"Arama kaydedildi ✓":"Aramayı hesabıma kaydet"}</button><span>Favorilerin paylaşılan bağlantıya eklenmez.</span>{shareLink&&<label>Arama bağlantısı<input readOnly value={shareLink} onFocus={e=>e.target.select()}/></label>}</div>
      {!results.length?<div className="market-empty"><h3>{available.length?"Bu seçimde eşleşme bulunamadı.":"Bu alanın ilk ilanı senin olsun."}</h3><p>{available.length?"Filtreleri genişleterek yeniden arayabilirsin.":"Ürününü veya hizmetini gerçek fotoğraflarıyla paylaş; ilgilenenler sana buradan ulaşsın."}</p>{available.length?<button className="market-primary" onClick={clear}>Filtreleri temizle</button>:<Link className="market-primary" href="/ilan-ver/">İlk ilanı oluştur →</Link>}</div>:<div className={`market-catalog ${goods?"catalog-goods":"catalog-expertise"}`}>{results.slice(0,limit).map(l=><article key={l.id} className="market-item"><div className="market-item-art"><Link href={`/ilan/?id=${l.id}`}><ListingImage listing={l} className="aspect-[4/3] w-full"/></Link><button className="market-save" onClick={()=>void toggleFav(l.id)} aria-label={`${l.title} ${isFav(l.id)?"favorilerden çıkar":"favorilere ekle"}`} aria-pressed={isFav(l.id)}>{isFav(l.id)?"♥":"♡"}</button><span>{area.categories.find(c=>categorySlug(c)===l.sub)??l.sub}</span></div><div className="market-item-body"><p className="market-provider">{sellers[l.sellerId]?.name??"Üye"} · {l.city}</p><Link href={`/ilan/?id=${l.id}`} className="market-item-title"><h3>{l.title}</h3></Link><div className="market-item-tags"><span>{l.deal}</span><span>{l.district}</span></div><div className="market-item-footer"><div>{!goods&&<small>İlan edilen kapsam</small>}<strong>{tl(l.price)}</strong></div><Link href={`/ilan/?id=${l.id}`} aria-label={`${l.title} detaylarını aç`}>↗</Link></div></div></article>)}</div>}
      {results.length>limit&&<button className="resale-more" onClick={()=>setLimit(n=>n+24)}>Daha fazla ilan göster ＋</button>}
      <div className="market-how"><p className="market-eyebrow">NASIL İLERLERSİN?</p><div>{["İlanları karşılaştır","Detayları incele","Sahibiyle görüş"].map((s,i)=><p key={s}><span>0{i+1}</span>{s}</p>)}</div><p>Bu aşamada platformda ödeme alınmıyor. Fiyat, stok, teslimat ve hizmet kapsamını görüşmede netleştirebilirsin.</p></div>
    </section></div>;
}
