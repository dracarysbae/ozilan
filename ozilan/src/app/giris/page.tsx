"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";

function Auth() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, signUp, demoSignIn, me } = useStore();
  const [mode, setMode] = useState<"giris" | "kayit">(params.get("mod") === "kayit" ? "kayit" : "giris");
  const [f, setF] = useState({ name: "", email: "", phone: "", pass: "", kind: "bireysel" as "bireysel" | "kurumsal" });
  const [err, setErr] = useState<string | null>(null);

  if (me) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="eyebrow">Zaten giriş yaptın</p>
        <h1 className="mt-2 font-serif text-4xl leading-none">Merhaba {me.name.split(" ")[0]}</h1>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/hesap/" className="btn-primary">Hesabım</Link>
          <Link href="/ilan-ver/" className="btn-ghost">İlan ver</Link>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = mode === "giris"
      ? signIn(f.email, f.pass)
      : signUp({ name: f.name, email: f.email, phone: f.phone, pass: f.pass, kind: f.kind });
    if (r) setErr(r);
    else router.push("/hesap/");
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-0 px-4 py-12 lg:grid-cols-2 lg:px-6">
      <div className="hidden border-r border-line pr-12 lg:block">
        <p className="eyebrow">OzIlan hesabı</p>
        <h1 className="mt-3 font-serif text-[clamp(2rem,4vw,3.4rem)] leading-[1.02]">
          Bir hesap, üç ayrıcalık.
        </h1>
        <ul className="mt-8 space-y-6">
          {[
            ["Piyasa uyarıları", "Kaydettiğin aramada fiyatı ortancanın altına düşen ilanları işaretleriz."],
            ["Güven geçmişi", "Yayınladığın her ilan skorlanır; skorun yükseldikçe ilanların üst sıralarda görünür."],
            ["Tek kutuda mesajlar", "Tüm pazarlıkların, ilan görselleriyle birlikte tek akışta."],
          ].map(([t, d], i) => (
            <li key={i} className="flex gap-4">
              <span className="num text-2xs text-signal">0{i + 1}</span>
              <div>
                <p className="font-medium">{t}</p>
                <p className="mt-1 text-[0.85rem] leading-relaxed text-mute">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:pl-12">
        <div className="flex gap-px bg-line">
          {(["giris", "kayit"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setErr(null); }}
              className={`flex-1 py-3 text-[0.88rem] transition ${mode === m ? "bg-ink text-paper" : "bg-paper hover:bg-paper-2"}`}>
              {m === "giris" ? "Giriş yap" : "Hesap oluştur"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "kayit" && (
            <>
              <input required placeholder="Ad Soyad / Firma adı" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="field" />
              <input required placeholder="Telefon" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="field" />
              <div className="flex gap-1.5">
                {(["bireysel", "kurumsal"] as const).map((k) => (
                  <button type="button" key={k} onClick={() => setF({ ...f, kind: k })} className={f.kind === k ? "chip-on flex-1 justify-center" : "chip flex-1 justify-center hover:border-ink"}>{k}</button>
                ))}
              </div>
            </>
          )}
          <input required type="email" placeholder="E-posta" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="field" />
          <input required type="password" placeholder="Şifre" minLength={4} value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} className="field" />
          {err && <p className="border border-signal bg-signal-soft px-3 py-2 text-[0.82rem] text-signal-ink">{err}</p>}
          <button className="btn-primary w-full">{mode === "giris" ? "Giriş yap" : "Hesabı oluştur"}</button>
        </form>

        <div className="mt-6 border-t border-line pt-6">
          <p className="text-[0.82rem] text-mute">Kurulumla uğraşmadan gezmek ister misin?</p>
          <button onClick={() => { demoSignIn(); router.push("/hesap/"); }} className="btn-ghost mt-2 w-full">
            Demo hesapla devam et (yönetici yetkili)
          </button>
        </div>

        <p className="mt-6 text-[0.72rem] leading-relaxed text-mute">
          Bu bir demo platformdur. Hesap bilgilerin yalnızca bu tarayıcıda saklanır, hiçbir sunucuya gönderilmez.
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="px-4 py-24 text-mute">Yükleniyor…</div>}><Auth /></Suspense>;
}
