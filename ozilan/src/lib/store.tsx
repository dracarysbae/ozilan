"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Account, Listing, Message, Report, Seller, Thread } from "./types";
import { SEED_LISTINGS, SEED_SELLERS } from "@/data/seed";

const KEY = "ozilan.v1";

type Persisted = {
  account: Account | null;
  accounts: (Account & { pass: string })[];
  listings: Listing[];
  overrides: Record<string, Partial<Listing>>;
  favorites: string[];
  threads: Thread[];
  messages: Message[];
  reports: Report[];
  recent: string[];
  searches: { id: string; label: string; href: string; at: number }[];
};

const blank: Persisted = {
  account: null, accounts: [], listings: [], overrides: {}, favorites: [],
  threads: [], messages: [], reports: [], recent: [], searches: [],
};

type Ctx = {
  ready: boolean;
  state: Persisted;
  pool: Listing[];
  sellers: Record<string, Seller>;
  me: Account | null;
  signIn: (email: string, pass: string) => string | null;
  signUp: (a: Omit<Account, "id" | "createdAt" | "role"> & { pass: string }) => string | null;
  signOut: () => void;
  demoSignIn: () => void;
  toggleFav: (id: string) => void;
  isFav: (id: string) => boolean;
  publish: (l: Omit<Listing, "id" | "createdAt" | "bumpedAt" | "sellerId" | "views" | "status" | "art">) => string;
  removeListing: (id: string) => void;
  setStatus: (id: string, s: Listing["status"]) => void;
  bump: (id: string) => void;
  view: (id: string) => void;
  openThread: (listingId: string) => string;
  send: (threadId: string, body: string) => void;
  report: (listingId: string, reason: string, note: string) => void;
  resolveReport: (id: string) => void;
  saveSearch: (label: string, href: string) => void;
  dropSearch: (id: string) => void;
  reset: () => void;
};

const C = createContext<Ctx | null>(null);

const uid = (p: string) => p + Math.random().toString(36).slice(2, 9).toUpperCase();

