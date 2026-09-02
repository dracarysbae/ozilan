"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/* ------------------------------------------------------------------ Reveal
   Görünüm alanına girince yükselerek beliren sarmalayıcı.
   Bir kez tetiklenir; geri kaydırınca kaybolmaz (Apple böyle yapar). */
export function Reveal({
  children,
  delay = 0,
  scale = false,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  scale?: boolean;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`${scale ? "rv-scale" : "rv"} ${seen ? "rv-in" : ""} ${className}`}
      style={{ transitionDelay: seen ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------- useScrollY
   rAF ile kısılmış sayfa kaydırma konumu. */
export function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { setY(window.scrollY); raf = 0; });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return y;
}

/* ------------------------------------------------------------- useProgress
   Bir öğenin ekrandan geçiş ilerlemesi 0..1 — sabitlenmiş bölümler için. */
export function useProgress(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) { setP(0); return; }
      setP(Math.min(1, Math.max(0, -r.top / total)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
  return p;
}

/* ------------------------------------------------------- PageTransition
   Rota değişiminde içeriği yumuşakça yeniden getirir ve başa sarar. */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = usePathname();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [path]);
  return <div key={path} className="page-anim">{children}</div>;
}

/* --------------------------------------------------------- ScrollProgress
   Sayfanın en üstünde ince ilerleme çizgisi. */
export function ScrollProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setW(h > 0 ? (window.scrollY / h) * 100 : 0);
        raf = 0;
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div
        className="h-full bg-gradient-to-r from-signal to-signal-glow"
        style={{ width: `${w}%`, transition: "width .12s linear" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- useMedia
   SSR güvenli medya sorgusu (ilk kare false döner, sonra düzeltir). */
export function useMedia(q: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(q);
    const h = () => setOn(m.matches);
    h();
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, [q]);
  return on;
}
