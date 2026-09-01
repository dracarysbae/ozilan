"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, attrsFor, findSub } from "@/data/taxonomy";
import { GEO, CITIES } from "@/data/geo";
import { useStore } from "@/lib/store";
import { estimate } from "@/lib/market";
import { scoreListing } from "@/lib/trust";
import { Artwork } from "@/components/Artwork";
import { TrustPanel } from "@/components/Trust";
import { num, tl } from "@/lib/format";
import type { AttrValue, Listing } from "@/lib/types";

const STEPS = ["Kategori", "Detaylar", "Fiyat", "Önizleme"];

export default function Compose() {
  const router = useRouter();
  const { pool, publish, me, sellers } = useStore();

  const [step, setStep] = useState(0);
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [deal, setDeal] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [photos, setPhotos] = useState(4);
  const [attrs, setAttrs] = useState<Record<string, AttrValue>>({});
  const [err, setErr] = useState<string[]>([]);

  const defs = cat && sub ? attrsFor(cat, sub) : [];
  const category = CATEGORIES.find((c) => c.slug === cat);

  const draft: Listing = useMemo(() => ({
    id: "__draft__", title: title || "Başlıksız ilan", desc, cat, sub,
    deal: deal || "Satılık", price: typeof price === "number" ? price : 0,
    city: city || "İstanbul", district: district || "—", attrs,
    createdAt: Date.now(), bumpedAt: Date.now(), sellerId: me?.id ?? "anon",
    views: 0, photos, status: "active", art: 424242,
  }), [title, desc, cat, sub, deal, price, city, district, attrs, photos, me]);

  const est = useMemo(
    () => (cat && sub ? estimate({ cat, sub, deal: deal || "Satılık", city: city || "İstanbul", attrs }, pool) : null),
    [cat, sub, deal, city, attrs, pool],
  );

  const trust = useMemo(() => scoreListing(draft, me ? sellers[me.id] : undefined, pool), [draft, me, sellers, pool]);

  const validate = (s: number) => {
    const e: string[] = [];
    if (s >= 0 && (!cat || !sub || !deal)) e.push("Kategori, alt kategori ve işlem türü seçilmeli.");
    if (s >= 1) {
      if (title.trim().length < 10) e.push("Başlık en az 10 karakter olmalı.");
      if (desc.trim().length < 40) e.push("Açıklama en az 40 karakter olmalı.");
      if (!city) e.push("Şehir seçilmeli.");
      for (const d of defs.filter((x) => x.required))
        if (attrs[d.key] === undefined || attrs[d.key] === "") e.push(`${d.label} zorunlu.`);
    }
    if (s >= 2 && deal !== "Ücretsiz" && (price === "" || Number(price) <= 0)) e.push("Geçerli bir fiyat girin.");
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErr(e);
    if (!e.length) setStep((s) => Math.min(3, s + 1));
  };

  const submit = () => {
    const e = validate(2);
    setErr(e);
    if (e.length) return;
    const id = publish({
      title: title.trim(), desc: desc.trim(), cat, sub, deal,
      price: deal === "Ücretsiz" ? 0 : Number(price),
      city, district: district || GEO[city][0], attrs, photos,
      featured: false,
    });
    router.push(`/ilan/?id=${id}`);
  };

  if (!me) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="eyebrow">İlan ver</p>
        <h1 className="mt-2 font-serif text-4xl leading-none">Önce giriş yapmalısın</h1>
        <p className="mt-3 text-mute">İlanlarını yönetebilmen için bir hesaba ihtiyacımız var.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/giris/" className="btn-primary">Giriş yap</Link>
          <Link href="/giris/?mod=kayit" className="btn-ghost">Hesap oluştur</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-6">
      <div className="border-b-4 border-ink pb-3">
        <p className="eyebrow">Yeni ilan</p>
        <h1 className="mt-1 font-serif text-[clamp(1.9rem,3.4vw,3rem)] leading-none">İlanını oluştur</h1>
      </div>

      {/* stepper */}
      <ol className="mt-6 grid grid-cols-4 gap-px bg-line">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button onClick={() => i < step && setStep(i)} disabled={i > step}
              className={`flex w-full items-center gap-2 px-3 py-3 text-left transition ${
                i === step ? "bg-ink text-paper" : i < step ? "bg-paper hover:bg-paper-2" : "bg-paper text-mute-2"}`}>
              <span className="num text-2xs">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate text-[0.85rem]">{s}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {err.length > 0 && (
            <ul className="mb-5 animate-rise border border-signal bg-signal-soft p-3 text-[0.82rem] text-signal-ink">
              {err.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}

          {/* ------------------------------------------- step 0 */}
          {step === 0 && (
            <div className="space-y-8">
              <div>
                <p className="eyebrow">Kategori</p>
                <div className="mt-3 grid gap-px bg-line sm:grid-cols-3">
                  {CATEGORIES.map((c) => (
                    <button key={c.slug} onClick={() => { setCat(c.slug); setSub(""); setDeal(""); setAttrs({}); }}
                      className={`p-4 text-left transition ${cat === c.slug ? "bg-ink text-paper" : "bg-paper hover:bg-paper-2"}`}>
                      <p className="font-serif text-2xl leading-none">{c.label}</p>
                      <p className="mt-1.5 text-[0.78rem] opacity-60">{c.tagline}</p>
                    </button>
                  ))}
                </div>
              </div>

              {category && (
                <div>
                  <p className="eyebrow">Alt kategori</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {category.subs.map((s) => (
                      <button key={s.slug} onClick={() => { setSub(s.slug); setAttrs({}); }}
                        className={sub === s.slug ? "chip-on" : "chip hover:border-ink hover:text-ink"}>{s.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {category && (
                <div>
                  <p className="eyebrow">İşlem türü</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(category.dealTypes ?? ["Satılık"]).map((d) => (
                      <button key={d} onClick={() => setDeal(d)} className={deal === d ? "chip-on" : "chip hover:border-ink hover:text-ink"}>{d}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------- step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="eyebrow">İlan başlığı</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90}
                  placeholder={sub === "konut" ? "3+1 Site İçerisinde 145 m² Bakımlı Daire" : "Kısa ve net bir başlık"} className="field mt-2" />
                <p className="mt-1 flex justify-between font-mono text-2xs text-mute"><span>Marka, model ve ayırt edici özelliği yaz</span><span className="num">{title.length}/90</span></p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="eyebrow">Şehir</label>
                  <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(""); }} className="field mt-2">
                    <option value="">Seçiniz</option>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="eyebrow">İlçe</label>
                  <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!city} className="field mt-2 disabled:opacity-40">
                    <option value="">Seçiniz</option>
                    {(GEO[city] ?? []).map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <p className="eyebrow">{findSub(cat, sub)?.label} özellikleri</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {defs.map((d) => (
                    <div key={d.key} className={d.type === "bool" ? "sm:col-span-1" : ""}>
                      {d.type === "bool" ? (
                        <button onClick={() => setAttrs((a) => ({ ...a, [d.key]: !a[d.key] }))}
                          className="flex w-full items-center gap-2.5 border border-line px-3 py-2.5 text-left text-[0.85rem] hover:border-ink">
                          <span className={`grid h-4 w-4 place-items-center border ${attrs[d.key] ? "border-ink bg-ink" : "border-line-strong"}`}>
                            {attrs[d.key] && <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-paper" fill="none" stroke="currentColor" strokeWidth="4"><path d="M4 12l6 6L20 6" /></svg>}
                          </span>
                          {d.label}
                        </button>
                      ) : (
                        <>
                          <label className="eyebrow">{d.label}{d.required && <span className="text-signal"> *</span>}{d.unit && ` (${d.unit})`}</label>
                          {d.type === "select" ? (
                            <select value={String(attrs[d.key] ?? "")} onChange={(e) => setAttrs((a) => ({ ...a, [d.key]: e.target.value }))} className="field mt-1.5">
                              <option value="">Seçiniz</option>
                              {d.options!.map((o) => <option key={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input type={d.type === "number" ? "number" : "text"} value={String(attrs[d.key] ?? "")}
                              onChange={(e) => setAttrs((a) => ({ ...a, [d.key]: d.type === "number" ? (e.target.value === "" ? "" : +e.target.value) : e.target.value }))}
                              className="field mt-1.5" />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="eyebrow">Açıklama</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={8}
                  placeholder="Ürünün durumu, kullanım geçmişi, eksikleri, teslim şekli…" className="field mt-2 resize-y" />
                <p className="mt-1 flex justify-between font-mono text-2xs text-mute">
                  <span>Telefon/IBAN yazma — güven skorunu düşürür</span><span className="num">{desc.trim().split(/\s+/).filter(Boolean).length} kelime</span>
                </p>
              </div>

              <div>
                <label className="eyebrow">Fotoğraf sayısı (demo)</label>
                <input type="range" min={1} max={10} value={photos} onChange={(e) => setPhotos(+e.target.value)} className="mt-4 w-full" />
                <p className="num mt-1 text-[0.8rem] text-mute">{photos} görsel · 6+ görsel güven skorunu artırır</p>
              </div>
            </div>
          )}

          {/* ------------------------------------------- step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="eyebrow">Fiyat (TL)</label>
                <input type="number" value={price} disabled={deal === "Ücretsiz"}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : +e.target.value)}
                  className="field num mt-2 !text-2xl disabled:opacity-40" placeholder="0" />
              </div>

              {est ? (
                <div className="panel p-4 shadow-plaque">
                  <div className="flex items-baseline justify-between">
                    <p className="eyebrow">Piyasa önerisi</p>
                    <span className="font-mono text-2xs text-mute">{est.n} benzer ilan</span>
                  </div>
                  <p className="mt-2 text-[0.85rem] text-mute">
                    Girdiğin özelliklere en yakın ilanların fiyat dağılımı:
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-px bg-line">
                    {[["Alt çeyrek", est.low], ["Ortanca", est.mid], ["Üst çeyrek", est.high]].map(([k, v], i) => (
                      <button key={i} onClick={() => setPrice(v as number)}
                        className="bg-paper p-3 text-left transition hover:bg-paper-2">
                        <p className="eyebrow">{k as string}</p>
                        <p className="num mt-1 text-[0.95rem]">{tl(v as number)}</p>
                      </button>
                    ))}
                  </div>
                  {typeof price === "number" && price > 0 && (
                    <p className="mt-4 border-t border-line pt-3 text-[0.85rem]">
                      Girdiğin fiyat ortancaya göre{" "}
                      <span className={`num ${price > est.mid ? "text-signal" : "text-moss"}`}>
                        {price > est.mid ? "+" : ""}{Math.round(((price - est.mid) / est.mid) * 100)}%
                      </span>
                      {price > est.high && " — bu bantta ilanlar daha yavaş satılır."}
                      {price < est.low && " — hızlı satış beklenir, kopya/dolandırıcılık şüphesi doğurmamasına dikkat et."}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-2xs text-mute">Karşılaştırma temeli: {est.basis}</p>
                </div>
              ) : (
                <p className="border border-line p-4 text-[0.85rem] text-mute">
                  Bu kombinasyon için yeterli karşılaştırma verisi yok; fiyatı kendin belirle.
                </p>
              )}
            </div>
          )}

          {/* ------------------------------------------- step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border border-line">
                <Artwork seed={draft.art} sub={sub} kind={String(attrs.tur ?? attrs.tip ?? "")} className="aspect-[16/9] w-full" />
                <div className="p-4">
                  <p className="eyebrow">{city}, {district || "—"} · {deal}</p>
                  <h2 className="mt-1.5 font-serif text-2xl leading-tight">{draft.title}</h2>
                  <p className="num mt-3 text-xl">{tl(draft.price)}</p>
                  <p className="mt-3 whitespace-pre-line text-[0.88rem] leading-relaxed text-ink/80">{desc}</p>
                </div>
              </div>
              <TrustPanel t={trust} />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost disabled:opacity-30">← Geri</button>
            {step < 3
              ? <button onClick={next} className="btn-primary px-8">Devam →</button>
              : <button onClick={submit} className="btn-signal px-8">İlanı yayınla</button>}
          </div>
        </div>

        {/* live preview rail */}
        <aside className="lg:sticky lg:top-[168px] lg:self-start">
          <div className="border border-line">
            <p className="eyebrow border-b border-line px-4 py-3">Canlı önizleme</p>
            <Artwork seed={draft.art} sub={sub || "elektronik"} kind={String(attrs.tur ?? attrs.tip ?? "")} className="aspect-[4/3] w-full" />
            <div className="p-4">
              <p className="eyebrow">{city || "Şehir"} · {deal || "İşlem"}</p>
              <p className="mt-1.5 line-clamp-2 text-[0.95rem] font-medium">{title || "İlan başlığı buraya gelecek"}</p>
              <p className="num mt-2 text-lg">{typeof price === "number" && price ? tl(price) : "— TL"}</p>
            </div>
            <div className="border-t border-line px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Tahmini güven skoru</span>
                <span className="num text-lg">{trust.score}</span>
              </div>
              <div className="mt-2 h-[3px] w-full bg-line">
                <div className={`h-full ${trust.grade === "D" ? "bg-signal" : trust.grade === "C" ? "bg-gold" : "bg-moss"}`} style={{ width: `${trust.score}%` }} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {trust.flags.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex gap-2 text-[0.76rem] text-mute">
                    <span className={`mt-[6px] h-1 w-1 shrink-0 ${f.level === "risk" ? "bg-signal" : "bg-gold"}`} />{f.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {est && (
            <p className="mt-3 border border-line bg-paper-2/60 p-3 text-[0.75rem] leading-relaxed text-mute">
              Benzer <span className="num text-ink">{num(est.n)}</span> ilanın ortanca fiyatı{" "}
              <span className="num text-ink">{tl(est.mid)}</span>.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
