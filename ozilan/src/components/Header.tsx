"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Omnibox } from "./Omnibox";
import { useScrollY } from "./Motion";
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
  const y = useScrollY();
  useEffect(() => { setOpen(false); setMenu(null); }, [path]);

  const unread = ready ? state.threads.length : 0;
  const home = path === "/";
  /* ana sayfada koyu kahraman bandının üstündeyken şeffaf + beyaz metin */
  const onDark = home && y < 90 && !open;

  const tone = onDark ? "text-white/70 hover:text-white" : "text-mute hover:text-ink";

  return (
    <header
      className="sticky top-0 z-50"
      style={{ transition: "background-color .5s var(--ease-apple), border-color .5s var(--ease-apple)" }}
    >
      <div
        className={`border-b ${
          onDark
            ? "border-transparent bg-transparent"
            : "border-line bg-paper/90 backdrop-blur-xl backdrop-saturate-150"
        }`}
        style={{ transition: "background-color .5s var(--ease-apple), border-color .5s var(--ease-apple)" }}
      >
        <div className="mx-auto flex h-16 max-w-shell items-center gap-3 px-5 lg:px-8">
          <Link
            href="/"
            className={`shrink-0 text-[1.125rem] font-semibold tracking-[-0.035em] transition-colors duration-500 ${
              onDark ? "text-white" : "text-ink"
            }`}
          >
            Oz<span className={onDark ? "text-signal-glow" : "text-signal"}>Ilan</span>
          </Link>

          <nav className="ml-6 hidden items-center lg:flex" onMouseLeave={() => setMenu(null)}>
            {CATEGORIES.map((c) => (
              <div key={c.slug} className="relative" onMouseEnter={() => setMenu(c.slug)}>
                <Link
                  href={`/arama/?k=${c.slug}`}
                  className={`flex h-16 items-center px-3.5 text-[0.8125rem] transition-colors duration-300 ${
                    menu === c.slug ? (onDark ? "text-white" : "text-ink") : tone
                  }`}
                >
                  {c.label}
                </Link>
                <div
                  className={`absolute left-0 top-full origin-top overflow-hidden rounded-xl border border-line bg-paper-2 shadow-lift ${
                    menu === c.slug ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                  }`}
                  style={{
                    width: `min(${c.subs.length > 4 ? 62 : 46}rem, calc(100vw - 3rem))`,
                    transform: menu === c.slug ? "translateY(0) scale(1)" : "translateY(-6px) scale(.98)",
                    transition: "opacity .32s var(--ease-apple), transform .32s var(--ease-apple)",
                  }}
                >
                  <div className="grid gap-x-6 gap-y-5 p-5" style={{ gridTemplateColumns: `repeat(${Math.min(c.subs.length, 4)}, minmax(0, 1fr))` }}>
                    {c.subs.map((s) => (
                      <div key={s.slug} className="min-w-0">
                        <Link
                          href={`/arama/?k=${c.slug}&a=${s.slug}`}
                          className="block truncate text-[0.8125rem] font-medium text-ink transition hover:text-signal"
                        >
                          {s.label}
                        </Link>
                        <div className="mt-1.5 space-y-0.5">
                          {(s.tree ?? []).slice(0, 7).map((n) => (
                            <Link
                              key={n.slug}
                              href={`/arama/?k=${c.slug}&a=${s.slug}&p=${n.slug}`}
                              className="block truncate text-[0.78rem] text-mute transition hover:text-signal"
                            >
                              {n.label}
                            </Link>
                          ))}
                          {(s.tree?.length ?? 0) > 7 && (
                            <Link
                              href={`/arama/?k=${c.slug}&a=${s.slug}`}
                              className="block text-[0.78rem] text-signal transition hover:underline"
                            >
                              +{(s.tree?.length ?? 0) - 7} tümü →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-line bg-paper px-5 py-2.5">
                    <span className="text-2xs text-mute">{c.tagline}</span>
                    <Link href={`/arama/?k=${c.slug}`} className="text-2xs text-signal transition hover:underline">
                      Tüm {c.label.toLocaleLowerCase("tr")} ilanları →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/arama/?s=value" className={`flex h-16 items-center px-3.5 text-[0.8125rem] transition-colors duration-300 ${tone}`}>
              Fırsatlar
            </Link>
          </nav>

          {!home && <div className="ml-auto hidden max-w-sm flex-1 md:block"><Omnibox /></div>}

          <div className={`hidden items-center gap-0.5 lg:flex ${home ? "ml-auto" : "ml-3"}`}>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3 py-1.5 text-[0.8125rem] transition duration-300 ${
                  path === n.href ? (onDark ? "text-white" : "text-ink") : tone
                } ${onDark ? "hover:bg-white/10" : "hover:bg-paper-3"}`}
              >
                {n.label}
                {n.href === "/mesajlar/" && unread > 0 && (
                  <span className="num ml-1.5 rounded-full bg-signal px-1.5 py-0.5 text-[0.6875rem] text-white">{unread}</span>
                )}
              </Link>
            ))}
            <Link
              href={me ? "/hesap/" : "/giris/"}
              className={`rounded-full px-3 py-1.5 text-[0.8125rem] transition duration-300 ${tone} ${
                onDark ? "hover:bg-white/10" : "hover:bg-paper-3"
              }`}
            >
              {me ? me.name.split(" ")[0] : "Giriş"}
            </Link>
            <Link
              href="/ilan-ver/"
              className={`ml-2 rounded-full px-4 py-2 text-[0.8125rem] font-medium transition duration-300 ${
                onDark ? "bg-white text-navy-900 hover:bg-white/90" : "bg-signal text-white shadow-plaque-blue hover:bg-signal-ink"
              }`}
            >
              İlan ver
            </Link>
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü"
            className={`ml-auto grid h-10 w-10 place-items-center rounded-full transition lg:hidden ${
              onDark ? "text-white hover:bg-white/10" : "text-ink hover:bg-paper-3"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>

        {!home && <div className="mx-auto max-w-shell px-5 pb-3 md:hidden"><Omnibox /></div>}
      </div>

      <div
        className="overflow-hidden border-line bg-paper/95 backdrop-blur-xl lg:hidden"
        style={{
          maxHeight: open ? 620 : 0,
          borderBottomWidth: open ? 1 : 0,
          transition: "max-height .5s var(--ease-apple), border-width .3s",
        }}
      >
        <div className="mx-auto max-w-shell px-5 py-2">
          <div className="py-2"><Omnibox /></div>
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
          <Link href="/ilan-ver/" className="btn-signal my-3 w-full">İlan ver</Link>
        </div>
      </div>
    </header>
  );
}