const REPLIES = [
  "Merhaba, ilan hâlâ güncel. Ne zaman görmek istersiniz?",
  "İyi günler, pazarlık payı var. Ciddi alıcıysanız arayabilirsiniz.",
  "Merhaba, ürün elimde mevcut. Kargo ile de gönderebilirim.",
  "Selam, hafta sonu müsaitim. Adresi mesajla paylaşayım mı?",
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(blank);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...blank, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  }, [state, ready]);

  const sellers = useMemo(() => {
    const m: Record<string, Seller> = Object.fromEntries(SEED_SELLERS.map((s) => [s.id, s]));
    for (const a of state.accounts) {
      m[a.id] = {
        id: a.id, name: a.name, kind: a.kind, city: "İstanbul", joinedAt: a.createdAt,
        verified: false, rating: 0, reviews: 0, responseMins: 15, phone: a.phone,
      };
    }
    return m;
  }, [state.accounts]);

  const pool = useMemo(() => {
    const merged = [...state.listings, ...SEED_LISTINGS].map((l) =>
      state.overrides[l.id] ? { ...l, ...state.overrides[l.id] } : l,
    );
    return merged.sort((a, b) => b.bumpedAt - a.bumpedAt);
  }, [state.listings, state.overrides]);

  const patch = useCallback((fn: (s: Persisted) => Persisted) => setState(fn), []);

  const signIn: Ctx["signIn"] = (email, pass) => {
    const a = state.accounts.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!a) return "Bu e-posta ile kayıtlı hesap yok.";
    if (a.pass !== pass) return "Şifre hatalı.";
    const { pass: _p, ...acc } = a;
    patch((s) => ({ ...s, account: acc }));
    return null;
  };

  const signUp: Ctx["signUp"] = (input) => {
    if (state.accounts.some((x) => x.email.toLowerCase() === input.email.trim().toLowerCase()))
      return "Bu e-posta zaten kayıtlı.";
    const acc: Account & { pass: string } = {
      id: uid("u"), name: input.name, email: input.email.trim(), phone: input.phone,
      kind: input.kind, createdAt: Date.now(), role: "user", pass: input.pass,
    };
    const { pass: _p, ...pub } = acc;
    patch((s) => ({ ...s, accounts: [...s.accounts, acc], account: pub }));
    return null;
  };

  const demoSignIn = () => {
    const existing = state.accounts.find((a) => a.email === "demo@ozilan.app");
    if (existing) { const { pass: _p, ...pub } = existing; patch((s) => ({ ...s, account: pub })); return; }
    const acc: Account & { pass: string } = {
      id: "u-demo", name: "Demo Kullanıcı", email: "demo@ozilan.app", phone: "0532 000 00 00",
      kind: "bireysel", createdAt: Date.now() - 400 * 86400000, role: "admin", pass: "demo1234",
    };
    const { pass: _p, ...pub } = acc;
    // seed a couple of conversations so the inbox is not a dead end
    const picks = SEED_LISTINGS.slice(0, 3);
    const threads: Thread[] = picks.map((l, i) => ({
      id: `t-demo-${i}`, listingId: l.id, buyerId: acc.id, sellerId: l.sellerId,
      updatedAt: Date.now() - i * 3600_000,
    }));
    const messages: Message[] = threads.flatMap((t, i) => [
      { id: uid("m"), threadId: t.id, from: acc.id, body: "Merhaba, ilan hâlâ güncel mi?", at: t.updatedAt - 900_000 },
      { id: uid("m"), threadId: t.id, from: t.sellerId, body: REPLIES[i % REPLIES.length], at: t.updatedAt },
    ]);
    patch((s) => ({
      ...s, accounts: [...s.accounts, acc], account: pub,
      threads: [...s.threads, ...threads], messages: [...s.messages, ...messages],
      favorites: Array.from(new Set([...s.favorites, ...SEED_LISTINGS.slice(4, 9).map((l) => l.id)])),
    }));
  };

  const signOut = () => patch((s) => ({ ...s, account: null }));

  const toggleFav = (id: string) =>
    patch((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites] }));

  const publish: Ctx["publish"] = (draft) => {
    const id = uid("L");
    const now = Date.now();
    const l: Listing = {
      ...draft, id, createdAt: now, bumpedAt: now,
      sellerId: state.account?.id ?? "anon", views: 0, status: "active",
      art: Math.floor(Math.random() * 999999),
    };
    patch((s) => ({ ...s, listings: [l, ...s.listings] }));
    return id;
  };

  const setStatus = (id: string, st: Listing["status"]) =>
    patch((s) => ({ ...s, overrides: { ...s.overrides, [id]: { ...s.overrides[id], status: st } } }));

  const removeListing = (id: string) =>
    patch((s) => ({
      ...s,
      listings: s.listings.filter((l) => l.id !== id),
      overrides: s.listings.some((l) => l.id === id) ? s.overrides : { ...s.overrides, [id]: { ...s.overrides[id], status: "removed" } },
      favorites: s.favorites.filter((f) => f !== id),
    }));

  const bump = (id: string) =>
    patch((s) => ({ ...s, overrides: { ...s.overrides, [id]: { ...s.overrides[id], bumpedAt: Date.now() } } }));

  const view = (id: string) =>
    patch((s) => (s.recent[0] === id ? s : { ...s, recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 24) }));

  const openThread: Ctx["openThread"] = (listingId) => {
    const me = state.account;
    const listing = pool.find((l) => l.id === listingId);
    if (!me || !listing) return "";
    const found = state.threads.find((t) => t.listingId === listingId && t.buyerId === me.id);
    if (found) return found.id;
    const t: Thread = { id: uid("t"), listingId, buyerId: me.id, sellerId: listing.sellerId, updatedAt: Date.now() };
    patch((s) => ({ ...s, threads: [t, ...s.threads] }));
    return t.id;
  };

  const send: Ctx["send"] = (threadId, body) => {
    const me = state.account;
    if (!me || !body.trim()) return;
    const t = state.threads.find((x) => x.id === threadId);
    const msg: Message = { id: uid("m"), threadId, from: me.id, body: body.trim(), at: Date.now() };
    patch((s) => ({
      ...s, messages: [...s.messages, msg],
      threads: s.threads.map((x) => (x.id === threadId ? { ...x, updatedAt: msg.at } : x)),
    }));
    if (t) {
      const reply: Message = {
        id: uid("m"), threadId, from: t.sellerId,
        body: REPLIES[Math.floor(Math.random() * REPLIES.length)], at: Date.now() + 1200,
      };
      setTimeout(() => patch((s) => ({
        ...s, messages: [...s.messages, reply],
        threads: s.threads.map((x) => (x.id === threadId ? { ...x, updatedAt: reply.at } : x)),
      })), 1400);
    }
  };

  const report: Ctx["report"] = (listingId, reason, note) =>
    patch((s) => ({
      ...s,
      reports: [{ id: uid("r"), listingId, reason, note, at: Date.now(), by: s.account?.id ?? "anon", state: "open" }, ...s.reports],
    }));

  const resolveReport = (id: string) =>
    patch((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, state: "resolved" } : r)) }));

  const saveSearch: Ctx["saveSearch"] = (label, href) =>
    patch((s) => (s.searches.some((x) => x.href === href) ? s : { ...s, searches: [{ id: uid("q"), label, href, at: Date.now() }, ...s.searches].slice(0, 20) }));

  const dropSearch = (id: string) => patch((s) => ({ ...s, searches: s.searches.filter((x) => x.id !== id) }));

  const reset = () => { setState(blank); try { localStorage.removeItem(KEY); } catch { /* */ } };

  const value: Ctx = {
    ready, state, pool, sellers, me: state.account,
    signIn, signUp, signOut, demoSignIn,
    toggleFav, isFav: (id) => state.favorites.includes(id),
    publish, removeListing, setStatus, bump, view,
    openThread, send, report, resolveReport, saveSearch, dropSearch, reset,
  };

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
