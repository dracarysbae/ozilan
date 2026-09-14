"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketplaceArt } from "./MarketplaceArt";
import { ScrollExperience } from "./ScrollExperience";
import { MARKET_AREAS, MARKET_ITEMS, areaFor, filterMarket, isGoods, marketMoney, type MarketArea, type MarketItem } from "@/data/marketplace";

type CartLine={id:string;quantity:number;note:string;date:string};
type Draft={id:string;kind:"order"|"request";title:string;description:string;budget:number;at:string;city?:string;date?:string;provider?:string;lines?:CartLine[]};
type LocalMarket={cart:CartLine[];drafts:Draft[];favorites:string[]};
const KEY="ozilan.marketplace.v1";
const EMPTY:LocalMarket={cart:[],drafts:[],favorites:[]};
const findItem=(id:string)=>MARKET_ITEMS.find(item=>item.id===id);
function readLocal():LocalMarket {
  try {
    const value=JSON.parse(localStorage.getItem(KEY)??"null");
    if(!value||typeof value!=="object")return EMPTY;
    return {
      cart:Array.isArray(value.cart)?value.cart.filter((line:CartLine)=>findItem(line.id)&&isGoods(findItem(line.id)!.area)&&Number.isInteger(line.quantity)&&line.quantity>0&&line.quantity<=20&&typeof line.note==="string"&&typeof line.date==="string").slice(0,50):[],
      drafts:Array.isArray(value.drafts)?value.drafts.filter((d:Draft)=>d&&typeof d.id==="string"&&["order","request"].includes(d.kind)&&typeof d.title==="string"&&typeof d.description==="string"&&typeof d.at==="string"&&Number.isFinite(d.budget)).slice(0,50):[],
      favorites:Array.isArray(value.favorites)?value.favorites.filter((id:unknown)=>typeof id==="string"&&findItem(id)).slice(0,100):[],
    };
  }catch{return EMPTY;}
}
function Sheet({open,title,onClose,children,notice,error}:{open:boolean;title:string;onClose:()=>void;children:React.ReactNode;notice?:string;error?:string}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;if(open&&!dialog?.open)dialog?.showModal();else if(!open&&dialog?.open)dialog.close();},[open]);
  return <dialog ref={ref} className="market-dialog" aria-label={title} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="market-dialog-inner"><div className="market-dialog-heading"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Pencereyi kapat">×</button></div>{error?<p className="market-dialog-feedback market-feedback-error" role="alert">{error}</p>:notice?<p className="market-dialog-feedback" role="status">{notice}</p>:null}{children}</div></dialog>;
}

