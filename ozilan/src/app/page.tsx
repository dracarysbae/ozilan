"use client";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Omnibox } from "@/components/Omnibox";
import { ListingCard } from "@/components/ListingCard";
import { Reveal, Tilt } from "@/components/Motion";
import { useStore } from "@/lib/store";
import { readMarket } from "@/lib/market";
import { CATEGORIES } from "@/data/taxonomy";
import { CITIES } from "@/data/geo";
import { num } from "@/lib/format";

const WORLDS = [
  { slug: "emlak", name: "Emlak", title: "Yeni bir hayatın\nbaşladığı yer.", detail: "Konut, iş yeri ve arsa", caption: "Yaşam alanlarına farklı bak.", query: "Kadıköy kiralık 2+1", number: "01", tone: "home" },
  { slug: "vasita", name: "Vasıta", title: "Bir sonraki\nyolculuğun.", detail: "Otomobil, motosiklet ve daha fazlası", caption: "Yola çıkmak için bir neden.", query: "2018 üzeri otomatik Volkswagen", number: "02", tone: "drive" },
  { slug: "ikinci-el", name: "İkinci el", title: "İyi şeylere\nyeni bir hikâye.", detail: "Teknoloji, yaşam ve tasarım", caption: "Keşfet. Yeniden değer ver.", query: "sıfır garantili iPhone", number: "03", tone: "objects" },
];

