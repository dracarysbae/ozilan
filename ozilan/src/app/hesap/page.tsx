"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { useStore } from "@/lib/store";
import { scoreListing } from "@/lib/trust";
import { dateTR, num, tl } from "@/lib/format";

export default function Account() {
  const router = useRouter();
  const { me, pool, state, sellers, signOut, bump, setStatus, dropSearch, reset, ready, busy, live, deleteAccount } = useStore();
  const [confirmText, setConfirmText] = useState(""), [erasing, setErasing] = useState(false), [eraseError, setEraseError] = useState(""), [erased, setErased] = useState(false);

  const mine = useMemo(() => pool.filter((l) => me && l.sellerId === me.id), [pool, me]);
  const recent = useMemo(() => state.recent.map((id) => pool.find((l) => l.id === id)).filter(Boolean).slice(0, 8) as typeof pool, [state.recent, pool]);
  const avgTrust = useMemo(
    () => (mine.length ? Math.round(mine.reduce((s, l) => s + scoreListing(l, me ? sellers[me.id] : undefined, pool).score, 0) / mine.length) : 0),
    [mine, me, sellers, pool],
  );

  if (!ready) return <div className="px-4 py-24 text-mute">Yükleniyor…</div>;

  if (!me && erased) return (
    <div className="mx-auto max-w-md px-4 py-24 text-center" role="status">
      <p className="eyebrow">Hesap silindi</p>
      <h1 className="mt-2 font-serif text-4xl leading-none">Hesabın ve kişisel verilerin silindi</h1>
      <p className="mt-3 text-mute">Bu cihazdaki oturum kapatıldı. İlana bağlı kalmayan fotoğraflar zamanlanmış temizlikle kaldırılır.</p>
      <Link href="/" className="btn-primary mt-6">Ana sayfaya dön</Link>
    </div>
  );

  if (!me) return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-4xl leading-none">Hesabına giriş yap</h1>
      <Link href="/giris/" className="btn-primary mt-6">Giriş yap</Link>
    </div>
  );

  const views = mine.reduce((s, l) => s + l.views, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="eyebrow">{me.kind === "kurumsal" ? "Kurumsal üye" : "Bireysel üye"} · üyelik {dateTR(me.createdAt)}</p>
          <h1 className="mt-1 font-serif text-[clamp(1.9rem,3.4vw,3rem)] leading-none">{me.name}</h1>
        </div>
        <div className="flex gap-2">
          {me.role === "admin" && <Link href="/panel/" className="btn-ghost">Yönetim paneli</Link>}
          <Link href="/ilan-ver/" className="btn-signal">Yeni ilan</Link>
          <button onClick={async () => { await signOut(); router.push("/"); }} className="btn-ghost">Çıkış</button>
        </div>
      </div>

      <div className="mt-6 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Aktif ilan", num(mine.filter((l) => l.status === "active").length)],
          [live?"Kayıtlı arama":"Toplam görüntülenme", live?num(state.searches.length):num(views)],
          ["Portföy değeri", tl(mine.reduce((s, l) => s + l.price, 0))],
          ["Ortalama güven skoru", mine.length ? `${avgTrust}/100` : "—"],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper p-4">
            <p className="eyebrow">{k}</p>
            <p className="num mt-1.5 text-xl">{v}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <div className="border-b border-line pb-4">
          <p className="eyebrow">Portföy</p>
          <h2 className="mt-1 font-serif text-2xl leading-none">İlanlarım</h2>
        </div>

        {mine.length === 0 ? (
          <div className="mt-6 border border-line p-10 text-center">
            <p className="font-serif text-xl">Henüz ilan yayınlamadın</p>
            <Link href="/ilan-ver/" className="btn-primary mt-5">İlk ilanını oluştur</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {mine.map((l) => (
              <div key={l.id} className="border border-line">
                <ListingCard l={l} pool={pool} variant="row" />
                <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2">
                  <span className={`chip ${l.status === "active" ? "!text-moss !border-moss" : "!text-signal !border-signal"}`}>
                    {l.status === "active" ? "Yayında" : l.status === "pending" ? "İncelemede" : "Kaldırıldı"}
                  </span>
                  <Link href={`/ilan-ver/?duzenle=${l.id}`} className="btn-quiet !h-8 text-[0.78rem]">Düzenle</Link>
                  <button disabled={busy} onClick={() => bump(l.id)} className="btn-quiet !h-8 text-[0.78rem]">Tarihini güncelle · 24 saatte bir</button>
                  <button disabled={busy} onClick={() => setStatus(l.id, l.status === "active" ? "removed" : "active")} className="btn-quiet !h-8 text-[0.78rem]">
                    {l.status === "active" ? "Yayından kaldır" : "Yeniden yayınla"}
                  </button>
                  {!live&&<span className="num ml-auto text-2xs text-mute">{num(l.views)} görüntülenme</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {state.searches.length > 0 && (
        <section className="mt-12">
          <div className="border-b border-line pb-4">
            <p className="eyebrow">Takip</p>
            <h2 className="mt-1 font-serif text-2xl leading-none">Kayıtlı aramalar</h2>
          </div>
          <ul className="mt-4 divide-y divide-line border border-line">
            {state.searches.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={s.href} className="flex-1 truncate text-[0.9rem] hover:text-signal">{s.label}</Link>
                <button onClick={() => dropSearch(s.id)} className="font-mono text-2xs text-mute hover:text-signal">kaldır</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-12">
          <div className="border-b border-line pb-4">
            <p className="eyebrow">Geçmiş</p>
            <h2 className="mt-1 font-serif text-2xl leading-none">Son gezdiklerin</h2>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((l) => <ListingCard key={l.id} l={l} pool={pool} variant="mini" />)}
          </div>
        </section>
      )}

      <section className="mt-16 border border-line p-5">
        <p className="eyebrow">Veri</p>
        <p className="mt-2 max-w-2xl text-[0.85rem] leading-relaxed text-mute">
          İlanların, favorilerin, aramaların ve görüşmelerin hesabına bağlıdır. Başka cihazdan giriş yaptığında da erişebilirsin.
          Aşağıdaki işlem yalnızca bu cihazdaki son gezdiklerini ve karşılaştırma listesini temizler.
        </p>
        <button onClick={reset} className="btn-ghost mt-4">Bu cihazdaki keşif geçmişini temizle</button>
      </section>

      {live && (
        <section className="account-erase mt-6 border border-signal/40 p-5" aria-labelledby="erase-title">
          <p className="eyebrow !text-signal">Hesabı sil</p>
          <h2 id="erase-title" className="mt-1 font-serif text-2xl leading-none">Hesabını ve kişisel verilerini kalıcı olarak sil</h2>
          <ul className="mt-3 max-w-2xl list-disc space-y-1 pl-5 text-[0.85rem] leading-relaxed text-mute">
            <li>Google ile giriş bağlantın, profil adın, favorilerin, kayıtlı aramaların ve şikâyetlerin silinir.</li>
            <li>Kimsenin yazışmadığı ilanların tamamen silinir. Görüşme açılmış ilanların yayından kalkar; başlık, açıklama, fiyat ve fotoğraf bağlantıları temizlenir.</li>
            <li>Gönderdiğin mesajların metni kaldırılır. Karşı taraf görüşmenin var olduğunu ve kendi yazdıklarını görmeye devam eder.</li>
            <li>İlana bağlı kalmayan fotoğraflar sunucudaki zamanlanmış temizlikle silinir.</li>
            <li>Bu işlem geri alınamaz. Aynı Google hesabıyla yeniden girersen yeni ve boş bir hesap açılır.</li>
          </ul>
          <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={async (e) => {
            e.preventDefault(); if (erasing) return;
            setErasing(true); setEraseError("");
            const failure = await deleteAccount(confirmText.trim());
            setErasing(false);
            if (failure) { setEraseError(failure); return; }
            setErased(true);
          }}>
            <label className="flex flex-col gap-1 text-[0.8rem] text-mute">
              Onaylamak için <strong className="text-ink">HESABIMI SİL</strong> yaz
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" spellCheck={false}
                className="field h-10 min-w-[16rem]" aria-describedby={eraseError ? "erase-error" : undefined} />
            </label>
            <button type="submit" disabled={erasing || confirmText.trim() !== "HESABIMI SİL"} className="btn-ghost !border-signal !text-signal disabled:opacity-50">
              {erasing ? "Siliniyor…" : "Hesabımı kalıcı olarak sil"}
            </button>
          </form>
          {eraseError && <p id="erase-error" role="alert" className="mt-3 text-[0.85rem] text-signal">{eraseError}</p>}
        </section>
      )}
    </div>
  );
}
