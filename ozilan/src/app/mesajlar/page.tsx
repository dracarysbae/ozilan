"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import {useSearchParams} from "next/navigation";
import { ListingImage } from "@/components/ListingImage";
import { useStore } from "@/lib/store";
import { tl } from "@/lib/format";
import { Ago } from "@/components/Ago";

function Inbox() {
  const { state, pool, sellers, me, send, ready, refresh, busy, unseen, markSeen } = useStore();
  const params=useSearchParams();
  const [sending,setSending]=useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");

  const threads = useMemo(
    () => state.threads.filter(t=>me&&(t.buyerId===me.id||t.sellerId===me.id)).sort((a, b) => b.updatedAt - a.updatedAt),
    [state.threads,me],
  );
  const current = threads.find((t) => t.id === (active ?? params.get("gorusme")))??threads[0];
  const msgs = useMemo(
    () => state.messages.filter((m) => m.threadId === current?.id).sort((a, b) => a.at - b.at),
    [state.messages, current],
  );
  const listing = pool.find((l) => l.id === current?.listingId);
  // Opening a conversation marks it seen on this device only.
  const newest = msgs.at(-1)?.at ?? 0;
  useEffect(() => { if (current) markSeen(current.id); }, [current?.id, newest, markSeen]);
  const correspondent = current ? sellers[current.sellerId === me?.id ? current.buyerId : current.sellerId] : undefined;

  if (!ready) return <div className="px-4 py-24 text-mute">Yükleniyor…</div>;

  if (!me) return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-4xl leading-none">Mesajlar için giriş yap</h1>
      <Link href="/giris/" className="btn-primary mt-6">Giriş yap</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-6">
      <div className="border-b border-line pb-4">
        <p className="eyebrow">Kutu</p>
        <h1 className="mt-1 font-serif text-[clamp(1.9rem,3.4vw,3rem)] leading-none">Mesajlar</h1>
        <button className="btn-quiet mt-2" disabled={busy} onClick={()=>void refresh()}>{busy?"Yenileniyor…":"Mesajları yenile ↻"}</button><p className="text-xs text-mute">Bu ekran açıkken yeni mesajlar 30 saniyede bir kontrol edilir.</p>
      </div>

      {threads.length === 0 ? (
        <div className="mt-10 border border-line p-12 text-center">
          <p className="font-serif text-2xl">Henüz görüşme yok</p>
          <p className="mt-2 text-[0.88rem] text-mute">Bir ilan detayından satıcıya yazdığında konuşma burada açılır.</p>
          <Link href="/arama/" className="btn-primary mt-6">İlanlara git</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-px border border-line bg-line md:grid-cols-[300px_1fr]">
          <ul className="max-h-[70vh] overflow-auto bg-paper">
            {threads.map((t) => {
              const l = pool.find((x) => x.id === t.listingId);
              const last = state.messages.filter((m) => m.threadId === t.id).sort((a, b) => b.at - a.at)[0];
              const on = current?.id === t.id;
              return (
                <li key={t.id}>
                  <button onClick={() => setActive(t.id)}
                    className={`flex w-full gap-3 border-b border-line p-3 text-left transition ${on ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>
                    {l && <ListingImage listing={l} className="h-12 w-14 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-[0.82rem] font-medium">
                        {unseen.has(t.id) && !on && <span className="h-2 w-2 shrink-0 rounded-full bg-signal" aria-label="Yeni mesaj" />}
                        <span className="truncate">{l?.title ?? "Kaldırılmış ilan"}</span>
                      </p>
                      <p className={`truncate text-[0.75rem] ${on ? "text-paper/55" : "text-mute"}`}>{last?.body ?? "—"}</p>
                      <p className={`num text-2xs ${on ? "text-paper/40" : "text-mute-2"}`}><Ago ts={t.updatedAt} /></p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex min-h-[60vh] min-w-0 flex-col bg-paper">
            {listing && (
              <Link href={`/ilan/?id=${listing.id}`} className="flex items-center gap-3 border-b border-line p-3 hover:bg-paper-2">
                <ListingImage listing={listing} className="h-12 w-16 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-[0.9rem] font-medium">{listing.title}</p>
                  <p className="num text-[0.85rem] text-mute">{tl(listing.price)} · {correspondent?.name ?? "Üye"}</p>
                </div>
                <span className="ml-auto shrink-0 font-mono text-2xs text-mute">ilana git →</span>
              </Link>
            )}

            <div className="flex-1 space-y-3 overflow-auto p-4">
              {msgs.map((m) => {
                const mine = m.from === me.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] border px-3 py-2 text-[0.86rem] ${mine ? "border-ink bg-ink text-paper" : "border-line bg-paper-2"}`}>
                      <p className="whitespace-pre-line [overflow-wrap:anywhere]">{m.body}</p>
                      <p className={`num mt-1 text-2xs ${mine ? "text-paper/40" : "text-mute-2"}`}><Ago ts={m.at} /></p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={async(e) => { e.preventDefault(); if(current&&!sending){setSending(true);if(await send(current.id,text))setText("");setSending(false);} }}
              className="flex gap-2 border-t border-line p-3">
              <input aria-label="Mesajın" maxLength={2000} required value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesajını yaz…" className="field min-w-0" />
              <button disabled={sending||!text.trim()} className="btn-primary shrink-0">{sending?"Gönderiliyor…":"Gönder"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default function Page(){return <Suspense fallback={<div className="auth-loading">Mesajlar hazırlanıyor…</div>}><Inbox/></Suspense>;}