/* Özgün vitrin çizimleri: örnek ilan fotoğrafı olarak sunulmaz. */
function Scene({ type }: { type: number }) {
  const id = useId().replace(/:/g, "");
  const fill = (name: string) => `url(#${id}-${name})`;
  return <svg viewBox="0 0 640 440" className="editorial-scene" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0.6" y2="1"><stop stopColor="#edf4ff" /><stop offset=".38" stopColor="#879caf" /><stop offset=".62" stopColor="#e2edf3" /><stop offset="1" stopColor="#263a51" /></linearGradient>
      <linearGradient id={`${id}-stone`} x2="1" y2="1"><stop stopColor="#f3e9d9" /><stop offset="1" stopColor="#889ba6" /></linearGradient>
      <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#afdbed" /><stop offset=".42" stopColor="#294557" /><stop offset="1" stopColor="#0b1c2b" /></linearGradient>
      <linearGradient id={`${id}-warm`} x2="1" y2="1"><stop stopColor="#ffe4b9" /><stop offset="1" stopColor="#bb9470" /></linearGradient>
      <radialGradient id={`${id}-floor`}><stop stopColor="#a9c4e2" stopOpacity=".25" /><stop offset="1" stopColor="#a9c4e2" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="320" cy="363" rx="305" ry="66" fill={fill("floor")} />
    {type === 0 ? <g className="scene-object">
      <path d="M82 317L313 224 564 326 329 420Z" fill="#102536" stroke="#6594ad" strokeOpacity=".3" />
      <path d="M138 177L328 109 525 177 331 255Z" fill={fill("stone")} />
      <path d="M138 177V298L331 373V255Z" fill="#b7bcb4" />
      <path d="M331 255L525 177V292L331 373Z" fill="#456273" />
      <path d="M153 200L311 260V346L153 286Z" fill={fill("warm")} />
      <path d="M352 263L508 201V285L352 347Z" fill={fill("glass")} />
      <path d="M211 222V307M266 243V328M406 242V326M457 222V306" stroke="#263947" strokeWidth="7" />
      <path d="M137 176L329 244 527 168V185L330 262 137 193Z" fill="#d4d4c7" />
      <path d="M247 146V89L350 53 460 93V151L350 194Z" fill={fill("stone")} />
      <path d="M350 194V132L460 93V151Z" fill="#536e7b" />
      <path d="M271 103L331 123V163L271 142Z" fill={fill("glass")} /><path d="M367 137L439 110V145L367 175Z" fill={fill("glass")} />
      <path d="M246 89L350 50 463 90 350 132Z" fill="#edf0e6" />
      <path d="M186 320L327 375 448 326M207 337L329 385 429 343" fill="none" stroke="#8a9e9c" strokeWidth="4" />
      <path d="M102 318V254M548 318V245" stroke="#877c65" strokeWidth="5" /><ellipse cx="102" cy="245" rx="29" ry="39" fill="#476d63" /><ellipse cx="548" cy="237" rx="25" ry="42" fill="#466a62" />
      <path d="M354 270L506 209" stroke="#d4f2ff" strokeOpacity=".8" /><path d="M165 282L309 337" stroke="#ffd5a4" strokeWidth="3" />
    </g> : type === 1 ? <g className="scene-object">
      <ellipse cx="322" cy="340" rx="242" ry="28" fill="#020713" fillOpacity=".5" />
      <path d="M92 266L117 222 214 202 277 138Q296 123 338 128L424 143 494 209 547 229Q566 241 556 293L515 310H126Q88 303 92 266Z" fill={fill("metal")} stroke="#a3b9cf" strokeWidth="2" />
      <path d="M223 203L286 145Q303 138 333 142L403 153 456 206Z" fill={fill("glass")} stroke="#e0edf3" strokeOpacity=".5" strokeWidth="3" />
      <path d="M337 143L345 206" stroke="#98aabd" strokeWidth="9" /><path d="M237 217L463 220 477 279H225Z" fill="#627e98" fillOpacity=".25" stroke="#3f5367" />
      {[183, 478].map(x => <g key={x}><circle cx={x} cy="298" r="46" fill="#071320" /><circle cx={x} cy="298" r="32" fill={fill("metal")} /><circle cx={x} cy="298" r="21" fill="#22394f" /><path d={`M${x} 270V326M${x-28} 298H${x+28}M${x-20} 278L${x+20} 318M${x+20} 278L${x-20} 318`} stroke="#b1c5d5" strokeWidth="4" /><circle cx={x} cy="298" r="8" fill="#d9e4eb" /></g>)}
      <path d="M102 253L141 244M514 244L550 255" stroke="#dcf7ff" strokeWidth="7" strokeLinecap="round" /><path d="M252 278H418M265 229H287M374 230H396" stroke="#c7d7e4" strokeWidth="3" strokeLinecap="round" />
      <path d="M124 221Q309 212 489 220" fill="none" stroke="#f1f7ff" strokeWidth="2" />
    </g> : <g className="scene-object">
      <ellipse cx="320" cy="367" rx="172" ry="26" fill="#020713" fillOpacity=".4" />
      <path d="M205 257V204C205 59 430 59 430 204V257" fill="none" stroke="#344a63" strokeWidth="40" />
      <path d="M207 241V201C207 72 426 72 426 201V241" fill="none" stroke={fill("metal")} strokeWidth="25" />
      <path d="M223 208V198C223 88 412 88 412 198V208" fill="none" stroke="#07111d" strokeWidth="13" />
      <g transform="rotate(10 210 280)"><rect x="166" y="215" width="76" height="130" rx="34" fill="#142336" /><rect x="158" y="220" width="57" height="117" rx="26" fill={fill("metal")} /><path d="M172 241V306" stroke="#e0edf3" strokeWidth="3" strokeLinecap="round" /></g>
      <g transform="rotate(-10 426 280)"><rect x="386" y="215" width="76" height="130" rx="34" fill="#142336" /><rect x="412" y="220" width="57" height="117" rx="26" fill={fill("metal")} /><circle cx="442" cy="314" r="3" fill="#8cf3d4" /></g>
      <path d="M277 116Q318 101 360 116" fill="none" stroke="#eaf4ff" strokeOpacity=".75" strokeWidth="3" />
    </g>}
  </svg>;
}

function Arrow() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>; }

