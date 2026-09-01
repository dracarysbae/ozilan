"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Omnibox } from "./Omnibox";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/data/taxonomy";
import { num, tlShort } from "@/lib/format";

function Ticker() {
  const { pool } = useStore();
  const items = useMemo(() => {
    const byCat = CATEGORIES.map((c) => {
      const set = pool.filter((l) => l.cat === c.slug && l.price > 0);
      const med = set.length ? [...set].sort((a, b) => a.price - b.price)[Math.floor(set.length / 2)].price : 0;
      return `${c.label.toLocaleUpperCase("tr")} ${num(set.length)} ilan · ortanca ${tlShort(med)}`;
    });
    return [...byCat, `TOPLAM ${num(pool.length)} aktif ilan`, "PİYASA ENDEKSİ günlük güncellenir", "GÜVEN TARAMASI her ilanda otomatik"];
  }, [pool]);
  const row = [...items, ...items];
  return (
    <div className="marquee-host overflow-hidden border-b border-line bg-ink py-2">
      <div className="marquee-track flex w-max gap-11 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="font-mono text-[0.78rem] uppercase tracking-[0.05em] text-paper/70">
            <span className="mr-11 text-gold">◆</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}

const NAV = [
  { href: "/favorilerim/", label: "Favoriler" },
  { href: "/mesajlar/", label: "Mesajlar" },
  { href: "/panel/", label: "Yönetim" },
];

export function Header() {
  const path = usePathname();
  const { me, state, ready } = useStore();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);

  const unread = ready ? state.threads.length : 0;

  return (
    <header className="sticky top-0 z-40">
      <Ticker />
      <div className="border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 lg:px-6">
          <Link href="/" className="group flex shrink-0 items-baseline gap-1.5">
            <span className="font-serif text-[1.55rem] leading-none tracking-tight">OzIlan</span>
            <span className="h-1.5 w-1.5 translate-y-[-2px] bg-signal transition group-hover:scale-150" />
          </Link>

          <div className="hidden flex-1 md:block"><Omnibox /></div>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className={`btn-quiet ${path === n.href ? "text-signal" : "text-ink"}`}>
                {n.label}
                {n.href === "/mesajlar/" && unread > 0 && (
                  <span className="num ml-1 bg-ink px-1 text-2xs text-paper">{unread}</span>
                )}
              </Link>
            ))}
            <Link href={me ? "/hesap/" : "/giris/"} className="btn-ghost">
              {me ? me.name.split(" ")[0] : "Giriş yap"}
            </Link>
            <Link href="/ilan-ver/" className="btn-signal">İlan ver</Link>
          </nav>

          <button onClick={() => setOpen((o) => !o)} aria-label="Menü" className="ml-auto btn-ghost h-10 w-10 !px-0 lg:hidden">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 pb-3 md:hidden lg:px-6"><Omnibox /></div>

        <div className="hidden border-t border-line md:block">
          <div className="mx-auto flex max-w-[1400px] items-stretch gap-6 overflow-x-auto px-4 lg:px-6">
            {CATEGORIES.map((c) => (
              <div key={c.slug} className="group relative shrink-0">
                <Link href={`/arama/?k=${c.slug}`}
                  className="flex h-10 items-center gap-2 border-b-2 border-transparent text-[0.82rem] font-medium transition group-hover:border-signal">
                  {c.label}
                  <span className="font-mono text-2xs text-mute">{c.subs.length}</span>
                </Link>
                <div className="invisible absolute left-0 top-full z-50 w-60 rounded-lg border border-line bg-paper-2 opacity-0 shadow-pop transition group-hover:visible group-hover:opacity-100 overflow-hidden">
                  {c.subs.map((s) => (
                    <Link key={s.slug} href={`/arama/?k=${c.slug}&a=${s.slug}`}
                      className="block border-b border-line px-3 py-2 text-[0.82rem] last:border-0 hover:bg-paper-3">
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link href="/arama/?s=value" className="ml-auto flex h-10 shrink-0 items-center gap-2 text-[0.82rem] text-signal">
              Piyasa altı fırsatlar →
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-b border-line bg-paper lg:hidden">
          <div className="mx-auto grid max-w-[1400px] gap-px bg-line px-0">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/arama/?k=${c.slug}`} className="bg-paper px-4 py-3 text-[0.9rem]">{c.label}</Link>
            ))}
            {NAV.map((n) => <Link key={n.href} href={n.href} className="bg-paper px-4 py-3 text-[0.9rem]">{n.label}</Link>)}
            <Link href={me ? "/hesap/" : "/giris/"} className="bg-paper px-4 py-3 text-[0.9rem]">{me ? "Hesabım" : "Giriş yap"}</Link>
            <Link href="/ilan-ver/" className="bg-signal px-4 py-3 text-[0.9rem] font-medium text-white">İlan ver</Link>
          </div>
        </div>
      )}
    </header>
  );
}
