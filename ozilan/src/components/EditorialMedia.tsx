"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useFrame, useMotionOK } from "./Motion";

export type EditorialScene = "objects" | "flowers" | "studio";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const descriptions:Record<EditorialScene,string> = {
  objects:"Gün ışığında deri çanta, yün ceket, fotoğraf makinesi ve kulaklıktan oluşan temsili vitrin.",
  flowers:"Doğal çiçekler, seramik vazo ve kumaş kurdeleli hediye kutusundan oluşan temsili vitrin.",
  studio:"Gün ışığı alan bir çalışma atölyesinde ahşap masa, malzeme örnekleri ve tasarım araçları.",
};

/** A single cached scroll measurement per image; no image filters in the frame loop. */
export function EditorialMedia({scene,className="",eager=false,children}:{scene:EditorialScene;className?:string;eager?:boolean;children?:ReactNode}) {
  const ref=useRef<HTMLElement>(null);
  const geometry=useRef({top:0,height:1,visible:false,last:999});
  const motion=useMotionOK();
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const measure=()=>{const r=el.getBoundingClientRect();geometry.current.top=r.top+window.scrollY;geometry.current.height=r.height;geometry.current.last=999;};
    const observer=new IntersectionObserver(entries=>{for(const e of entries){geometry.current.visible=e.isIntersecting;el.dataset.inView=String(e.isIntersecting);if(e.isIntersecting)el.dataset.revealed="true";}},{rootMargin:"120px"});
    const resize=new ResizeObserver(measure);resize.observe(el);resize.observe(document.body);observer.observe(el);measure();
    return()=>{observer.disconnect();resize.disconnect();};
  },[]);
  useFrame(({sy,h})=>{
    const el=ref.current,g=geometry.current;if(!el)return;
    if(!motion){if(g.last!==0){el.style.setProperty("--photo-drift","0px");g.last=0;}return;}
    if(!g.visible)return;
    const p=Math.max(-1,Math.min(1,2*(sy+h*.5-g.top-g.height*.5)/(h+g.height)));
    const drift=Math.round(p*Math.min(38,g.height*.07)*10)/10;
    if(Math.abs(drift-g.last)<.1)return;
    el.style.setProperty("--photo-drift",`${drift}px`);g.last=drift;
  },[motion]);
  return <figure ref={ref} className={`editorial-media editorial-media-${scene} ${className}`} data-motion={motion?"full":"reduced"}>
    <div className="editorial-media-window"><img className="editorial-media-photo" src={`${BASE}/editorial/${scene}-1280.webp`} srcSet={`${BASE}/editorial/${scene}-640.webp 640w, ${BASE}/editorial/${scene}-1280.webp 1280w`} sizes="(max-width:767px) 100vw, 60vw" width={1536} height={1024} alt={descriptions[scene]} loading={eager?"eager":"lazy"} fetchPriority={eager?"high":"auto"} decoding="async"/><span className="editorial-media-light" aria-hidden="true"/></div>
    {children}
    <figcaption className="editorial-media-credit">OzBirArada vitrin çalışması · Temsili görsel</figcaption>
  </figure>;
}

export function EditorialArrow({className=""}:{className?:string}){return <svg className={className} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>;}