export default function Home() {
  const { pool, ready, state } = useStore();
  const [world, setWorld] = useState(0);
  const chosen = WORLDS[world];
  const active = useMemo(() => pool.filter(l => l.status === "active"), [pool]);
  const counts = useMemo(() => CATEGORIES.map(c => active.filter(l => l.cat === c.slug).length), [active]);
  const deals = useMemo(() => ready ? active.filter(l => l.price > 0).map(l => ({ l, m: readMarket(l, pool) })).filter(x => x.m && x.m.confidence !== "low" && x.m.delta < -.15 && x.m.delta > -.45).sort((a,b) => a.m!.delta-b.m!.delta).slice(0,4) : [], [active,pool,ready]);
  const recent = useMemo(() => ready ? state.recent.map(id => pool.find(l => l.id === id)).filter(l => l !== undefined).slice(0,4) : [], [ready,state.recent,pool]);
  return <div className="editorial-home">
    <section className="discovery-hero">
      <div className="discovery-aurora" aria-hidden="true" />
      <div className="discovery-orbit" aria-hidden="true" />
      <div className="discovery-inner">
        <div className="discovery-copy">
          <p className="discovery-eyebrow"><span /> DAHA İYİ BİR KEŞİF</p>
          <h1>Aradığın şey.<br /><span>İçine sinen fiyat.</span></h1>
          <p className="discovery-lead">Yeni bir ev, yeni bir yol, yeni bir başlangıç. Aradığını söyle; seçenekleri ve fiyatlarının piyasadaki yerini birlikte gör.</p>
          <div className="discovery-search"><Omnibox big dark /></div>
          <div className="discovery-prompts"><span>Bir yerden başla</span><Link href={`/arama/?nl=${encodeURIComponent(chosen.query)}`}>{chosen.query}<Arrow /></Link></div>
          <div className="discovery-proof"><span><b>01</b> Cümleyle ara</span><span><b>02</b> Fiyatı karşılaştır</span><span><b>03</b> İnceleyerek seç</span></div>
        </div>
        <div className="discovery-showcase">
          <div className="world-switch" role="group" aria-label="Vitrin kategorisi">
            {WORLDS.map((w,i) => <button key={w.slug} type="button" aria-pressed={world===i} onClick={() => setWorld(i)}>{w.name}</button>)}
          </div>
          <Tilt max={3} className="world-tilt">
            <div className={`world-stage world-${chosen.tone}`}>
              <div className="world-halo" aria-hidden="true" />
              <div className="world-heading"><span>KEŞİF KOLEKSİYONU</span><span>{chosen.number} / 03</span></div>
              <div key={chosen.slug} className="world-content"><h2>{chosen.title}</h2><Scene type={world} /></div>
              <div className="world-caption"><div><small>{chosen.detail}</small><p>{chosen.caption}</p></div><Link href={`/arama/?k=${chosen.slug}`} aria-label={`${chosen.name} ilanlarını keşfet`}><Arrow /></Link></div>
            </div>
          </Tilt>
          <div className="world-note"><span className="world-note-line" /> OzIlan seçkisi <span>•</span> Kategori illüstrasyonu</div>
        </div>
      </div>
      <div className="discovery-bottom"><span><b>{num(active.length)}</b> keşfedilecek örnek ilan</span><span><b>{CITIES.length}</b> şehir</span><span>Fiyat bilgisi, bağlamıyla birlikte.</span><a href="#kesfet">Keşfetmeye başla <span aria-hidden="true">↓</span></a></div>
    </section>

    <section id="kesfet" className="discovery-section">
      <div className="editorial-heading"><div><p className="editorial-kicker">SENİN DÜNYAN</p><h2>Ne arıyorsan,<br className="sm:hidden" /> buradan başla.</h2></div><Link href="/arama/">Tüm ilanlar <Arrow /></Link></div>
      <div className="world-categories">{WORLDS.map((w,i) => <Reveal key={w.slug} once exit={false} kind="up" delay={i*70}><Link href={`/arama/?k=${w.slug}`} className={`category-editorial category-${w.tone}`}><div className="category-top"><span>{w.number}</span><span>{num(counts[i])} ilan</span></div><div className="category-art"><Scene type={i} /></div><div className="category-bottom"><div><h3>{w.name}</h3><p>{w.detail}</p></div><span className="category-arrow"><Arrow /></span></div></Link><div className="category-sublinks">{CATEGORIES[i].subs.slice(0,3).map(s => <Link key={s.slug} href={`/arama/?k=${w.slug}&a=${s.slug}`}>{s.label}</Link>)}</div></Reveal>)}</div>
    </section>

    <section className="decision-section"><div className="decision-inner"><div className="decision-copy"><p className="editorial-kicker">FİYATTAN FAZLASINI GÖR</p><h2>İyi bir karar,<br /><span>iyi bir karşılaştırmayla başlar.</span></h2><p>Bir rakam tek başına her şeyi anlatmaz. Benzer ilanlarla karşılaştır, satıcı bilgilerini incele ve kararını daha bilinçli ver.</p><Link href="/arama/?s=value" className="btn-primary">Piyasayı keşfet <Arrow /></Link></div><div className="decision-panel"><div className="decision-panel-top"><span>Fiyatın piyasadaki yeri</span><span>Örnek analiz</span></div><div className="decision-price"><span>İlan fiyatı</span><strong>3.150.000 <small>TL</small></strong><p><span>↘ %14</span> benzer ilanların ortancasından düşük</p></div><div className="market-visual" aria-label="Örnek fiyat dağılımı"><div className="market-bars" aria-hidden="true">{[12,18,27,39,54,71,85,97,100,94,84,69,52,37,26,16,10,6].map((h,i)=><span key={i} style={{height:`${h}%`}} />)}</div><div className="market-marker"><span>Bu ilan</span></div><div className="market-baseline" /></div><div className="market-axis"><span>Düşük fiyat</span><span>Ortanca <b>3.680.000 TL</b></span><span>Yüksek fiyat</span></div><div className="decision-footnote"><span>34 benzer ilanla karşılaştırıldı</span><p>Örnek hesaplama. Piyasa konumu, ilan kalitesinin veya güvenliğinin garantisi değildir.</p></div></div></div></section>

    <section className="discovery-section"><div className="editorial-heading"><div><p className="editorial-kicker">YENİ GELENLER</p><h2>İlk sen keşfet.</h2></div><Link href="/arama/">Hepsine göz at <Arrow /></Link></div><div className="editorial-listings">{active.slice(0,4).map(l=><ListingCard key={l.id} l={l} pool={pool} />)}</div></section>
    {deals.length>0 && <section className="discovery-section deal-section"><div className="editorial-heading"><div><p className="editorial-kicker">YAKINDAN BAKMAYA DEĞER</p><h2>Piyasanın altında.</h2><p>Benzer ilanlara göre daha düşük fiyatlı seçenekler.</p></div><Link href="/arama/?s=value">Fiyatına göre sırala <Arrow /></Link></div><div className="editorial-listings">{deals.map(({l})=><ListingCard key={l.id} l={l} pool={pool} />)}</div></section>}
    {recent.length>0 && <section className="discovery-section"><div className="editorial-heading"><div><p className="editorial-kicker">KALDIĞIN YERDEN</p><h2>Son baktıkların.</h2></div></div><div className="editorial-listings">{recent.map(l=><ListingCard key={l.id} l={l} pool={pool} />)}</div></section>}
    <section className="discovery-section city-section"><div className="editorial-heading"><div><p className="editorial-kicker">YAKININDA NELER VAR?</p><h2>Şehrini keşfet.</h2></div></div><div className="editorial-cities">{CITIES.map((city,i)=><Link key={city} href={`/arama/?il=${encodeURIComponent(city)}`}><span className="city-index">{String(i+1).padStart(2,"0")}</span><span>{city}</span><span className="city-count">{active.filter(l=>l.city===city).length}<Arrow /></span></Link>)}</div></section>
    <section className="listing-invitation"><div className="invitation-orb" aria-hidden="true" /><div><p className="discovery-eyebrow">YENİ BİR HİKÂYEYE YER AÇ</p><h2>Birinin aradığı,<br /><span>sende olabilir.</span></h2><p>İlanını oluştur. Fiyatını piyasayla karşılaştır.<br />Bir sonraki sahibine ulaş.</p><Link href="/ilan-ver/" className="invitation-button">İlanını oluştur <Arrow /></Link></div><span className="invitation-signature" aria-hidden="true">OzIlan</span></section>
  </div>;
}
