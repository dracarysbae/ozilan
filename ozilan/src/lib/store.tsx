"use client";
import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import type {User} from "@supabase/supabase-js";
import type {Account,Listing,Message,Report,Seller,Thread} from "./types";
import {SEED_LISTINGS,SEED_SELLERS} from "@/data/seed";
import {authReturn,backend,backendConfigured,friendlyError} from "./backend";
import {listingFromRow,messageFromRow,sellerFromRow,threadFromRow} from "./listing-data";

type State={favorites:string[];threads:Thread[];messages:Message[];reports:Report[];recent:string[];searches:{id:string;label:string;href:string;at:number}[];compare:string[]};
const blank:State={favorites:[],threads:[],messages:[],reports:[],recent:[],searches:[],compare:[]};
type Draft=Omit<Listing,"id"|"createdAt"|"bumpedAt"|"sellerId"|"views"|"status"|"art">;
type Result=Promise<string|null>;
type Ctx={ready:boolean;live:boolean;busy:boolean;error:string;clearError:()=>void;refresh:()=>Promise<void>;state:State;pool:Listing[];sellers:Record<string,Seller>;me:Account|null;
  signIn:(email:string,pass:string)=>Result;signUp:(a:Omit<Account,"id"|"createdAt"|"role">&{pass:string})=>Result;signOut:()=>Promise<void>;
  resetPassword:(email:string)=>Result;updatePassword:(pass:string)=>Result;
  toggleFav:(id:string)=>Promise<void>;isFav:(id:string)=>boolean;toggleCompare:(id:string)=>void;clearCompare:()=>void;
  publish:(draft:Draft,id?:string,newId?:string)=>Promise<string>;removeListing:(id:string)=>Promise<void>;setStatus:(id:string,s:Listing["status"])=>Promise<boolean>;bump:(id:string)=>Promise<void>;view:(id:string)=>void;
  openThread:(listingId:string)=>Promise<string>;send:(id:string,body:string)=>Promise<boolean>;report:(id:string,reason:string,note:string)=>Promise<boolean>;resolveReport:(id:string)=>Promise<void>;
  saveSearch:(label:string,href:string)=>Promise<void>;dropSearch:(id:string)=>Promise<void>;reset:()=>void;deleteAccount:(confirmation:string)=>Result;
  /** Threads whose newest message is from the other side and not yet opened on this device. */
  unseen:Set<string>;markSeen:(threadId:string)=>void;
};
const Context=createContext<Ctx|null>(null);
const PREFS="ozilan.preferences.v2";
const accountFor=(u:User,profile?:Seller):Account=>({id:u.id,name:profile?.name??u.user_metadata.name??"Üye",email:u.email??"",phone:"",kind:profile?.kind??"bireysel",createdAt:Date.parse(u.created_at),role:u.app_metadata.role==="admin"?"admin":"user"});
function requireUser(me:Account|null){if(!me)throw new Error("Bu işlem için giriş yapmalısın.");return me;}
/** PostgreSQL unique violation: a retried insert whose first attempt already committed. */
const duplicate=(e:unknown)=>(e as {code?:string})?.code==="23505";
export function newRecordId(){
  if(typeof crypto.randomUUID==="function")return crypto.randomUUID();
  const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
  const h=Array.from(b,x=>x.toString(16).padStart(2,"0")).join("");return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

export function StoreProvider({children}:{children:React.ReactNode}) {
  const [state,setState]=useState<State>(blank),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [me,setMe]=useState<Account|null>(null),[listings,setListings]=useState<Listing[]>([]),[profiles,setProfiles]=useState<Record<string,Seller>>({});
  const sessionUser=useRef<User|null>(null),generation=useRef(0),pending=useRef(new Set<string>()),retryIds=useRef(new Map<string,string>());
  const refresh=useCallback(async()=>{
    if(!backendConfigured){setReady(true);return;}
    const ticket=++generation.current,user=sessionUser.current,db=backend();setBusy(true);
    try {
      const results=await Promise.all([
        db.from("listings").select("*").order("bumped_at",{ascending:false}).limit(1000),
        db.from("profiles").select("id,name,kind,city,created_at").limit(1000),
        ...(user ? [db.from("favorites").select("listing_id"),db.from("threads").select("*").order("updated_at",{ascending:false}).limit(200),
          db.from("messages").select("*").order("created_at",{ascending:false}).limit(1000),db.from("saved_searches").select("*").order("created_at",{ascending:false}),db.from("reports").select("*").limit(500)] : []),
      ]);
      if(ticket!==generation.current)return;
      const failure=results.find(r=>r.error);if(failure?.error)throw failure.error;
      const sellerMap=Object.fromEntries((results[1].data??[]).map(r=>{const s=sellerFromRow(r);return[s.id,s];}));
      setListings((results[0].data??[]).map(listingFromRow));setProfiles(sellerMap);setMe(user?accountFor(user,sellerMap[user.id]):null);
      setState(s=>({...s,favorites:(results[2]?.data??[]).map(r=>r.listing_id),threads:(results[3]?.data??[]).map(threadFromRow),messages:(results[4]?.data??[]).map(messageFromRow),
        searches:(results[5]?.data??[]).map(r=>({id:r.id,label:r.label,href:r.href,at:Date.parse(r.created_at)})),
        reports:(results[6]?.data??[]).map(r=>({id:r.id,listingId:r.listing_id,reason:r.reason,note:r.note,at:Date.parse(r.created_at),by:r.user_id,state:r.state})),}));setError("");
    }catch(e){if(ticket===generation.current)setError(friendlyError(e));}
    finally{if(ticket===generation.current){setBusy(false);setReady(true);}}
  },[]);
  useEffect(()=>{
    // Old demo credentials and client-side admin flags never become live accounts.
    try{
      const p=JSON.parse(localStorage.getItem(PREFS)??"{}");
      const ids=(value:unknown)=>Array.isArray(value)?value.filter(x=>typeof x==="string").slice(0,24):[];
      setState(s=>({...s,recent:ids(p.recent),compare:ids(p.compare).slice(0,3)}));
      const old=localStorage.getItem("ozilan.v1");if(old){const demo=JSON.parse(old);delete demo.accounts;delete demo.account;localStorage.setItem("ozilan.v1",JSON.stringify(demo));}
    }catch{setError("Tarayıcı depolaması kullanılamıyor; son gezdiklerin bu cihazda hatırlanamayabilir.");}
    if(!backendConfigured){setReady(true);return;}
    let alive=true;const db=backend();
    const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
      if(!alive)return;const changed=sessionUser.current?.id!==session?.user.id;sessionUser.current=session?.user??null;
      if(changed){generation.current++;setMe(session?.user?accountFor(session.user):null);setState(s=>({...blank,recent:s.recent,compare:s.compare}));setListings([]);}
      // Avoid awaiting Supabase while its auth lock is held.
      setTimeout(()=>{if(alive)void refresh();},0);
    });
    db.auth.getSession().then(({data,error:failure})=>{if(!alive)return;if(failure)setError(friendlyError(failure));sessionUser.current=data.session?.user??null;void refresh();});
    const sync=()=>{if(document.visibilityState==="visible")void refresh();};window.addEventListener("online",sync);window.addEventListener("focus",sync);
    const timer=window.setInterval(()=>{if(sessionUser.current)sync();},30000);
    return()=>{alive=false;generation.current++;subscription.unsubscribe();clearInterval(timer);window.removeEventListener("online",sync);window.removeEventListener("focus",sync);};
  },[refresh]);
  useEffect(()=>{if(ready)try{localStorage.setItem(PREFS,JSON.stringify({recent:state.recent,compare:state.compare}));}catch{}},[ready,state.recent,state.compare]);
  const pool=useMemo(()=>backendConfigured?listings:SEED_LISTINGS,[listings]);
  // "Seen" is a per-device marker, not a read receipt: nothing is sent to the other member.
  const [seen,setSeen]=useState<Record<string,number>>({});
  const seenKey=me?`ozilan.seen.${me.id}`:"";
  useEffect(()=>{if(!seenKey){setSeen({});return;}try{const v=JSON.parse(localStorage.getItem(seenKey)??"{}");setSeen(v&&typeof v==="object"?v:{});}catch{setSeen({});}},[seenKey]);
  const unseen=useMemo(()=>{const out=new Set<string>();if(!me)return out;
    for(const t of state.threads){const last=state.messages.filter(m=>m.threadId===t.id).reduce<Message|null>((a,m)=>!a||m.at>a.at?m:a,null);
      if(last&&last.from!==me.id&&last.at>(seen[t.id]??0))out.add(t.id);}
    return out;},[me,state.threads,state.messages,seen]);
  const markSeen=useCallback((threadId:string)=>{setSeen(prev=>{const at=Date.now();if((prev[threadId]??0)>=at-1000)return prev;const next={...prev,[threadId]:at};try{if(seenKey)localStorage.setItem(seenKey,JSON.stringify(next));}catch{}return next;});},[seenKey]);
  const sellers=useMemo(()=>backendConfigured?profiles:Object.fromEntries(SEED_SELLERS.map(s=>[s.id,s])),[profiles]);
  async function mutation(key:string,run:()=>Promise<void>){if(pending.current.has(key))return;pending.current.add(key);setError("");try{requireUser(me);await run();await refresh();}catch(e){setError(friendlyError(e));}finally{pending.current.delete(key);}}
  const signIn:Ctx["signIn"]=async(email,password)=>{try{const {error}=await backend().auth.signInWithPassword({email:email.trim(),password});if(error)throw error;return null;}catch(e){return friendlyError(e);}};
  const signUp:Ctx["signUp"]=async a=>{try{if(a.name.trim().length<2||a.pass.length<8)throw new Error("Adın en az 2, şifren en az 8 karakter olmalı.");const {error}=await backend().auth.signUp({email:a.email.trim(),password:a.pass,options:{emailRedirectTo:authReturn(),data:{name:a.name.trim(),kind:a.kind}}});if(error)throw error;return null;}catch(e){return friendlyError(e);}};
  const signOut=async()=>{const {error}=await backend().auth.signOut({scope:"local"});if(error){setError(friendlyError(error));return;}sessionUser.current=null;generation.current++;setMe(null);setState(blank);setListings([]);retryIds.current.clear();await refresh();};
  const resetPassword:Ctx["resetPassword"]=async email=>{try{const {error}=await backend().auth.resetPasswordForEmail(email.trim(),{redirectTo:authReturn("/giris/?mod=yenile")});if(error)throw error;return null;}catch(e){return friendlyError(e);}};
  const updatePassword:Ctx["updatePassword"]=async password=>{try{const {error}=await backend().auth.updateUser({password});if(error)throw error;return null;}catch(e){return friendlyError(e);}};
  const toggleFav=async(id:string)=>mutation(`favorite:${id}`,async()=>{const db=backend();const {error}=state.favorites.includes(id)?await db.from("favorites").delete().eq("user_id",me!.id).eq("listing_id",id):await db.from("favorites").insert({listing_id:id});if(error)throw error;});
  const toggleCompare=(id:string)=>setState(s=>({...s,compare:s.compare.includes(id)?s.compare.filter(x=>x!==id):[...s.compare.slice(-2),id]}));
  const publish:Ctx["publish"]=async(draft,id,newId)=>{try{requireUser(me);const row={title:draft.title,description:draft.desc,category:draft.cat,subcategory:draft.sub,deal:draft.deal,price:draft.price,city:draft.city,district:draft.district,attributes:draft.attrs,path:draft.path??[],path_labels:draft.pathLabels??[],photo_paths:draft.photoPaths??[]};const db=backend();let {data,error}=id?await db.from("listings").update(row).eq("id",id).select("*").single():await db.from("listings").insert({...row,id:newId??newRecordId()}).select("*").single();
    // A lost response on a committed insert: the retry finds the same row instead of publishing twice.
    if(error&&!id&&newId&&duplicate(error)){const again=await db.from("listings").select("*").eq("id",newId).eq("seller_id",me!.id).single();data=again.data;error=again.error;}
    if(error)throw error;const listing=listingFromRow(data);setListings(s=>[listing,...s.filter(l=>l.id!==listing.id)]);return listing.id;}catch(e){const text=friendlyError(e);setError(text);throw new Error(text);}};
  const setStatus=async(id:string,status:Listing["status"])=>{let changed=false;await mutation(`listing:${id}`,async()=>{const {error}=await backend().from("listings").update({status}).eq("id",id).select("id").single();if(error)throw error;changed=true;});return changed;};
  const bump=async(id:string)=>mutation(`listing:${id}`,async()=>{const {error}=await backend().from("listings").update({bumped_at:new Date().toISOString()}).eq("id",id).select("id").single();if(error)throw error;});
  const view=(id:string)=>setState(s=>s.recent[0]===id?s:{...s,recent:[id,...s.recent.filter(x=>x!==id)].slice(0,24)});
  const openThread=async(listingId:string)=>{try{requireUser(me);const {data,error}=await backend().rpc("start_thread",{listing:listingId});if(error)throw error;return data as string;}catch(e){setError(friendlyError(e));return "";}};
  const send=async(threadId:string,body:string)=>{if(pending.current.has(`send:${threadId}`))return false;pending.current.add(`send:${threadId}`);try{requireUser(me);if(!body.trim()||body.length>2000)throw new Error("Mesaj 1–2000 karakter olmalı.");const key=`${threadId}\n${body.trim()}`,id=retryIds.current.get(key)??newRecordId();retryIds.current.set(key,id);
    const {error}=await backend().from("messages").insert({id,thread_id:threadId,body:body.trim()});if(error&&!duplicate(error))throw error;retryIds.current.delete(key);await refresh();return true;}catch(e){setError(friendlyError(e));return false;}finally{pending.current.delete(`send:${threadId}`);}};
  const report=async(listingId:string,reason:string,note:string)=>{try{requireUser(me);const {error}=await backend().from("reports").insert({listing_id:listingId,reason,note});if(error)throw error;await refresh();return true;}catch(e){setError(friendlyError(e));return false;}};
  const resolveReport=async(id:string)=>mutation(`report:${id}`,async()=>{const {error}=await backend().from("reports").update({state:"resolved"}).eq("id",id).select("id").single();if(error)throw error;});
  const saveSearch=async(label:string,href:string)=>mutation(`search:${href}`,async()=>{if(state.searches.some(s=>s.href===href))return;const {error}=await backend().from("saved_searches").insert({label:label.slice(0,200),href});if(error)throw error;});
  const dropSearch=async(id:string)=>mutation(`search:${id}`,async()=>{const {error}=await backend().from("saved_searches").delete().eq("id",id);if(error)throw error;});
  const reset=()=>setState(s=>({...s,recent:[],compare:[]}));
  const deleteAccount:Ctx["deleteAccount"]=async confirmation=>{try{requireUser(me);const {error}=await backend().rpc("delete_my_account",{confirmation});if(error)throw error;
    // The auth row is gone; drop this device's session and every private list.
    await backend().auth.signOut({scope:"local"}).catch(()=>undefined);sessionUser.current=null;generation.current++;setMe(null);setState(blank);setListings([]);retryIds.current.clear();
    try{localStorage.removeItem(PREFS);localStorage.removeItem(`ozilan.draft.${me!.id}`);localStorage.removeItem(`ozilan.seen.${me!.id}`);}catch{}await refresh();return null;}catch(e){return friendlyError(e);}};
  const value:Ctx={ready,live:backendConfigured,busy,error,clearError:()=>setError(""),refresh,state,pool,sellers,me,signIn,signUp,signOut,resetPassword,updatePassword,toggleFav,isFav:id=>state.favorites.includes(id),toggleCompare,clearCompare:()=>setState(s=>({...s,compare:[]})),publish,removeListing:async id=>{await setStatus(id,"removed");},setStatus,bump,view,openThread,send,report,resolveReport,saveSearch,dropSearch,reset,deleteAccount,unseen,markSeen};
  return <Context.Provider value={value}>{children}{error&&<div className="account-feedback" role="alert"><p>{error}</p>{!me&&<a href={`${process.env.NEXT_PUBLIC_BASE_PATH??""}/giris/`}>Giriş yap</a>}<button onClick={()=>setError("")} aria-label="Bildirimi kapat">×</button></div>}</Context.Provider>;
}
export function useStore(){const value=useContext(Context);if(!value)throw new Error("StoreProvider gerekli");return value;}
