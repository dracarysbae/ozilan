"use client";
import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { refreshMotion, useFrame, useMotionOK } from "./Motion";

/** One observer for staggered entrances. The content stays visible without JavaScript. */
export function ScrollExperience() {
  const marker = useRef<HTMLSpanElement>(null);
  const hero = useRef<HTMLElement | null>(null);
  const cards = useRef<HTMLElement[]>([]);
  const ribbon = useRef<HTMLElement | null>(null);
  const layout = useRef<{card:HTMLElement;top:number;height:number;last:string}[]>([]);
  const heroBottom = useRef(0);
  const previousScroll = useRef(-1);
  const motion = useMotionOK();
  useEffect(() => {
    const root = marker.current?.parentElement;
    if (!root) return;
    const heroSelector = ".discovery-hero,.vehicle-intro,.resale-intro,.market-hero";
    hero.current = root.querySelector<HTMLElement>(heroSelector);
    ribbon.current = root.querySelector<HTMLElement>(".discovery-ribbon");
    if (!motion) return;
    const measure = () => {
      layout.current=cards.current.map(card=>{let top=0,node:HTMLElement|null=card;while(node){top+=node.offsetTop;node=node.offsetParent as HTMLElement|null;}return {card,top,height:card.offsetHeight,last:""};});
      heroBottom.current=hero.current ? hero.current.offsetTop+hero.current.offsetHeight : 0;
      previousScroll.current=-1;
      refreshMotion();
    };
    const seen = new WeakSet<Element>();
    const stages = new WeakSet<Element>();
    const stageObserver = new IntersectionObserver(entries=>{
      entries.forEach(entry=>(entry.target as HTMLElement).dataset.playing=String(entry.isIntersecting));
    },{rootMargin:"100px"});
    const selector = ".editorial-heading,.decision-copy,.decision-panel,.editorial-cities>a,.listing-invitation>div:not(.invitation-orb),.vehicle-type-grid>button,.vehicle-step,.vehicle-tree,.vehicle-primary-grid>.vehicle-facet,.vehicle-more,.resale-cover-categories>button,.market-result-heading,.resale-result-line,.closet-stories>button,.gateway-feature,.gateway-workbench";
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add("cinema-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: .09 });
    const register = () => {
      hero.current = root.querySelector<HTMLElement>(heroSelector);
      root.querySelectorAll(".resale-intro-art,.market-hero-art,.restored-category-deck,.vehicle-intro,.vehicle-type-grid,.search-heading").forEach(stage=>{
        if(!stages.has(stage)){stages.add(stage);stageObserver.observe(stage);}
      });
      cards.current = [...root.querySelectorAll<HTMLElement>(".editorial-listings>a,.resale-grid>.resale-card,.market-catalog>.market-item,.restored-category-deck>.gateway-card,.search-listings>div>a")];
      cards.current.forEach((el,i) => { el.classList.add("sculpted-card"); el.style.setProperty("--card-side",i%2 ? "1" : "-1"); });
      root.querySelectorAll<HTMLElement>(selector).forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      const siblings = el.parentElement ? [...el.parentElement.children].filter(n=>n.matches(selector)) : [];
      el.style.setProperty("--entrance-delay",`${Math.max(0,siblings.indexOf(el)%4)*85}ms`);
      el.classList.add("cinema-ready");
      observer.observe(el);
      });
      measure();
    };
    register();
    const changes = new MutationObserver(register);
    changes.observe(root,{childList:true,subtree:true});
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    return () => {
      observer.disconnect(); stageObserver.disconnect(); changes.disconnect(); resize.disconnect();
      root.querySelectorAll<HTMLElement>(".cinema-ready").forEach(el=>{el.classList.remove("cinema-ready","cinema-visible");el.style.removeProperty("--entrance-delay");});
      cards.current.forEach(el=>{el.classList.remove("sculpted-card");["--card-open","--card-side","transform","will-change"].forEach(p=>el.style.removeProperty(p));});
      cards.current=[];
      layout.current=[];
      if(hero.current) { hero.current.style.removeProperty("--scroll-drift"); hero.current.style.removeProperty("--scroll-rotation"); }
    };
  },[motion]);
  useFrame(({sy,y,h})=>{
    const el=hero.current;
    if(!motion) return;
    if(Math.abs(previousScroll.current-sy)<.03) return;
    previousScroll.current=sy;
    const distance=Math.min(sy,1000);
    if(el&&y<heroBottom.current+100) {
    el.style.setProperty("--scroll-drift",`${(distance*.16).toFixed(1)}px`);
    el.style.setProperty("--scroll-rotation",`${(distance*.025).toFixed(2)}deg`);
    el.style.setProperty("--hero-roll",`${Math.min(1,sy/700)*-13}deg`);
    el.style.setProperty("--hero-scale",`${1+Math.min(1,sy/700)*.14}`);
    }
    ribbon.current?.style.setProperty("--ribbon-x",`${-Math.min(sy*.2,600)}px`);
    // Geometry is refreshed by ResizeObserver, never read after animation writes.
    layout.current.forEach((item,i)=>{
      const {card,height}=item;
      const top=item.top-sy;
      const near=top<h+150&&top+height>-100;
      if(!near) {if(item.last!=="outside"){card.style.willChange="auto";item.last="outside";}return;}
      const p=Math.max(0,Math.min(1,(h-top)/(Math.min(h*.64,height*.9)+80)));
      const exit=Math.max(0,Math.min(1,-top/height));
      const signature=`${p.toFixed(4)}:${exit.toFixed(4)}`;
      if(signature===item.last)return;
      item.last=signature;
      card.style.willChange="transform";
      const side=i%2 ? 1 : -1;
      card.style.setProperty("--card-open",p.toFixed(4));
      card.style.transform=`perspective(1100px) translateX(${side*(1-p)*54}px) rotateY(${side*(1-p)*24}deg) rotateZ(${side*((1-p)*3+exit*1.5)}deg) scale(${.87+.13*p-exit*.035})`;
    });
  },[motion]);
  return <span ref={marker} hidden aria-hidden="true" />;
}

