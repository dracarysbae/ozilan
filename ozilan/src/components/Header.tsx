"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Omnibox } from "./Omnibox";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/data/taxonomy";

const NAV = [
  { href: "/favorilerim/", label: "Favoriler" },
  { href: "/mesajlar/", label: "Mesajlar" },
  { href: "/panel/", label: "Yönetim" },
];

export function Header() {
  const path = usePathname();
  const { me, state, ready } = useStore();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  useEffect(() => { setOpen(false); setMenu(null); }, [path]);

  const unread = ready ? state.threads.length : 0;
  const home = path === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-shell items-center gap-3 px-5 lg:px-6">
        <Link href="/" className="shrink-0 text-[1.0625rem] font-semibold tracking-[-0.03em]">
          OzIlan
        </Link>

        {/* kategoriler — sessiz, gezinmenin ana yolu */}
        <nav className="ml-4 hidden items-center lg:flex" onMouseLeave={() => setMenu(null)}>
          {CATEGORIES.slice(0, 6).map((c) => (
            <div key={c.slug} className="relative" onMouseEnter={() => setMenu(c.slug)}>
              <Link
                href={`/arama/?k=${c.slug}`}
                className={`flex h-14 items-center px-3 text-[0.8125rem] transition ${
                  menu === c.slug ? "text-ink" : "text-mute hover:text-ink"
                }`}
              >
                {c.label}
              </Link>
              {menu === c.slug && (
                <div className="absolute left-0 top-full w-56 animate-rise overflow-hidden rounded-lg border border-line bg-paper-2 py-1 shadow-pop">
                  {c.subs.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/arama/?k=${c.slug}&a=${s.slug}`}
                      className="block px-4 py-2 text-[0.8125rem] text-mute transition hover:bg-paper-3 hover:text-ink"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link href="/arama/" className="flex h-14 items-center px-3 text-[0.8125rem] text-mute transition hover:text-ink">
            Tümü
          </Link>
        </nav>

        {/* ana sayfada arama kutusu hero'da; içeride başlıkta */}
        {!home && <div className="ml-auto hidden max-w-sm flex-1 md:block"><Omnibox /></div>}

        <div className={`hidden items-center gap-1 lg:flex ${home ? "ml-auto" : "ml-3"}`}>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3 py-1.5 text-[0.8125rem] transition hover:bg-paper-3 ${
                path === n.href ? "text-ink" : "text-mute hover:text-ink"
              }`}
            >
              {n.label}
              {n.href === "/mesajlar/" && unread > 0 && (
                <span className="num ml-1.5 rounded-full bg-signal px-1.5 py-0.5 text-[0.6875rem] text-white">{unread}</span>
              )}
            </Link>
          ))}
          <Link href={me ? "/hesap/" : "/giris/"} className="rounded-full px-3 py-1.5 text-[0.8125rem] text-mute transition hover:bg-paper-3 hover:text-ink">
            {me ? me.name.split(" ")[0] : "Giriş"}
          </Link>
          <Link href="/ilan-ver/" className="ml-1 rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-medium text-white transition hover:bg-ink-2">
            İlan ver
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Menü"
          className="ml-auto grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-paper-3 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      {!home && <div className="mx-auto max-w-shell px-5 pb-3 md:hidden"><Omnibox /></div>}

      {open && (
        <div className="animate-rise border-t border-line bg-paper lg:hidden">
          <div className="mx-auto max-w-shell px-5 py-2">
            <div className="rows">
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/arama/?k=${c.slug}`} className="block py-3 text-[0.9375rem]">{c.label}</Link>
              ))}
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="block py-3 text-[0.9375rem] text-mute">{n.label}</Link>
              ))}
              <Link href={me ? "/hesap/" : "/giris/"} className="block py-3 text-[0.9375rem] text-mute">
                {me ? "Hesabım" : "Giriş yap"}
              </Link>
            </div>
            <Link href="/ilan-ver/" className="btn-primary my-3 w-full">İlan ver</Link>
          </div>
        </div>
      )}
    </header>
  );
}
