"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Artwork } from "@/components/Artwork";
import { GaugeFull } from "@/components/MarketGauge";
import { TrustPanel } from "@/components/Trust";
import { FavButton, ListingCard } from "@/components/ListingCard";
import { useStore } from "@/lib/store";
import { readMarket } from "@/lib/market";
import { scoreListing } from "@/lib/trust";
import { attrsFor, labelFor } from "@/data/taxonomy";
import { dateTR, num, tl } from "@/lib/format";
import { Ago } from "@/components/Ago";
import { LoanCalc } from "@/components/LoanCalc";
import {ListingImage} from "@/components/ListingImage";

const REASONS = ["Sahte / yanıltıcı ilan", "Yanlış kategori", "Fiyat gerçekçi değil", "Dolandırıcılık şüphesi", "Ürün satılmış", "Uygunsuz içerik"];

function Detail() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const { pool, sellers, me, view, openThread, send, report, ready, live } = useStore();
  const [sending,setSending]=useState(false),[thread,setThread]=useState("");

  const l = useMemo(() => pool.find((x) => x.id === id), [pool, id]);
  const [shot, setShot] = useState(0);
  const [msg, setMsg] = useState("Merhaba, ilan hâlâ güncel mi?");
  const [sent, setSent] = useState(false);
  const [rep, setRep] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    setShot(0); setSent(false); setThread(""); setRep(false); setPhone(false);
    setMsg("Merhaba, ilan hâlâ güncel mi?"); setNote(""); setReason(REASONS[0]);
  }, [id]);

  useEffect(() => { if (l) view(l.id); /* eslint-disable-next-line */ }, [l?.id]);

  const m = useMemo(() => (l ? readMarket(l, pool) : null), [l, pool]);
  const t = useMemo(() => (l ? scoreListing(l, sellers[l.sellerId], pool) : null), [l, pool, sellers]);
  const similar = useMemo(
    () => (l ? pool.filter((x) => x.id !== l.id && x.sub === l.sub && x.status === "active" && (x.city === l.city || Math.abs(x.price - l.price) / Math.max(l.price, 1) < 0.25)).slice(0, 4) : []),
    [l, pool],
  );

  if (!ready) return <div className="mx-auto max-w-[1400px] px-4 py-24 text-mute lg:px-6">Yükleniyor…</div>;

  if (!l) return (
    <div className="mx-auto max-w-[1400px] px-4 py-24 text-center lg:px-6">
      <p className="font-serif text-3xl">İlan bulunamadı</p>
      <p className="mt-2 text-mute">Bu ilan kaldırılmış ya da bağlantı hatalı olabilir.</p>
      <Link href="/arama/" className="btn-primary mt-6">İlanlara dön</Link>
    </div>
  );

  const seller = sellers[l.sellerId];
  const defs = attrsFor(l.cat, l.sub);
  const mine = me?.id === l.sellerId;

  const doSend = async () => {
    if (!me) { router.push(`/giris/?sonra=${encodeURIComponent(`/ilan/?id=${l.id}`)}`); return; }
    if(sending||!msg.trim())return;setSending(true);
    const th = await openThread(l.id);
    if(th&&await send(th,msg)){setThread(th);setSent(true);}setSending(false);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      <nav className="flex flex-wrap items-center gap-1.5 font-mono text-2xs text-mute">
        <Link href="/" className="hover:text-ink">Anasayfa</Link><span>/</span>
        <Link href={`/arama/?k=${l.cat}`} className="hover:text-ink">{labelFor(l.cat)}</Link><span>/</span>
        <Link href={`/arama/?k=${l.cat}&a=${l.sub}`} className="hover:text-ink">{labelFor(l.cat, l.sub).split(" · ")[1]}</Link><span>/</span>
        {(l.pathLabels ?? []).map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <Link href={`/arama/?k=${l.cat}&a=${l.sub}&p=${(l.path ?? []).slice(0, i + 1).join(".")}`} className="hover:text-ink">{seg}</Link>
            <span>/</span>
          </span>
        ))}
        <Link href={`/arama/?il=${encodeURIComponent(l.city)}`} className="hover:text-ink">{l.city}</Link>
        <span className="num ml-auto normal-case tracking-normal">İlan no {l.id}</span>
      </nav>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,.65fr)]">
        {/* ---------------------------------------------- left */}
        {/* min-w-0: the thumbnail strip scrolls instead of widening the page on phones */}
        <div className="min-w-0">
          <div className="relative border border-line">
            <ListingImage listing={l} index={shot} className="aspect-[16/10] w-full" eager/>
            <span className="absolute left-0 top-0 bg-ink/85 px-2 py-1 font-mono text-2xs text-paper">{l.deal}</span>
            <span className="num absolute bottom-0 right-0 bg-ink/85 px-2 py-1 text-2xs text-paper">{shot + 1} / {l.photos}</span>
            <FavButton id={l.id} className="absolute right-2 top-2" />
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: l.photos }).map((_, i) => (
              <button key={i} onClick={() => setShot(i)} aria-label={`${i+1}. fotoğrafı göster`}
                className={`shrink-0 border transition ${i === shot ? "border-ink" : "border-line opacity-60 hover:opacity-100"}`}>
                <ListingImage listing={l} index={i} className="h-14 w-20"/>
              </button>
            ))}
          </div>

          <div className="mt-8">
            <p className="eyebrow">{labelFor(l.cat, l.sub)} · {l.district}, {l.city}</p>
            <h1 className="mt-2 font-serif text-[clamp(1.8rem,3.4vw,2.9rem)] leading-[1.05]">{l.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs text-mute">
              <span>Yayın {dateTR(l.createdAt)}</span>
              <span>Güncelleme <Ago ts={l.bumpedAt} /></span>
              {!live&&<span>{num(l.views)} görüntülenme</span>}
            </div>
          </div>

          {/* spec table */}
          <div className="mt-8 border-t border-line">
            <p className="eyebrow py-3">İlan özellikleri</p>
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              {defs.map((d) => {
                const v = l.attrs[d.key];
                if (v === undefined || v === "") return null;
                const text = typeof v === "boolean" ? (v ? "Var" : "Yok") : d.type === "number" ? `${d.plain ? String(v) : num(Number(v))}${d.unit ? " " + d.unit : ""}` : String(v);
                return (
                  <div key={d.key} className="flex items-baseline justify-between gap-4 bg-paper px-3 py-2.5">
                    <dt className="text-[0.8rem] text-mute">{d.label}</dt>
                    <dd className={`text-[0.86rem] ${d.type === "number" ? "num" : ""} ${typeof v === "boolean" && !v ? "text-mute-2" : ""}`}>{text}</dd>
                  </div>
                );
              })}
              <div className="hidden bg-paper sm:block sm:[&:nth-child(even)]:hidden" />
            </dl>
          </div>

          <div className="mt-8 border-t border-line">
            <p className="eyebrow py-3">Açıklama</p>
            <div className="max-w-2xl space-y-4 text-[0.92rem] leading-relaxed text-ink/85">
              {l.desc.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>

          <div className="mt-8">{t && <TrustPanel t={t} />}</div>

          <button onClick={() => setRep(true)} className="mt-4 font-mono text-2xs text-mute underline underline-offset-4 hover:text-signal">
            Bu ilanı şikâyet et
          </button>
        </div>

        {/* ---------------------------------------------- right rail */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-[168px] lg:self-start">
          <div className="panel p-4 shadow-plaque">
            <p className="eyebrow">Fiyat</p>
            <p className="num mt-1 text-[clamp(1.8rem,4vw,2.6rem)] leading-none">{tl(l.price)}</p>
            {l.deal === "Kiralık" && <p className="mt-1 text-[0.78rem] text-mute">aylık</p>}
            {m && <div className="mt-4"><GaugeFull m={m} /></div>}
          </div>

          <div className="border border-line rounded-lg bg-paper-2 overflow-hidden">
            <div className="flex items-start gap-3 border-b border-line p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-serif text-lg text-white">
                {seller?.name?.[0] ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[0.95rem] font-medium">{seller?.name ?? "Bilinmeyen satıcı"}</p>
                <p className="font-mono text-2xs text-mute">
                  {seller?.kind === "kurumsal" ? "Kurumsal üye" : "Bireysel üye"}
                  {seller?.verified && <span className="ml-2 text-moss">✓ doğrulanmış</span>}
                </p>
                {seller && seller.reviews > 0 && (
                  <p className="num mt-1 text-[0.78rem] text-mute">{seller.rating} ★ · {seller.reviews} değerlendirme · ort. {seller.responseMins} dk yanıt</p>
                )}
              </div>
            </div>

            <div className="space-y-2 p-4">
              {seller?.phone&&<button onClick={() => setPhone((p) => !p)} className="btn-ghost w-full">
                {phone ? seller?.phone ?? "—" : "Telefonu göster"}
              </button>}
              {l.status!=="active"&&<p className="form-notice">Bu ilan şu anda yayında değil.</p>}

              {mine ? (
                <p className="rounded-md border border-line bg-paper p-3 text-center text-[0.8rem] text-mute">Bu ilan size ait.</p>
              ) : sent ? (
                <div className="rounded-md border border-moss bg-moss-soft p-3 text-[0.82rem] text-moss">
                  Mesaj gönderildi. <Link href={`/mesajlar/?gorusme=${thread}`} className="underline underline-offset-2">Görüşmeyi aç →</Link>
                </div>
              ) : (
                <>
                  <textarea aria-label="Satıcıya mesajın" maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="field resize-none" />
                  <button onClick={doSend} disabled={sending||!msg.trim()||l.status!=="active"||!live} className="btn-signal w-full">{sending?"Gönderiliyor…":"Satıcıya mesaj gönder"}</button>
                  {!live&&<p className="form-notice">Bu örnek ilan için gerçek satıcıya mesaj gönderilmez.</p>}
                  {!me && <p className="text-center text-[0.72rem] text-mute">Mesaj için giriş yapmanız gerekir.</p>}
                </>
              )}
            </div>

            <div className="border-t border-line bg-paper p-4 text-[0.72rem] leading-relaxed text-mute">
              <strong className="text-ink">Güvenli alışveriş:</strong> ürünü görmeden kapora göndermeyin,
              ödemeyi elden teslimde yapın, iletişimi platform içinde tutun.
            </div>
          </div>

          {(l.cat === "emlak" || l.cat === "vasita") && l.deal === "Satılık" && l.price > 0 && (
            <LoanCalc price={l.price} kind={l.cat as "emlak" | "vasita"} />
          )}

          <div className="border border-line p-4 rounded-lg bg-paper-2">
            <p className="eyebrow">Konum</p>
            <p className="mt-2 text-[0.95rem]">{l.district}, {l.city}</p>
            <a className="btn-ghost mt-3 w-full" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.district}, ${l.city}, Türkiye`)}`} target="_blank" rel="noopener noreferrer">İlçeyi haritada aç ↗</a><p className="mt-2 text-xs text-mute">İlçe merkezi gösterilir; satıcının açık adresi paylaşılmaz.</p>
            <Link href={`/arama/?il=${encodeURIComponent(l.city)}&ilce=${encodeURIComponent(l.district)}&k=${l.cat}&a=${l.sub}`}
              className="btn-ghost mt-3 w-full">Bu bölgedeki benzerleri</Link>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <div className="border-b border-line pb-4">
            <p className="eyebrow">Karşılaştır</p>
            <h2 className="mt-1 font-serif text-3xl leading-none">Benzer ilanlar</h2>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => <ListingCard key={s.id} l={s} pool={pool} />)}
          </div>
        </section>
      )}

      {rep && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setRep(false)} />
          <div className="relative w-full max-w-md animate-rise rounded-lg border border-line bg-paper-2 p-5 shadow-pop">
            <p className="eyebrow">Şikâyet</p>
            <h3 className="mt-1 font-serif text-2xl">İlanı bildir</h3>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="field mt-4">
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Kısa açıklama (isteğe bağlı)" className="field mt-2 resize-none" />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setRep(false)} className="btn-ghost flex-1">Vazgeç</button>
              <button onClick={async () => { if(await report(l.id, reason, note))setRep(false); }} className="btn-signal flex-1">Gönder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-24 text-mute lg:px-6">Yükleniyor…</div>}><Detail /></Suspense>;
}
