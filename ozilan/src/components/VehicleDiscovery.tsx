"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type AttrDef } from "@/data/taxonomy";
import { childrenOf } from "@/data/tree";
import { CITIES, GEO } from "@/data/geo";
import { emptyQuery, queryToParams, runQuery, type Query } from "@/lib/search";
import { useStore } from "@/lib/store";
import { useMotionOK } from "@/components/Motion";
import { ScrollExperience } from "@/components/ScrollExperience";
import { num } from "@/lib/format";

const VEHICLES = CATEGORIES.find(c => c.slug === "vasita")!;
const DESCRIPTIONS = ["Şehirden uzun yola", "Her rotaya hazır", "Özgürlüğün iki tekeri", "Hayatına daha çok yer", "İşinin güçlü ortağı", "Yolun evin olsun", "Ufkun ötesine"];
function VehicleIcon({ index }: { index: number }) {
  return <svg viewBox="0 0 100 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {index === 2 ? <><circle cx="25" cy="45" r="13"/><circle cx="77" cy="45" r="13"/><path d="m25 45 20-23 16 23H25l14-12m22-22h9l7 34M42 23h18l10 12M33 20h17"/></> : index === 6 ? <><path d="M10 39h80L75 53H26L10 39Zm22 0 6-15h28l12 15M48 24V12h13v12M11 58q10-8 20 0t20 0 20 0 20 0"/><path d="M41 31h21"/></> : <><path d={index===0?"M10 43V33l16-4 14-15h24l16 17 10 3v15H10Z":index===1?"M8 45V30l15-4 10-14h40l11 20 8 4v15H8Z":index===4?"M8 45V13h49v34M57 25h20l14 15v9H8M67 28v12h21":index===5?"M9 45V13h66l15 22v14H9Z":"M10 45V19l12-7h47l20 23v14H10Z"}/><circle cx="28" cy="49" r="9" fill="currentColor" fillOpacity=".12"/><circle cx="74" cy="49" r="9" fill="currentColor" fillOpacity=".12"/>{index!==4 && <path d={index===5?"M18 22h20v13H18ZM51 22h17v27M75 24l10 13H75":"M29 29l12-10h20l12 12H29ZM50 20v11M43 39h10"}/>}</>}
  </svg>;
}

