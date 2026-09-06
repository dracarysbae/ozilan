"use client";
/* ═══════════════════════════════════════════════════════════════════════
   OzIlan hareket motoru v6 — "Akış"

   Tek bir requestAnimationFrame döngüsü. Kaydırma değeri lerp ile
   yumuşatılır; her abone her karede ölçüm alır ve stilini DOM'a doğrudan
   yazar. CSS sınıf/öncelik oyunları yok: ne görüyorsan JS onu yazmıştır.
   ═══════════════════════════════════════════════════════════════════════ */
import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type CSSProperties, type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/* ───────────────────────────────────────────── mod & sağlayıcı */

type MotionMode = "full" | "reduced";
const MotionCtx = createContext<{ mode: MotionMode; toggle: () => void; osReduced: boolean }>({
  mode: "full", toggle: () => {}, osReduced: false,
});
export const useMotion = () => useContext(MotionCtx);
export const useMotionOK = () => useContext(MotionCtx).mode === "full";
const KEY = "ozilan.motion";

let MODE: MotionMode = "full";
const isFull = () => MODE === "full";

export function MotionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MotionMode>("full");
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
    // Kullanıcı açıkça kapatmadıysa efektler AÇIK — işletim sistemi tercihi yalnızca ipucu.
    const next: MotionMode = saved === "reduced" ? "reduced" : "full";
    setOsReduced(mq.matches);
    setMode(next); MODE = next;
    document.documentElement.dataset.motion = next;
    const onMq = () => setOsReduced(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  const toggle = useCallback(() => {
    setMode((m) => {
      const next: MotionMode = m === "full" ? "reduced" : "full";
      MODE = next;
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
      title={osReduced ? "Sisteminizde “hareketi azalt” açık — efektler yine de açık tutulabilir" : undefined}
      className={`inline-flex h-9 items-center gap-2.5 rounded-full border px-3.5 text-[0.8125rem] transition ${
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

/* ───────────────────────────────────────────── kare döngüsü */

export type Frame = { y: number; sy: number; v: number; w: number; h: number; t: number };
type Sub = (f: Frame) => void;
const subs = new Set<Sub>();
let raf = 0, y = 0, sy = 0, lastY = 0, v = 0;

function tick(t: number) {
  y = window.scrollY;
  sy += (y - sy) * 0.16;
  if (Math.abs(y - sy) < 0.08) sy = y;
  v = y - lastY; lastY = y;
  const f: Frame = { y, sy, v, w: window.innerWidth, h: window.innerHeight, t };
  subs.forEach((s) => { try { s(f); } catch { /* bir abone patlarsa döngü ölmesin */ } });
  raf = subs.size ? requestAnimationFrame(tick) : 0;
}
function subscribe(s: Sub) {
  subs.add(s);
  if (!raf) { sy = y = lastY = window.scrollY; raf = requestAnimationFrame(tick); }
  return () => { subs.delete(s); if (!subs.size && raf) { cancelAnimationFrame(raf); raf = 0; } };
}
/** her karede çağrılan geri çağrı — DOM'a doğrudan yazmak için */
export function useFrame(cb: Sub, deps: unknown[] = []) {
  const ref = useRef(cb); ref.current = cb;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => subscribe((f) => ref.current(f)), deps);
}

/* ───────────────────────────────────────────── yardımcılar */

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 4);
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const ease = { out: easeOut, inOut: easeInOut, clamp: clamp01 };

/** görünüm alanına giriş 0→1 ve üstten çıkış 0→1 */
function viewProgress(r: DOMRect, h: number, enterSpan = 0.62) {
  const enter = clamp01((h - r.top) / (h * enterSpan + r.height * 0.25));
  const exit = clamp01((-r.top + 24) / (r.height + h * 0.4));
  return { enter, exit };
}

/* ───────────────────────────────────────────── Reveal (scrub) */

export type RvKind = "up" | "tilt" | "flipL" | "flipR" | "zoom" | "rise" | "spin" | "clip" | "fade" | "slideL" | "slideR";

type Start = { tx?: number; ty?: number; tz?: number; rx?: number; ry?: number; rz?: number; s?: number; blur?: number; clip?: boolean };
const START: Record<RvKind, Start> = {
  up:     { ty: 64 },
  fade:   { ty: 14 },
  rise:   { ty: 96, s: 0.96, blur: 8 },
  zoom:   { s: 0.82, blur: 10, ty: 20 },
  tilt:   { rx: 20, ty: 84, tz: -120, s: 0.94 },
  flipL:  { ry: -30, tx: -90, ty: 30, tz: -110 },
  flipR:  { ry: 30, tx: 90, ty: 30, tz: -110 },
  spin:   { rx: -26, rz: -8, ty: 96, tz: -160, s: 0.9 },
  slideL: { tx: -120, blur: 4 },
  slideR: { tx: 120, blur: 4 },
  clip:   { ty: 30, clip: true },
};

export function Reveal({
  children, delay = 0, kind = "up", className = "", once = false, exit = true, style,
}: {
  children: ReactNode; delay?: number; kind?: RvKind; className?: string;
  once?: boolean; exit?: boolean; style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const last = useRef("");

  useFrame(({ h }) => {
    const el = ref.current; if (!el) return;
    if (!isFull()) { if (last.current !== "off") { el.style.cssText = ""; last.current = "off"; } return; }
    if (done.current) return;
    const r = el.getBoundingClientRect();
    if (r.height === 0 && r.width === 0) return;
    let { enter, exit: x } = viewProgress(r, h);
    enter = clamp01((enter - delay / 1400) / (1 - Math.min(0.6, delay / 1400)));
    const e = easeOut(enter);
    const S = START[kind];
    const k = 1 - e;
    const tx = (S.tx ?? 0) * k, ty = (S.ty ?? 0) * k - (exit ? x * 46 : 0);
    const tz = (S.tz ?? 0) * k, rx = (S.rx ?? 0) * k, ry = (S.ry ?? 0) * k, rz = (S.rz ?? 0) * k;
    const s = 1 - (1 - (S.s ?? 1)) * k - (exit ? x * 0.04 : 0);
    const blur = (S.blur ?? 0) * k;
    const op = Math.min(e * 1.15, 1) * (exit ? 1 - x * 0.7 : 1);
    const need3d = S.tz || S.rx || S.ry;
    const tr = `${need3d ? "perspective(1200px) " : ""}translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,${tz.toFixed(1)}px)`
      + (rx ? ` rotateX(${rx.toFixed(2)}deg)` : "") + (ry ? ` rotateY(${ry.toFixed(2)}deg)` : "") + (rz ? ` rotateZ(${rz.toFixed(2)}deg)` : "")
      + (s !== 1 ? ` scale(${s.toFixed(4)})` : "");
    const clip = S.clip ? `inset(${((1 - e) * 100).toFixed(1)}% 0 0 0 round 12px)` : "";
    const sig = `${tr}|${op.toFixed(3)}|${blur.toFixed(2)}|${clip}`;
    if (sig === last.current) return;
    last.current = sig;
    el.style.transform = tr;
    el.style.opacity = op.toFixed(3);
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
    if (S.clip) el.style.clipPath = clip;
    if (once && enter >= 1) { done.current = true; el.style.willChange = "auto"; }
  }, [kind, delay, once, exit]);

  return (
    <div ref={ref} className={`rv ${className}`} style={{ ...style, transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────── SplitText */

export function SplitText({ text, step = 55, className = "" }: { text: string; step?: number; className?: string }) {
  const words = useMemo(() => text.split(" "), [text]);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const host = useRef<HTMLSpanElement>(null);
  const lastP = useRef(-1);

  useFrame(({ h }) => {
    const el = host.current; if (!el) return;
    if (!isFull()) { refs.current.forEach((w) => { if (w) w.style.cssText = ""; }); return; }
    const r = el.getBoundingClientRect();
    const { enter } = viewProgress(r, h, 0.5);
    if (Math.abs(enter - lastP.current) < 0.002 && enter === 1) return;
    lastP.current = enter;
    refs.current.forEach((w, i) => {
      if (!w) return;
      const local = clamp01((enter - (i * step) / 1800) / 0.55);
      const e = easeOut(local);
      w.style.transform = `translate3d(0,${((1 - e) * 110).toFixed(1)}%,0) rotateZ(${((1 - e) * 5).toFixed(2)}deg)`;
      w.style.opacity = e.toFixed(3);
    });
  }, [step, words.length]);

  return (
    <span ref={host} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="split-w">
            <span ref={(n) => { refs.current[i] = n; }} className="split-i">{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/* ───────────────────────────────────────────── Tilt + spot ışık */

export function Tilt({ children, max = 8, className = "", glare = true }: { children: ReactNode; max?: number; className?: string; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ rx: 0, ry: 0, mx: 50, my: 50, on: 0 });
  const cur = useRef({ rx: 0, ry: 0, mx: 50, my: 50, on: 0 });

  useFrame(() => {
    const el = ref.current; if (!el) return;
    const t = target.current, c = cur.current;
    c.rx += (t.rx - c.rx) * 0.14; c.ry += (t.ry - c.ry) * 0.14;
    c.mx += (t.mx - c.mx) * 0.18; c.my += (t.my - c.my) * 0.18; c.on += (t.on - c.on) * 0.12;
    if (Math.abs(c.rx) < 0.01 && Math.abs(c.ry) < 0.01 && c.on < 0.01 && t.on === 0) {
      if (el.style.transform) { el.style.transform = ""; el.style.setProperty("--spot", "0"); }
      return;
    }
    el.style.transform = `perspective(1100px) rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg) translateZ(${(c.on * 6).toFixed(1)}px)`;
    el.style.setProperty("--mx", `${c.mx.toFixed(1)}%`);
    el.style.setProperty("--my", `${c.my.toFixed(1)}%`);
    el.style.setProperty("--spot", c.on.toFixed(3));
  }, []);

  const onMove = (e: React.MouseEvent) => {
    if (!isFull()) return;
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    target.current = { rx: (0.5 - py) * max * 2, ry: (px - 0.5) * max * 2, mx: px * 100, my: py * 100, on: 1 };
  };
  const onLeave = () => { target.current = { ...target.current, rx: 0, ry: 0, on: 0 }; };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt-host ${className}`}>
      {children}
      {glare && <span className="tilt-glare" aria-hidden />}
    </div>
  );
}

/* ───────────────────────────────────────────── Manyetik */

export function Magnetic({ children, strength = 0.35, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useRef({ x: 0, y: 0 }); const c = useRef({ x: 0, y: 0 });
  useFrame(() => {
    const el = ref.current; if (!el) return;
    c.current.x += (t.current.x - c.current.x) * 0.18; c.current.y += (t.current.y - c.current.y) * 0.18;
    if (Math.abs(c.current.x) < 0.02 && Math.abs(c.current.y) < 0.02 && !t.current.x && !t.current.y) { el.style.transform = ""; return; }
    el.style.transform = `translate3d(${c.current.x.toFixed(2)}px,${c.current.y.toFixed(2)}px,0)`;
  }, []);
  const onMove = (e: React.MouseEvent) => {
    if (!isFull()) return;
    const r = ref.current!.getBoundingClientRect();
    t.current = { x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength };
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => { t.current = { x: 0, y: 0 }; }} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────── Paralaks */

export function Parallax({ children, speed = -0.15, className = "", rotate = 0, style }: { children: ReactNode; speed?: number; className?: string; rotate?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(({ h }) => {
    const el = ref.current; if (!el) return;
    if (!isFull()) { el.style.transform = ""; return; }
    const r = el.getBoundingClientRect();
    const d = r.top + r.height / 2 - h / 2;
    const ty = d * speed, rz = (d / h) * rotate;
    el.style.transform = `translate3d(0,${ty.toFixed(1)}px,0)${rotate ? ` rotateZ(${rz.toFixed(2)}deg)` : ""}`;
  }, [speed, rotate]);
  return <div ref={ref} className={className} style={{ willChange: "transform", ...style }}>{children}</div>;
}

/* ───────────────────────────────────────────── Marquee */

export function Marquee({ children, speed = 40, className = "", reverse = false }: { children: ReactNode; speed?: number; className?: string; reverse?: boolean }) {
  return (
    <div className={`marquee ${className}`} style={{ ["--dur" as string]: `${speed}s`, ["--dir" as string]: reverse ? "reverse" : "normal" }}>
      <div className="marquee-track">{children}</div>
      <div className="marquee-track" aria-hidden>{children}</div>
    </div>
  );
}

/* ───────────────────────────────────────────── kaydırma ilerlemeleri */

export function useScrub(ref: React.RefObject<HTMLElement | null>, cb: (p: number, f: Frame) => void, deps: unknown[] = []) {
  useFrame((f) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const span = Math.max(1, r.height - f.h);
    cb(clamp01(-r.top / span), f);
  }, deps);
}

export function useProgress(ref: React.RefObject<HTMLElement | null>, steps = 240) {
  const [p, setP] = useState(0);
  const last = useRef(-1);
  useScrub(ref, (v) => {
    const q = Math.round(v * steps) / steps;
    if (q !== last.current) { last.current = q; setP(q); }
  }, [steps]);
  return p;
}

export function useScrollY(quant = 2) {
  const [val, set] = useState(0);
  const last = useRef(-1);
  useFrame(({ sy }) => { const q = Math.round(sy / quant) * quant; if (q !== last.current) { last.current = q; set(q); } }, [quant]);
  return val;
}

export function useViewportPos(ref: React.RefObject<HTMLElement | null>) {
  const [pos, set] = useState(0);
  const last = useRef(-9);
  useFrame(({ h }) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const c = (r.top + r.height / 2) / h;
    const p = Math.max(-1, Math.min(1, (0.5 - c) * 2));
    const q = Math.round(p * 100) / 100;
    if (q !== last.current) { last.current = q; set(q); }
  }, []);
  return pos;
}

/* ───────────────────────────────────────────── Sayaç */

export function CountUp({ to, dur = 1500, format }: { to: number; dur?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [n, setN] = useState(0);
  useFrame(({ h, t }) => {
    const el = ref.current; if (!el || started.current) return;
    const r = el.getBoundingClientRect();
    if (r.top < h * 0.92 && r.bottom > 0) {
      started.current = true;
      if (!isFull()) { setN(to); return; }
      const t0 = t;
      const run = (now: number) => {
        const p = clamp01((now - t0) / dur);
        setN(Math.round(to * easeOut(p)));
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }
  }, [to, dur]);
  return <span ref={ref}>{format ? format(n) : n.toLocaleString("tr-TR")}</span>;
}

/* ───────────────────────────────────────────── Sayfa geçişi (perde) */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const curtain = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isFull() || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      let path = url.pathname + url.search;
      if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length) || "/";
      e.preventDefault();
      e.stopPropagation(); // Next Link kendi yönlendirmesini yapmasın
      if (leaving.current) return;
      leaving.current = true;
      const c = curtain.current!, p = page.current!;
      c.style.transition = "transform .55s cubic-bezier(.76,0,.24,1)";
      c.style.transform = "translate3d(0,0,0)";
      p.style.transition = "transform .55s cubic-bezier(.76,0,.24,1), opacity .4s ease";
      p.style.transform = "translate3d(0,-28px,0) scale(.985)";
      p.style.opacity = "0.35";
      setTimeout(() => router.push(path), 480);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  useLayoutEffect(() => {
    const c = curtain.current, p = page.current;
    if (!c || !p) return;
    window.scrollTo(0, 0);
    if (!isFull()) { c.style.transform = "translate3d(0,100%,0)"; p.style.cssText = ""; leaving.current = false; return; }
    const wasLeaving = leaving.current;
    leaving.current = false;
    p.style.transition = "none";
    p.style.transform = "translate3d(0,36px,0) scale(.99)";
    p.style.opacity = "0";
    c.style.transition = "none";
    c.style.transform = wasLeaving ? "translate3d(0,0,0)" : "translate3d(0,100%,0)";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      c.style.transition = "transform .6s cubic-bezier(.76,0,.24,1)";
      c.style.transform = "translate3d(0,-100%,0)";
      p.style.transition = "transform .85s cubic-bezier(.16,.84,.32,1) .12s, opacity .6s ease .12s";
      p.style.transform = "";
      p.style.opacity = "1";
      setTimeout(() => { c.style.transition = "none"; c.style.transform = "translate3d(0,100%,0)"; }, 700);
    }));
  }, [pathname]);

  return (
    <>
      <div ref={page} style={{ willChange: "transform, opacity" }}>{children}</div>
      <div ref={curtain} className="curtain" aria-hidden>
        <span className="curtain-mark">Oz<b>Ilan</b></span>
      </div>
    </>
  );
}

/* ───────────────────────────────────────────── ilerleme çubuğu */

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(({ sy, h }) => {
    const el = ref.current; if (!el) return;
    const max = Math.max(1, document.documentElement.scrollHeight - h);
    el.style.transform = `scaleX(${(sy / max).toFixed(4)})`;
  }, []);
  return <div ref={ref} className="scroll-bar" aria-hidden />;
}

/* ───────────────────────────────────────────── medya */

export function useMedia(q: string) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    f(); mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}

export const useMemoOnce = useMemo;
