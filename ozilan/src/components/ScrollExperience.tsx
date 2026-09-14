"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useFrame, useMotionOK } from "./Motion";

/** One observer for staggered entrances. The content stays visible without JavaScript. */
export function ScrollExperience() {
  const marker = useRef<HTMLSpanElement>(null);
  const hero = useRef<HTMLElement | null>(null);
  const cards = useRef<HTMLElement[]>([]);
  const ribbon = useRef<HTMLElement | null>(null);
  const motion = useMotionOK();
  useEffect(() => {
    const root = marker.current?.parentElement;
    if (!root) return;
    hero.current = root.querySelector<HTMLElement>(".discovery-hero,.vehicle-intro");
    ribbon.current = root.querySelector<HTMLElement>(".discovery-ribbon");
    if (!motion) return;
    const seen = new WeakSet<Element>();
    const selector = ".editorial-heading,.decision-copy,.decision-panel,.editorial-cities>a,.listing-invitation>div:not(.invitation-orb),.vehicle-type-grid>button,.vehicle-step,.vehicle-tree,.vehicle-primary-grid>.vehicle-facet,.vehicle-more";
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add("cinema-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: .09 });
    const register = () => {
      cards.current = [...root.querySelectorAll<HTMLElement>(".editorial-listings>a")];
      cards.current.forEach((el,i) => { el.classList.add("sculpted-card"); el.style.setProperty("--card-side",i%2 ? "1" : "-1"); });
      root.querySelectorAll<HTMLElement>(selector).forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      const siblings = el.parentElement ? [...el.parentElement.children].filter(n=>n.matches(selector)) : [];
      el.style.setProperty("--entrance-delay",`${Math.max(0,siblings.indexOf(el)%4)*85}ms`);
      el.classList.add("cinema-ready");
      observer.observe(el);
      });
    };
    register();
    const changes = new MutationObserver(register);
    changes.observe(root,{childList:true,subtree:true});
    return () => {
      observer.disconnect(); changes.disconnect();
      root.querySelectorAll<HTMLElement>(".cinema-ready").forEach(el=>{el.classList.remove("cinema-ready","cinema-visible");el.style.removeProperty("--entrance-delay");});
      cards.current.forEach(el=>{el.classList.remove("sculpted-card");["--card-open","--card-side","transform","will-change"].forEach(p=>el.style.removeProperty(p));});
      cards.current=[];
      if(hero.current) { hero.current.style.removeProperty("--scroll-drift"); hero.current.style.removeProperty("--scroll-rotation"); }
    };
  },[motion]);
  useFrame(({sy,h})=>{
    const el=hero.current;
    if(!el||!motion) return;
    const distance=Math.min(sy,1000);
    el.style.setProperty("--scroll-drift",`${(distance*.16).toFixed(1)}px`);
    el.style.setProperty("--scroll-rotation",`${(distance*.025).toFixed(2)}deg`);
    el.style.setProperty("--hero-roll",`${Math.min(1,sy/700)*-13}deg`);
    el.style.setProperty("--hero-scale",`${1+Math.min(1,sy/700)*.14}`);
    ribbon.current?.style.setProperty("--ribbon-x",`${-Math.min(sy*.2,600)}px`);
    // Measure untransformed grid coordinates before any writes, avoiding transform feedback.
    const frames=cards.current.map((card,i)=>{
      const parent=card.offsetParent as HTMLElement | null;
      const top=(parent?.getBoundingClientRect().top ?? 0)+card.offsetTop;
      const height=card.offsetHeight;
      const p=Math.max(0,Math.min(1,(h-top)/(Math.min(h*.64,height*.9)+80)));
      const exit=Math.max(0,Math.min(1,-top/height));
      return {card,i,p,exit,near:top<h+150&&top+height>-100};
    });
    frames.forEach(({card,i,p,exit,near})=>{
      card.style.willChange=near ? "transform" : "auto";
      if(!near) return;
      const side=i%2 ? 1 : -1;
      card.style.setProperty("--card-open",p.toFixed(4));
      card.style.transform=`perspective(1100px) translateX(${side*(1-p)*54}px) rotateY(${side*(1-p)*24}deg) rotateZ(${side*((1-p)*3+exit*1.5)}deg) scale(${.87+.13*p-exit*.035})`;
    });
  },[motion]);
  return <span ref={marker} hidden aria-hidden="true" />;
}

/** Native vertical scrolling drives a horizontal, three-scene exhibition. */
export function ScrollJourney({ children, labels }: { children: ReactNode; labels: string[] }) {
  const root=useRef<HTMLElement>(null);
  const rail=useRef<HTMLDivElement>(null);
  const panels=useRef<HTMLElement[]>([]);
  const motion=useMotionOK();
  useEffect(()=>{
    const el=root.current;
    if(!el) return;
    panels.current=[...el.querySelectorAll<HTMLElement>(".journey-panel")];
    if(motion) el.classList.add("journey-enabled");
    return ()=>{
      el.classList.remove("journey-enabled");
      el.style.removeProperty("--journey-progress");
      if(rail.current) rail.current.style.transform="";
      panels.current.forEach(panel=>{panel.inert=false;panel.style.removeProperty("--scene-distance");panel.style.removeProperty("--scene-focus");});
    };
  },[motion]);
  useFrame(()=>{
    const el=root.current;
    if(!el||!rail.current||!motion) return;
    const rect=el.getBoundingClientRect();
    const stage=el.querySelector<HTMLElement>(".journey-sticky")!;
    const travel=el.offsetHeight-stage.offsetHeight;
    const top=parseFloat(getComputedStyle(stage).top)||0;
    const progress=Math.max(0,Math.min(1,(top-rect.top)/Math.max(1,travel)));
    const position=progress*(labels.length-1);
    rail.current.style.transform=`translate3d(${-position*100}%,0,0)`;
    el.style.setProperty("--journey-progress",progress.toFixed(4));
    panels.current.forEach((panel,i)=>{
      const delta=Math.max(-1,Math.min(1,i-position));
      panel.style.setProperty("--scene-distance",delta.toFixed(4));
      panel.style.setProperty("--scene-focus",(1-Math.abs(delta)).toFixed(4));
      panel.inert=Math.abs(i-position)>.65;
    });
    el.querySelectorAll<HTMLButtonElement>(".journey-nav button").forEach((button,i)=>button.setAttribute("aria-pressed",String(i===Math.round(position))));
  },[motion]);
  function go(index:number) {
    const el=root.current;
    if(!el) return;
    if(!motion) {panels.current[index]?.scrollIntoView({block:"center"});return;}
    const stage=el.querySelector<HTMLElement>(".journey-sticky")!;
    const top=parseFloat(getComputedStyle(stage).top)||0;
    window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-top+(el.offsetHeight-stage.offsetHeight)*index/(labels.length-1),behavior:"smooth"});
  }
  return <section ref={root} className="scroll-journey" aria-label="Üç dünyayı keşfet">
    <div className="journey-sticky">
      <div className="journey-topline"><span>OZILAN KEŞİF KOLEKSİYONU</span><span className="journey-scroll-cue">Kaydır ve keşfet <span aria-hidden="true">↓</span></span></div>
      <div className="journey-window"><div ref={rail} className="journey-rail">{children}</div></div>
      <div className="journey-bottom"><div className="journey-nav" role="group" aria-label="Vitrin sahnesi">{labels.map((label,i)=><button key={label} onClick={()=>go(i)} aria-pressed={i===0}><span>0{i+1}</span>{label}</button>)}</div><div className="journey-progress" aria-hidden="true"><span /></div></div>
    </div>
  </section>;
}