export default function VehicleDiscovery() {
  const router = useRouter();
  const motion = useMotionOK();
  const { pool, ready } = useStore();
  const [q, setQ] = useState<Query>(() => ({ ...emptyQuery(), cat: "vasita" }));

  const sub = VEHICLES.subs.find(s => s.slug === q.sub);
  const count = useMemo(() => ready ? runQuery(pool, q).length : 0, [pool,q,ready]);
  const patch = (value: Partial<Query>) => setQ(prev => ({...prev,...value}));
  const range = (key: string, side: 0|1, value: string) => setQ(prev => {
    const next: [number|undefined,number|undefined] = [...(prev.ranges[key] ?? [undefined,undefined])];
    next[side] = value === "" ? undefined : Number(value);
    return {...prev,ranges:{...prev.ranges,[key]:next}};
  });
  const toggle = (key: string, value: string) => setQ(prev => {
    const current = prev.attrs[key] ?? [];
    return {...prev,attrs:{...prev.attrs,[key]:current.includes(value)?current.filter(v=>v!==value):[...current,value]}};
  });
  const invalidPrice = q.min != null && q.max != null && q.min > q.max;
  const invalidRange = Object.entries(q.ranges).find(([, [lo, hi]]) => lo != null && hi != null && lo > hi);
  const error = invalidPrice ? "En düşük fiyat, en yüksek fiyattan büyük olamaz." : invalidRange ? `${sub?.attrs.find(d=>d.key===invalidRange[0])?.label ?? "Aralık"}: başlangıç değeri bitiş değerinden büyük olamaz.` : "";
  const path = q.path ?? [];
  const filterCount = Object.values(q.attrs).reduce((n,a)=>n+a.length,0)+Object.values(q.ranges).filter(v=>v.some(n=>n!=null)).length+[q.city,q.district,q.min,q.max,q.deal].filter(v=>v!=null&&v!=="").length+path.length;
  function renderFacet({ d }: { d: AttrDef }) {
    return d.type === "select" ? <fieldset className="vehicle-facet" key={d.key}><legend>{d.label}</legend><div className="vehicle-pills">{d.options?.map(o=><button type="button" key={o} aria-pressed={(q.attrs[d.key]??[]).includes(o)} onClick={()=>toggle(d.key,o)}>{o}</button>)}</div></fieldset>
      : d.type === "number" ? <fieldset className="vehicle-facet" key={d.key}><legend>{d.label}{d.unit ? ` (${d.unit})` : ""}</legend><div className="vehicle-range"><input aria-label={`${d.label} en az`} type="number" min="0" step="any" inputMode="decimal" placeholder="En az" value={q.ranges[d.key]?.[0]??""} onChange={e=>range(d.key,0,e.target.value)} /><span>—</span><input aria-label={`${d.label} en çok`} type="number" min="0" step="any" inputMode="decimal" placeholder="En çok" value={q.ranges[d.key]?.[1]??""} onChange={e=>range(d.key,1,e.target.value)} /></div></fieldset>
      : d.type === "bool" ? <label className="vehicle-check" key={d.key}><input type="checkbox" checked={(q.attrs[d.key]??[]).includes("Evet")} onChange={()=>toggle(d.key,"Evet")} />{d.label}</label> : null;
  }
  return <div className="vehicle-discovery"><ScrollExperience />
    <section className="vehicle-intro"><div><nav aria-label="Sayfa konumu"><Link href="/">Ana sayfa</Link><span>/</span><span>Vasıta</span></nav><p className="editorial-kicker">YOLCULUK SENİN SEÇİMİNLE BAŞLAR</p><h1>Önce tarzını seç.<br/><span>Sonra yolunu bul.</span></h1><p>Aracını seç, sana uyan özellikleri belirle.<br/>Yalnızca görmek istediğin ilanlarla devam et.</p></div><div className="vehicle-intro-art"><VehicleIcon index={sub?VEHICLES.subs.indexOf(sub):0}/><span>OzBirArada / Vasıta koleksiyonu</span></div></section>
    <div className="vehicle-workspace">
      <section aria-labelledby="vehicle-types"><div className="vehicle-step"><span>01</span><div><h2 id="vehicle-types">Nasıl bir araç arıyorsun?</h2><p>Bir kategori seçerek aramanı şekillendir.</p></div></div><div className="vehicle-type-grid">{VEHICLES.subs.map((s,i)=><button type="button" key={s.slug} aria-pressed={q.sub===s.slug} aria-controls="vehicle-options" onClick={()=>{setQ(prev=>({...prev,sub:s.slug,path:undefined,attrs:{},ranges:{}})); requestAnimationFrame(()=>{const panel=document.getElementById("vehicle-options"); panel?.scrollIntoView({behavior:motion?"smooth":"instant",block:"start"}); panel?.querySelector("h2")?.focus({preventScroll:true});});}}><div className="vehicle-type-top"><span>{String(i+1).padStart(2,"0")}</span><span className="vehicle-selected">{q.sub===s.slug?"✓":"↗"}</span></div><VehicleIcon index={i}/><strong>{s.label}</strong><small>{DESCRIPTIONS[i]}</small><span className="vehicle-type-count">{num(pool.filter(l=>l.status==="active"&&l.cat==="vasita"&&l.sub===s.slug).length)} ilan</span></button>)}</div></section>
      <form id="vehicle-options" className="vehicle-options" onSubmit={e=>{e.preventDefault();if(sub&&!error)router.push(`/arama/?${queryToParams(q).toString()}`);}}>
        <div className="vehicle-step"><span>02</span><div><h2 tabIndex={-1}>Seçenekleri sana uyduralım.</h2><p>{sub?`${sub.label} seçildi. Filtreler isteğe bağlı; birden fazla özellik seçebilirsin.`:"Önce yukarıdan bir araç kategorisi seç."}</p></div>{sub&&<button className="vehicle-reset" type="button" onClick={()=>setQ({...emptyQuery(),cat:"vasita",sub:q.sub})}>Filtreleri temizle</button>}</div>
        {!sub ? <div className="vehicle-empty"><VehicleIcon index={0}/><h3>Doğru araç, doğru başlangıç.</h3><p>Otomobil, SUV, motosiklet veya diğer kategorilerden birini seçtiğinde ilgili marka ve özellikler burada açılacak.</p></div> : <>
          <div className="vehicle-config-header"><span>{sub.label}</span><span>{filterCount ? `${filterCount} seçim etkin` : "Tüm özellikler açık"}</span></div>
          <div className="vehicle-tree">{(sub.treeLabels??[]).map((label,i)=>{const nodes=i===0?sub.tree??[]:path.length>=i?childrenOf(sub.tree??[],path.slice(0,i)):[];return <label key={`${sub.slug}-${i}`}>{label}<select value={path[i]??""} disabled={!nodes.length} onChange={e=>patch({path:e.target.value?[...path.slice(0,i),e.target.value]:path.slice(0,i)})}><option value="">{i>0&&!nodes.length?`Önce ${sub.treeLabels![i-1].toLocaleLowerCase("tr")} seç`:`Tüm ${label.toLocaleLowerCase("tr")} seçenekleri`}</option>{nodes.map(n=><option key={n.slug} value={n.slug}>{n.label}</option>)}</select></label>;})}</div>
          <div className="vehicle-primary-grid"><fieldset className="vehicle-facet"><legend>Bütçe (TL)</legend><div className="vehicle-range"><input aria-label="En düşük fiyat" type="number" min="0" inputMode="numeric" placeholder="En az" value={q.min??""} onChange={e=>patch({min:e.target.value?Number(e.target.value):undefined})}/><span>—</span><input aria-label="En yüksek fiyat" type="number" min="0" inputMode="numeric" placeholder="En çok" value={q.max??""} onChange={e=>patch({max:e.target.value?Number(e.target.value):undefined})}/></div></fieldset><label className="vehicle-facet">Şehir<select value={q.city??""} onChange={e=>patch({city:e.target.value||undefined,district:undefined})}><option value="">Tüm Türkiye</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select></label>{q.city&&<label className="vehicle-facet">İlçe<select value={q.district??""} onChange={e=>patch({district:e.target.value||undefined})}><option value="">Tüm ilçeler</option>{(GEO[q.city]??[]).map(d=><option key={d}>{d}</option>)}</select></label>}{sub.attrs.filter(d=>d.spotlight).map(d=>renderFacet({d}))}</div>
          <fieldset className="vehicle-facet vehicle-deal"><legend>İşlem türü</legend><div className="vehicle-pills"><button type="button" aria-pressed={!q.deal} onClick={()=>patch({deal:undefined})}>Tümü</button>{VEHICLES.dealTypes?.map(d=><button key={d} type="button" aria-pressed={q.deal===d} onClick={()=>patch({deal:d})}>{d}</button>)}</div></fieldset>
          <details className="vehicle-more"><summary><span>Diğer özellikler</span><span>Renk, donanım ve kategoriye özel seçenekler ＋</span></summary><div className="vehicle-primary-grid">{sub.attrs.filter(d=>!d.spotlight).map(d=>renderFacet({d}))}</div></details>
          <div className="vehicle-submit"><div aria-live="polite"><strong>{ready?num(count):"…"} eşleşen ilan</strong><p>{error||(!count&&ready?"Sonuç yok. Daha geniş bir aralık deneyebilirsin.":"Seçimlerini sonuç sayfasında da değiştirebilirsin.")}</p></div><button type="submit" disabled={!!error||!ready}>{count?"İlanları göster":"Sonuçları incele"}<span aria-hidden="true">→</span></button></div>
        </>}
      </form>
    </div>
  </div>;
}
