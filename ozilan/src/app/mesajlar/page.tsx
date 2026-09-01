"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Artwork } from "@/components/Artwork";
import { useStore } from "@/lib/store";
import { ago, tl } from "@/lib/format";

export default function Inbox() {
  const { state, pool, sellers, me, send, ready } = useStore();
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");

  const threads = useMemo(
    () => [...state.threads].sort((a, b) => b.updatedAt - a.updatedAt),
    [state.threads],
  );
  const current = threads.find((t) => t.id === (active ?? threads[0]?.id));
  const msgs = useMemo(
    () => state.messages.filter((m) => m.threadId === current?.id).sort((a, b) => a.at - b.at),
    [state.messages, current],
  );
  const listing = pool.find((l) => l.id === current?.listingId);

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
                    {l && <Artwork seed={l.art} sub={l.sub} kind={String(l.attrs.tur ?? l.attrs.tip ?? "")} className="h-12 w-14 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.82rem] font-medium">{l?.title ?? "Kaldırılmış ilan"}</p>
                      <p className={`truncate text-[0.75rem] ${on ? "text-paper/55" : "text-mute"}`}>{last?.body ?? "—"}</p>
                      <p className={`num text-2xs ${on ? "text-paper/40" : "text-mute-2"}`}>{ago(t.updatedAt)}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex min-h-[60vh] flex-col bg-paper">
            {listing && (
              <Link href={`/ilan/?id=${listing.id}`} className="flex items-center gap-3 border-b border-line p-3 hover:bg-paper-2">
                <Artwork seed={listing.art} sub={listing.sub} kind={String(listing.attrs.tur ?? listing.attrs.tip ?? "")} className="h-12 w-16 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-[0.9rem] font-medium">{listing.title}</p>
                  <p className="num text-[0.85rem] text-mute">{tl(listing.price)} · {sellers[listing.sellerId]?.name}</p>
                </div>
                <span className="ml-auto shrink-0 font-mono text-2xs uppercase tracking-[0.1em] text-mute">ilana git →</span>
              </Link>
            )}

            <div className="flex-1 space-y-3 overflow-auto p-4">
              {msgs.map((m) => {
                const mine = m.from === me.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] border px-3 py-2 text-[0.86rem] ${mine ? "border-ink bg-ink text-paper" : "border-line bg-paper-2"}`}>
                      <p className="whitespace-pre-line">{m.body}</p>
                      <p className={`num mt-1 text-2xs ${mine ? "text-paper/40" : "text-mute-2"}`}>{ago(m.at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (current) { send(current.id, text); setText(""); } }}
              className="flex gap-2 border-t border-line p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesajını yaz…" className="field" />
              <button className="btn-primary shrink-0">Gönder</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
