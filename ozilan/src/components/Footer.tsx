import Link from "next/link";
import { CATEGORIES } from "@/data/taxonomy";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-ink text-paper">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 md:grid-cols-4 lg:px-6">
        <div className="md:col-span-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl">OzIlan</span>
            <span className="h-1.5 w-1.5 bg-signal" />
          </div>
          <p className="mt-3 max-w-xs text-[0.82rem] leading-relaxed text-paper/60">
            Her ilanda fiyatın piyasa karşısındaki yerini ve satıcının güven skorunu
            açıkça gösteren ilan platformu.
          </p>
        </div>

        {CATEGORIES.map((c) => (
          <div key={c.slug}>
            <p className="eyebrow !text-paper/40">{c.label}</p>
            <ul className="mt-3 space-y-1.5">
              {c.subs.map((s) => (
                <li key={s.slug}>
                  <Link href={`/arama/?k=${c.slug}&a=${s.slug}`} className="text-[0.85rem] text-paper/75 transition hover:text-signal">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-line">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-5 text-[0.72rem] text-paper/45 md:flex-row md:items-center md:justify-between lg:px-6">
          <p>© 2026 OzIlan — demo amaçlı örnek platform. Veriler kurgusaldır, tarayıcınızda saklanır.</p>
          <p className="font-mono uppercase tracking-[0.14em]">Statik dağıtım · GitHub Pages</p>
        </div>
      </div>
    </footer>
  );
}
