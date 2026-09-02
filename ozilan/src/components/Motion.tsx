"use client";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type CSSProperties, type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/* ════════════════════════════════════════════════ hareket tercihi
   İşletim sisteminde "hareketi azalt" açıksa efektler kapanır — ama
   kullanıcı bunu siteden geri açabilir. Tercih tarayıcıda saklanır. */

type MotionMode = "full" | "reduced";
const MotionCtx = createContext<{ mode: MotionMode; toggle: () => void; osReduced: boolean }>({
  mode: "full", toggle: () => {}, osReduced: false,
});
export const useMotion = () => useContext(MotionCtx);
export const useMotionOK = () => useContext(MotionCtx).mode === "full";

const KEY = "ozilan.motion";

export function MotionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MotionMode>("full");
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
    const apply = () => {
      const os = mq.matches;
      setOsReduced(os);
      const next: MotionMode = saved === "full" || saved === "reduced" ? (saved as MotionMode) : os ? "reduced" : "full";
      setMode(next);
      document.documentElement.dataset.motion = next;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const toggle = useCallback(() => {
    setMode((m) => {
      const next: MotionMode = m === "full" ? "reduced" : "full";
      document.documentElement.dataset.motion = next;
      try { localStorage.setItem(KEY, next); } catch {}
      return next;
    });
  }, []);

  return <MotionCtx.Provider value={{ mode, toggle, osReduced }}>{children}</MotionCtx.Provider>;
}

export function MotionToggle({ className = "" }: { className?: string }) {
  const { mode, toggle, osReduced } = useMotion();
  const on = mode === "full";
  return (
    <button
      onClick={toggle}
      title={osReduced ? "Sisteminizde “hareketi azalt” açık — efektleri yine de açabilirsiniz" : undefined}
      className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 h-9 text-[0.8125rem] transition ${
        on ? "border-signal/40 bg-signal/10 text-signal" : "border-line bg-paper-2 text-mute"
      } ${className}`}
      aria-pressed={on}
    >
      <span className={`relative h-3.5 w-6 rounded-full transition ${on ? "bg-signal" : "bg-line-strong"}`}>
        <span
          className="absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow-plaque-sm"
          style={{ left: on ? 13 : 3, transition: "left .35s var(--ease-apple)" }}
        />
      </span>
      Hareket {on ? "açık" : "kapalı"}
    </button>
  );
}

/* ════════════════════════════════════════════════════════ Reveal
   Görünüme girince 3B olarak yerine oturan sarmalayıcı. */

export type RvKind = "up" | "tilt" | "flipL" | "flipR" | "zoom" | "rise" | "spin";

export function Reveal({
  children, delay = 0, kind = "up", className = "", once = true,
}: {
  children: ReactNode; delay?: number; kind?: RvKind; className?: string; once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setSeen(true); if (once) io.disconnect(); }
        else if (!once) setSeen(false);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      data-rv={kind}
      className={`rv ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: seen ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════ kelime kelime başlık */

export function SplitText({
  text, className = "", delay = 0, step = 55,
}: { text: string; className?: string; delay?: number; step?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const words = text.split(" ");
  return (
    <span ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="split-w">
            <span className={`split-i ${seen ? "is-in" : ""}`} style={{ transitionDelay: `${delay + i * step}ms` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

/* ════════════════════════════════════════════════ fare ile 3B eğim */

export function Tilt({
  children, max = 9, className = "", glare = true,
}: { children: ReactNode; max?: number; className?: string; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const ok = useMotionOK();
  const [st, setSt] = useState<CSSProperties>({});
  const [gl, setGl] = useState({ x: 50, y: 50, o: 0 });

  const move = (e: React.MouseEvent) => {
    if (!ok || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setSt({
      transform: `perspective(900px) rotateX(${(0.5 - py) * max * 2}deg) rotateY(${(px - 0.5) * max * 2}deg) translateZ(14px)`,
      transition: "transform .12s linear",
    });
    setGl({ x: px * 100, y: py * 100, o: 1 });
  };
  const leave = () => {
    setSt({ transform: "perspective(900px) rotateX(0) rotateY(0) translateZ(0)", transition: "transform .7s var(--ease-apple)" });
    setGl((g) => ({ ...g, o: 0 }));
  };

  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} style={st} className={`tilt-host ${className}`}>
      {children}
      {glare && ok && (
        <span
          aria-hidden
          className="tilt-glare"
          style={{
            opacity: gl.o,
            background: `radial-gradient(220px circle at ${gl.x}% ${gl.y}%, rgba(255,255,255,.35), transparent 62%)`,
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ kaydırma ölçüleri */

export function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => { if (raf) return; raf = requestAnimationFrame(() => { setY(window.scrollY); raf = 0; }); };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return y;
}

/** Sabitlenmiş bölümün ekrandan geçiş ilerlemesi 0..1 */
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
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [ref]);
  return p;
}

/** Öğe ekranda ilerledikçe -1..1 (üstte -1, ortada 0, altta 1) */
export function useViewportPos(ref: React.RefObject<HTMLElement | null>) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      setV((mid - window.innerHeight / 2) / (window.innerHeight / 2 + r.height / 2));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [ref]);
  return v;
}

/* ═════════════════════════════════════════════════════════ sayaç */

export function CountUp({ to, dur = 1400, format }: { to: number; dur?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  const ok = useMotionOK();
  useEffect(() => {
    if (!ok) { setN(to); return; }
    const el = ref.current; if (!el) return;
    let raf = 0, t0 = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const tick = (t: number) => {
        if (!t0) t0 = t;
        const k = Math.min(1, (t - t0) / dur);
        setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [to, dur, ok]);
  return <span ref={ref}>{format ? format(n) : n}</span>;
}

/* ═══════════════════════════════════════════ sayfa geçişi + ilerleme */

export function PageTransition({ children }: { children: ReactNode }) {
  const path = usePathname();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [path]);
  return <div key={path} className="page-anim">{children}</div>;
}

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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        className="h-full"
        style={{
          width: `${w}%`,
          background: "linear-gradient(90deg,#1B4FD1,#2C6BF5 45%,#5A8DFF)",
          boxShadow: "0 0 14px rgba(90,141,255,.7)",
          transition: "width .1s linear",
        }}
      />
    </div>
  );
}

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

export const useMemoOnce = useMemo;