function MarketplaceContent(){
  const params=useSearchParams(),router=useRouter();
  const area=areaFor(params.get("alan"));
  const [category,setCategory]=useState("");
  const [query,setQuery]=useState("");
  const [city,setCity]=useState("");
  const [max,setMax]=useState("");
  const [sort,setSort]=useState("curated");
  const [fast,setFast]=useState(false);
  const [onlySaved,setOnlySaved]=useState(false);
  const [local,setLocal]=useState<LocalMarket>(EMPTY);
  const [ready,setReady]=useState(false);
  const [today,setToday]=useState("");
  const [notice,setNotice]=useState("");
  const [storageError,setStorageError]=useState("");
  const [sheet,setSheet]=useState<"detail"|"cart"|"request"|"drafts"|null>(null);
  const [selected,setSelected]=useState<MarketItem|null>(null);
  const [giftNote,setGiftNote]=useState("");
  const [giftDate,setGiftDate]=useState("");
  const [quantity,setQuantity]=useState(1);
  const [requestArea,setRequestArea]=useState<MarketArea>("hizmet");
  useEffect(()=>{setLocal(readLocal());setReady(true);const d=new Date();setToday(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);},[]);
  useEffect(()=>{setCategory("");setQuery("");setCity("");setMax("");setFast(false);setSort("curated");setOnlySaved(false);setSheet(null);},[area.id]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(""),6000);return()=>clearTimeout(timer);},[notice]);
  const goods=isGoods(area.id);
  const cities=useMemo(()=>[...new Set(MARKET_ITEMS.filter(i=>i.area===area.id).map(i=>i.city))],[area.id]);
  const results=useMemo(()=>filterMarket(MARKET_ITEMS,{area:area.id,category,query,city,max,sort,fast}).filter(i=>!onlySaved||local.favorites.includes(i.id)),[area.id,category,query,city,max,sort,fast,onlySaved,local.favorites]);
  const count=local.cart.reduce((sum,line)=>sum+line.quantity,0);
  const total=local.cart.reduce((sum,line)=>sum+(findItem(line.id)?.price??0)*line.quantity,0);
  function persist(next:LocalMarket){
    if(!ready)return false;
    try{localStorage.setItem(KEY,JSON.stringify(next));setLocal(next);setStorageError("");return true;}
    catch{setStorageError("Tarayıcı depolaması kullanılamıyor. İşlem kaydedilmedi; depolama iznini veya boş alanı kontrol et.");return false;}
  }
  function openDetail(item:MarketItem){setSelected(item);setQuantity(1);setGiftDate("");setGiftNote("");setSheet("detail");}
  function favorite(id:string){const saved=local.favorites.includes(id);if(persist({...local,favorites:saved?local.favorites.filter(x=>x!==id):[...local.favorites,id]}))setNotice(saved?"Kaydedilenlerden çıkarıldı.":"Keşif listene kaydedildi.");}
  function addToCart(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!selected||!isGoods(selected.area))return;
    const form=new FormData(e.currentTarget);
    const requested=Number(form.get("quantity"));
    if(!Number.isInteger(requested)||requested<1||requested>20)return;
    const existing=local.cart.find(line=>line.id===selected.id);
    if((existing?.quantity??0)+requested>20){setNotice("Aynı üründen en fazla 20 adet ekleyebilirsin.");return;}
    const line={id:selected.id,quantity:(existing?.quantity??0)+requested,note:String(form.get("gift-note")??"").trim(),date:String(form.get("gift-date")??"")};
    const cart=existing?local.cart.map(l=>l.id===line.id?line:l):[...local.cart,line];
    if(persist({...local,cart})){setNotice(`${selected.title} sepete eklendi.`);setSheet("cart");}
  }
  function changeQuantity(id:string,quantity:number){persist({...local,cart:quantity===0?local.cart.filter(l=>l.id!==id):local.cart.map(l=>l.id===id?{...l,quantity:Math.min(20,Math.max(1,quantity))}:l)});}
  function startRequest(item:MarketItem|null){setSelected(item);setRequestArea(item?.area??area.id);setSheet("request");}
  function saveRequest(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=new FormData(e.currentTarget);
    const draft:Draft={id:crypto.randomUUID(),kind:"request",title:String(form.get("title")).trim(),description:String(form.get("description")).trim(),budget:Number(form.get("budget")),at:new Date().toISOString(),city:requestArea==="freelance"?"Uzaktan":String(form.get("city")),date:String(form.get("date")??""),provider:selected?.provider};
    if(draft.title.length<3||draft.description.length<20){setNotice("Başlık en az 3, açıklama en az 20 karakter olmalı.");return;}
    if(persist({...local,drafts:[draft,...local.drafts].slice(0,50)})){setSheet("drafts");setNotice("Talep taslağın bu cihazda saklandı. Henüz bir uzmana gönderilmedi.");}
  }
  function saveOrder(){
    if(!local.cart.length)return;
    const draft:Draft={id:crypto.randomUUID(),kind:"order",title:`${count} ürünlü sipariş taslağı`,description:local.cart.map(l=>`${l.quantity} × ${findItem(l.id)!.title}${l.note?` · Not: ${l.note}`:""}${l.date?` · Tercih: ${l.date}`:""}`).join("\n"),budget:total,at:new Date().toISOString(),lines:local.cart.map(l=>({...l}))};
    if(persist({...local,drafts:[draft,...local.drafts].slice(0,50)})){setSheet("drafts");setNotice("Sipariş taslağı saklandı. Ödeme alınmadı ve sipariş verilmedi.");}
  }
  function reset(){setCategory("");setQuery("");setCity("");setMax("");setFast(false);setOnlySaved(false);setSort("curated");}

  return <div className={`market-hub market-${area.id}`}><ScrollExperience/>
    <div className="market-utility"><Link href="/">← OzBirArada ana sayfa</Link><div><button onClick={()=>setSheet("drafts")}>Taslaklar {ready&&local.drafts.length>0&&<span>{local.drafts.length}</span>}</button><button onClick={()=>setSheet("cart")}>Sepetim <span>{ready?count:0}</span></button></div></div>
    <nav className="market-sector-nav" aria-label="Keşif alanları">{MARKET_AREAS.map(a=><Link key={a.id} href={`/kesfet/?alan=${a.id}`} aria-current={a.id===area.id?"page":undefined}>{a.label}</Link>)}<Link href="/vasita/">Vasıta ↗</Link><Link href="/arama/?k=emlak">Emlak ↗</Link><Link href="/akis/">İkinci el akışı ↗</Link></nav>
    <section key={area.id} className="market-hero"><div><p className="market-eyebrow">{area.eyebrow}</p><h1>{area.title}</h1><p>{area.description}</p><div className="market-hero-actions"><a href="#market-results">{goods?"Seçkiyi keşfet":"Uzmanları keşfet"} <span>↓</span></a>{!goods&&<button onClick={()=>startRequest(null)}>{area.id==="freelance"?"Proje oluştur":"İhtiyacını anlat"} ↗</button>}</div><span className="market-demo-label">Keşif sürümü · Örnek {goods?"ürünler":"uzman profilleri"}</span></div><div className="market-hero-art" aria-hidden="true"><span className="market-orbit"/><MarketplaceArt art={area.art}/><span className="market-hero-signature">{area.id==="freelance"?"FİKİRDEN GERÇEĞE":area.id==="hizmet"?"HAYATINI KOLAYLAŞTIR":area.id==="cicek-hediye"?"KÜÇÜK BİR MUTLULUK":"İYİ ŞEYLERİ KEŞFET"}</span></div></section>
    <section id="market-results" className="market-results" aria-label="Keşif sonuçları">
      <div className="market-result-heading"><div><p className="market-eyebrow">SANA GÖRE ŞEKİLLENSİN</p><h2>{goods?"Biraz ilham, bolca seçenek.":"İhtiyacına uygun uzmanlık."}</h2></div><span aria-live="polite">{results.length} {goods?"ürün":"hizmet"}</span></div>
      <div className="market-filter-shell"><div className="market-search-row"><label><span>{goods?"Ürün ara":"Uzmanlık veya hizmet ara"}</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={goods?"Kulaklık, buket, lamba…":"Logo, React, temizlik…"}/></label><label><span>Sıralama</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="curated">OzBirArada seçkisi</option><option value="price-up">Fiyat: düşükten yükseğe</option><option value="price-down">Fiyat: yüksekten düşüğe</option><option value="fast">Süre: kısa olanlar önce</option></select></label></div>
        <div className="market-category-pills" role="group" aria-label="Alt kategori"><button aria-pressed={!category} onClick={()=>setCategory("")}>Tümü</button>{area.categories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="market-secondary-filters"><label><span>{area.id==="hizmet"?"Hizmet şehri":"Konum"}</span><select value={city} onChange={e=>setCity(e.target.value)}><option value="">{area.id==="freelance"?"Tüm uzaktan işler":"Tüm şehirler"}</option>{cities.map(c=><option key={c}>{c}</option>)}</select></label><label><span>En yüksek bütçe (TL)</span><input type="number" min="0" value={max} onChange={e=>setMax(e.target.value)} placeholder="Sınır yok"/></label><label className="market-check"><input type="checkbox" checked={fast} onChange={e=>setFast(e.target.checked)}/>{goods?"2 güne kadar hazırlık":"2 güne kadar süre"}</label><label className="market-check"><input type="checkbox" checked={onlySaved} onChange={e=>setOnlySaved(e.target.checked)}/>Kaydettiklerim</label><button className="market-reset" onClick={reset}>Sıfırla</button></div>
      </div>
      {results.length===0?<div className="market-empty"><span>⌕</span><h3>Bu seçimde henüz bir eşleşme yok.</h3><p>Başka bir kategori seçebilir veya filtreleri genişletebilirsin.</p><button className="market-primary" onClick={reset}>Tüm seçenekleri göster</button></div>:<div className={`market-catalog ${goods?"catalog-goods":"catalog-expertise"}`}>{results.map((item,i)=><article key={item.id} className="market-item" style={{animationDelay:`${Math.min(i,5)*45}ms`}}><div className="market-item-art"><button onClick={()=>openDetail(item)} aria-label={`${item.title} detaylarını incele`}><MarketplaceArt art={item.art}/></button><button className="market-save" disabled={!ready} onClick={()=>favorite(item.id)} aria-label={`${item.title} ${local.favorites.includes(item.id)?"kaydedilenlerden çıkar":"kaydet"}`} aria-pressed={local.favorites.includes(item.id)}>{local.favorites.includes(item.id)?"♥":"♡"}</button><span>{item.category}</span></div><div className="market-item-body"><p className="market-provider">{item.provider} · {item.city}</p><button className="market-item-title" onClick={()=>openDetail(item)}><h3>{item.title}</h3></button><div className="market-item-tags">{item.tags.slice(0,2).map(tag=><span key={tag}>{tag}</span>)}</div><div className="market-item-footer"><div>{!goods&&<small>Başlangıç kapsamı</small>}<strong>{marketMoney(item.price)}</strong><p>{item.days} gün {goods?"hazırlık örneği":"tahmini süre"}</p></div><button onClick={()=>openDetail(item)} aria-label={`${item.title} incele`}>↗</button></div></div></article>)}</div>}
      <div className="market-how"><p className="market-eyebrow">NASIL İLERLERSİN?</p><div>{(goods?["Seçenekleri karşılaştır","Ürününü kişiselleştir","Sepet taslağını sakla"]:["Uzmanlıkları incele","İşin kapsamını anlat","Talep taslağını sakla"]).map((label,i)=><p key={label}><span>0{i+1}</span>{label}</p>)}</div><p>Bu keşif sürümünde ürünler, mağazalar, profiller ve süreler örnektir. {goods?"Ödeme, stok ve teslimat hizmeti henüz bağlı değil.":"Talepler henüz uzmanlara gönderilmiyor."} Taslaklar yalnızca bu tarayıcıda saklanır.</p></div>
    </section>
    {notice&&!sheet&&<div className="market-toast" role="status">{notice}</div>}{storageError&&!sheet&&<div className="market-storage-error" role="alert">{storageError}<button onClick={()=>setStorageError("")}>Kapat</button></div>}
    <Sheet notice={notice} error={storageError} open={sheet==="detail"&&!!selected} title={selected?.title??"Detay"} onClose={()=>setSheet(null)}>{selected&&<><div className={`market-detail-art market-${selected.area}`}><MarketplaceArt art={selected.art}/><small>Kategori illüstrasyonu · Örnek {isGoods(selected.area)?"ürün":"profil"}</small></div><p className="market-provider">{selected.provider} · {selected.city}</p><p className="market-detail-description">{selected.description}</p><ul className="market-includes">{selected.includes.map(s=><li key={s}>✓ {s}</li>)}</ul><div className="market-detail-price"><strong>{marketMoney(selected.price)}</strong><span>{selected.days} gün {isGoods(selected.area)?"örnek hazırlık süresi":"tahmini kapsam süresi"}</span></div>{isGoods(selected.area)?<form onSubmit={addToCart} className="market-form">{selected.area==="cicek-hediye"&&<><label>Hediye notu <small>İsteğe bağlı · en fazla 160 karakter</small><textarea name="gift-note" value={giftNote} onChange={e=>setGiftNote(e.target.value)} maxLength={160} rows={3} placeholder="İyi ki varsın…"/></label><label>Tercih edilen gün <small>Teslimat sözü değildir; taslağına eklenir.</small><input name="gift-date" type="date" min={today} value={giftDate} onChange={e=>setGiftDate(e.target.value)}/></label></>}<label>Adet<input name="quantity" type="number" min="1" max="20" required value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label><button className="market-primary" disabled={!ready}>Sepete ekle · {marketMoney(selected.price*quantity)}</button><p className="market-form-note">Ödeme alınmaz. Sepetin bu tarayıcıda saklanır.</p></form>:<><button className="market-primary market-full" onClick={()=>startRequest(selected)}>Bu uzmanlık için {selected.area==="freelance"?"proje":"talep"} hazırla ↗</button><p className="market-form-note">Örnek profil. Nihai kapsam ve fiyat, gerçek hizmet sağlayıcıyla görüşülerek belirlenir.</p></>}</>}</Sheet>
    <Sheet notice={notice} error={storageError} open={sheet==="cart"} title={`Sepetim · ${count} ürün`} onClose={()=>setSheet(null)}>{!local.cart.length?<div className="market-empty"><h3>Yeni keşiflere yer var.</h3><p>Alışveriş veya hediye seçkisinden bir ürün ekleyebilirsin.</p><button className="market-primary" onClick={()=>{setSheet(null);router.push("/kesfet/?alan=alisveris");}}>Alışverişe dön</button></div>:<><div className="market-cart-list">{local.cart.map(line=>{const item=findItem(line.id)!;return <div className="market-cart-line" key={line.id}><div className={`market-cart-art market-${item.area}`}><MarketplaceArt art={item.art}/></div><div><h3>{item.title}</h3><p>{marketMoney(item.price)}</p>{line.note&&<p className="market-cart-note">Not: {line.note}</p>}{line.date&&<p>Tercih edilen gün: {line.date}</p>}<div className="market-quantity"><button disabled={line.quantity===1} onClick={()=>changeQuantity(line.id,line.quantity-1)} aria-label={`${item.title} adedini azalt`}>−</button><span>{line.quantity}</span><button disabled={line.quantity===20} onClick={()=>changeQuantity(line.id,line.quantity+1)} aria-label={`${item.title} adedini artır`}>+</button><button className="market-remove" onClick={()=>changeQuantity(line.id,0)}>Kaldır</button></div></div><strong>{marketMoney(item.price*line.quantity)}</strong></div>;})}</div><div className="market-cart-total"><span>Ürünler toplamı</span><strong>{marketMoney(total)}</strong></div><p className="market-form-note">Örnek fiyatlar. Kargo ve ödeme hesaplanmaz. Bu işlem sipariş vermez.</p><button className="market-primary market-full" onClick={saveOrder}>Sipariş taslağını sakla</button></>}</Sheet>
    <Sheet notice={notice} error={storageError} open={sheet==="request"} title={requestArea==="freelance"?"Projenin ilk adımı":"İhtiyacını anlatalım"} onClose={()=>setSheet(null)}>{sheet==="request"&&<form className="market-form" onSubmit={saveRequest}><p className="market-form-note">{selected?`${selected.provider} için kapsam hazırlıyorsun.`:"İhtiyacını tanımlayarak bir taslak oluştur."} Bu form henüz kimseye gönderilmez.</p><label>{requestArea==="freelance"?"Proje başlığı":"İşin başlığı"}<input name="title" defaultValue={selected?.title??""} required minLength={3} maxLength={100} placeholder="Ne yapmak istiyorsun?"/></label><label>İhtiyaç ve kapsam<textarea name="description" required minLength={20} maxLength={2000} rows={5} placeholder="Beklediğin sonucu, kapsamı ve önemli detayları anlat. En az 20 karakter."/></label><div className="market-form-columns"><label>Bütçen (TL)<input name="budget" type="number" required min="1" max="1000000000" defaultValue={selected?.price??""}/></label><label>Tercih edilen tarih<input name="date" type="date" min={today}/></label></div>{requestArea!=="freelance"&&<label>Hizmet şehri<select name="city" required defaultValue={selected?.city??""}><option value="" disabled>Şehir seç</option><option>İstanbul</option><option>Ankara</option><option>İzmir</option><option>Bursa</option><option>Antalya</option><option>Diğer şehir</option></select></label>}<button className="market-primary" disabled={!ready}>Talep taslağını sakla</button><p className="market-form-note">Telefon, adres veya ödeme bilgisi gerekli değil. Taslağın yalnızca bu cihazda kalır.</p></form>}</Sheet>
    <Sheet notice={notice} error={storageError} open={sheet==="drafts"} title="Taslaklarım" onClose={()=>setSheet(null)}><p className="market-form-note">Bu cihazda saklanan planların. Siparişler verilmedi, talepler gönderilmedi.</p>{local.drafts.length===0?<div className="market-empty"><h3>İlk fikrine yer aç.</h3><p>Bir sepet veya hizmet talebi hazırladığında burada saklayabilirsin.</p></div>:<div className="market-drafts">{local.drafts.map(d=><details key={d.id}><summary><span>{d.kind==="order"?"SEPET TASLAĞI":"TALEP TASLAĞI"}<strong>{d.title}</strong></span><span>＋</span></summary><p>{d.description}</p>{d.provider&&<p>Örnek uzman: {d.provider}</p>}{d.city&&<p>Konum: {d.city}</p>}{d.date&&<p>Tarih tercihi: {d.date}</p>}<p><strong>{d.kind==="order"?"Ürün toplamı":"Bütçe"}: {marketMoney(d.budget)}</strong></p><button onClick={()=>persist({...local,drafts:local.drafts.filter(x=>x.id!==d.id)})}>Taslağı kaldır</button></details>)}</div>}</Sheet>
  </div>;
}
export default function MarketplaceHub(){return <Suspense fallback={<div className="market-loading">Keşif alanın hazırlanıyor…</div>}><MarketplaceContent/></Suspense>;}
