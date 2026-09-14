"use client";
import { useEffect, useRef } from "react";
import { useFrame, useMotionOK } from "./Motion";

/** One observer for staggered entrances. The content stays visible without JavaScript. */
export function ScrollExperience() {
  const marker = useRef<HTMLSpanElement>(null);
  const hero = useRef<HTMLElement | null>(null);
  const motion = useMotionOK();
  useEffect(() => {
    const root = marker.current?.parentElement;
    if (!root) return;
    hero.current = root.querySelector<HTMLElement>(".discovery-hero,.vehicle-intro");
    if (!motion) return;
    const seen = new WeakSet<Element>();
    const selector = ".editorial-heading,.decision-copy,.decision-panel,.editorial-listings>a,.editorial-cities>a,.listing-invitation>div:not(.invitation-orb),.vehicle-type-grid>button,.vehicle-step,.vehicle-tree,.vehicle-primary-grid>.vehicle-facet,.vehicle-more";
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add("cinema-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: .09 });
    const register = () => root.querySelectorAll<HTMLElement>(selector).forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      const siblings = el.parentElement ? [...el.parentElement.children].filter(n=>n.matches(selector)) : [];
      el.style.setProperty("--entrance-delay",`${Math.max(0,siblings.indexOf(el)%4)*85}ms`);
      el.classList.add("cinema-ready");
      observer.observe(el);
    });
    register();
    const changes = new MutationObserver(register);
    changes.observe(root,{childList:true,subtree:true});
    return () => {
      observer.disconnect(); changes.disconnect();
      root.querySelectorAll<HTMLElement>(".cinema-ready").forEach(el=>{el.classList.remove("cinema-ready","cinema-visible");el.style.removeProperty("--entrance-delay");});
      if(hero.current) { hero.current.style.removeProperty("--scroll-drift"); hero.current.style.removeProperty("--scroll-rotation"); }
    };
  },[motion]);
  useFrame(({sy})=>{
    const el=hero.current;
    if(!el||!motion) return;
    const distance=Math.min(sy,1000);
    el.style.setProperty("--scroll-drift",`${(distance*.16).toFixed(1)}px`);
    el.style.setProperty("--scroll-rotation",`${(distance*.025).toFixed(2)}deg`);
  },[motion]);
  return <span ref={marker} hidden aria-hidden="true" />;
}