/** Native vertical scrolling drives one continuous collection; navigation can skip any scene. */
export function ScrollJourney({ children, labels }: { children: ReactNode; labels: string[] }) {
  const root=useRef<HTMLElement>(null);
  const rail=useRef<HTMLDivElement>(null);
  const panels=useRef<HTMLElement[]>([]);
  const geometry=useRef({start:0,travel:1});
  const sceneRefs=useRef<{panel:HTMLElement;object:HTMLElement|null;copy:HTMLElement|null;ring:HTMLElement|null;number:HTMLElement|null}[]>([]);
  const nav=useRef<HTMLButtonElement[]>([]);
  const indicator=useRef<HTMLSpanElement>(null);
  const last=useRef(-1);
  const active=useRef(-1);
  const motion=useMotionOK();
  useEffect(()=>{
    const el=root.current;
    if(!el) return;
    panels.current=[...el.querySelectorAll<HTMLElement>(".journey-panel")];
    sceneRefs.current=panels.current.map(panel=>({panel,object:panel.querySelector(".journey-object"),copy:panel.querySelector(".journey-copy"),ring:panel.querySelector(".journey-ring"),number:panel.querySelector(".journey-monogram")}));
    nav.current=[...el.querySelectorAll<HTMLButtonElement>(".journey-nav button")];
    if(motion) el.classList.add("journey-enabled");
    const stage=el.querySelector<HTMLElement>(".journey-sticky")!;
    const measure=()=>{
      geometry.current={start:el.getBoundingClientRect().top+window.scrollY-(parseFloat(getComputedStyle(stage).top)||0),travel:Math.max(1,el.offsetHeight-stage.offsetHeight)};
      last.current=-1;active.current=-1;
    };
    measure();
    const resize=new ResizeObserver(measure);
    resize.observe(el);resize.observe(stage);resize.observe(document.body);
    const visibility=new IntersectionObserver(entries=>{el.dataset.playing=String(entries[0].isIntersecting);},{rootMargin:"150px"});
    visibility.observe(el);
    return ()=>{
      resize.disconnect();visibility.disconnect();
      el.classList.remove("journey-enabled");
      el.style.removeProperty("--journey-progress");
      if(rail.current) rail.current.style.transform="";
      panels.current.forEach(panel=>{panel.inert=false;panel.style.removeProperty("--scene-distance");panel.style.removeProperty("--scene-focus");});
      sceneRefs.current.forEach(s=>[s.object,s.copy,s.ring,s.number].forEach(node=>{if(node){node.style.transform="";node.style.opacity="";}}));
    };
  },[motion]);
  useFrame(({sy,w})=>{
    const el=root.current;
    if(!el||!rail.current||!motion) return;
    const progress=Math.max(0,Math.min(1,(sy-geometry.current.start)/geometry.current.travel));
    if(Math.abs(progress-last.current)<.00004)return;
    last.current=progress;
    const position=progress*(labels.length-1);
    rail.current.style.transform=`translate3d(${-position*100}%,0,0)`;
    if(indicator.current)indicator.current.style.transform=`translateX(${progress*Math.max(0,labels.length-1)*100}%)`;
    sceneRefs.current.forEach(({panel,object,copy,ring,number},i)=>{
      const delta=Math.max(-1,Math.min(1,i-position));
      const focus=1-Math.abs(delta);
      if(object)object.style.transform=`perspective(1000px) translate3d(${delta*(w<768?60:100)}px,0,0) rotateY(${-delta*24}deg) rotateZ(${-delta*9}deg) scale(${.72+focus*.28})`;
      if(copy){copy.style.transform=`translate3d(${-delta*(w<768?32:65)}px,0,0)`;copy.style.opacity=String(.18+focus*.82);}
      if(ring)ring.style.transform=`scale(${.7+focus*.3}) rotate(${delta*60}deg)`;
      if(number)number.style.transform=`translate3d(${-delta*140}px,0,0)`;
      const inert=Math.abs(i-position)>.65;
      if(panel.inert!==inert)panel.inert=inert;
      const playing=String(focus>.02);
      if(panel.dataset.playing!==playing)panel.dataset.playing=playing;
    });
    const next=Math.round(position);
    if(active.current!==next){active.current=next;nav.current.forEach((button,i)=>button.setAttribute("aria-pressed",String(i===next)));}
  },[motion]);
  function go(index:number) {
    const el=root.current;
    if(!el) return;
    if(!motion) {panels.current[index]?.scrollIntoView({block:"center"});return;}
    window.scrollTo({top:geometry.current.start+geometry.current.travel*index/Math.max(1,labels.length-1),behavior:"smooth"});
  }
  return <section ref={root} className="scroll-journey" aria-label="Keşif koleksiyonu" style={{"--journey-height":`${100+80*Math.max(0,labels.length-1)}svh` } as CSSProperties}>
    <div className="journey-sticky">
      <div className="journey-topline"><span>OZBİRARADA KEŞİF KOLEKSİYONU</span><span className="journey-scroll-cue">Kaydır ve keşfet <span aria-hidden="true">↓</span></span></div>
      <div className="journey-window"><div ref={rail} className="journey-rail">{children}</div></div>
      <div className="journey-bottom"><div className="journey-nav" role="group" aria-label="Vitrin sahnesi">{labels.map((label,i)=><button key={label} onClick={()=>go(i)} aria-pressed={i===0}><span>0{i+1}</span>{label}</button>)}</div><div className="journey-progress" aria-hidden="true"><span ref={indicator} style={{width:`${100/Math.max(1,labels.length)}%`}}/></div></div>
    </div>
  </section>;
}
