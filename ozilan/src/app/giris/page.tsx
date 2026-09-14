"use client";
import Link from "next/link";
import {Suspense,useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {useStore} from "@/lib/store";
import {safeReturnPath} from "@/lib/listing-data";
import {backend} from "@/lib/backend";

function Auth(){
  const router=useRouter(),params=useSearchParams();
  const {signIn,signUp,resetPassword,updatePassword,me,live,ready}=useStore();
  const [mode,setMode]=useState(params.get("mod")==="kayit"?"kayit":params.get("mod")==="yenile"?"yenile":"giris");
  const [form,setForm]=useState({name:"",email:"",pass:"",confirm:"",phone:"",kind:"bireysel" as "bireysel"|"kurumsal"});
  const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[recovery,setRecovery]=useState(false);
  const next=safeReturnPath(params.get("sonra"));
  useEffect(()=>{if(!live)return;const {data:{subscription}}=backend().auth.onAuthStateChange(event=>{if(event==="PASSWORD_RECOVERY"){setRecovery(true);setMode("yenile");}});return()=>subscription.unsubscribe();},[live]);
  useEffect(()=>{if(me&&mode==="giris"&&params.get("sonra"))router.replace(next);},[me,mode,next,params,router]);
  async function submit(e:React.FormEvent){
    e.preventDefault();if(busy)return;setError("");setNotice("");
    if((mode==="kayit"||mode==="yenile")&&form.pass!==form.confirm){setError("Şifreler aynı olmalı.");return;}
    setBusy(true);
    const result=mode==="giris"?await signIn(form.email,form.pass):mode==="kayit"?await signUp(form):mode==="unuttum"?await resetPassword(form.email):await updatePassword(form.pass);
    setBusy(false);if(result){setError(result);return;}
    setForm(f=>({...f,pass:"",confirm:""}));
    if(mode==="giris")router.push(next);
    else if(mode==="kayit")setNotice("Hesap isteğin alındı. E-postana gelen doğrulama bağlantısını açtıktan sonra giriş yapabilirsin.");
    else if(mode==="unuttum")setNotice("Bu e-postayla bir hesabın varsa şifre yenileme bağlantısı gönderilecek. Gelen kutunu kontrol et.");
    else{setNotice("Şifren güncellendi.");setRecovery(false);setMode("giris");}
  }
  if(!ready)return <div className="auth-loading" role="status">Hesabın kontrol ediliyor…</div>;
  return <div className="member-layout"><section className="member-story"><p className="editorial-kicker">OZBİRARADA HESABI</p><h1>Keşiften<br/><em>bağlantıya.</em></h1><p>İlanını paylaş. Aradığını bul. Doğrudan sahibine ulaş.</p><ol><li><b>01</b><span>Fotoğraflarınla gerçek bir ilan oluştur.</span></li><li><b>02</b><span>Favorilerin ve kayıtlı aramaların hesabında kalsın.</span></li><li><b>03</b><span>Görüşmelerini yalnızca sen ve karşı taraf okuyabilsin.</span></li></ol><span className="member-orbit" aria-hidden="true"/></section>
    <section className="member-form"><Link href="/" className="member-back">← Keşfe dön</Link>
    {!live?<><h2>Üyelik bağlantısı hazırlanıyor.</h2><p>Gerçek hesaplar açılmadan önce ortak veri altyapısı tamamlanıyor. Şu anda şifre veya kişisel bilgi toplamıyoruz.</p><Link href="/arama/" className="btn-primary">Örnek kataloğu incele</Link></>:me&&mode!=="yenile"&&!recovery?<><p className="editorial-kicker">HOŞ GELDİN</p><h2>Merhaba {me.name.split(" ")[0]}.</h2><Link className="btn-primary" href={next}>Devam et →</Link><Link className="btn-ghost" href="/ilan-ver/">İlan oluştur</Link></>:<>
      <div className="member-tabs">{["giris","kayit"].map(m=><button key={m} onClick={()=>{setMode(m);setError("");setNotice("");}} aria-pressed={mode===m}>{m==="giris"?"Giriş yap":"Hesap oluştur"}</button>)}</div>
      <h2>{mode==="kayit"?"Sana ait bir alan.":mode==="unuttum"?"Şifreni yenileyelim.":mode==="yenile"?"Yeni şifreni seç.":"Kaldığın yerden."}</h2>
      <form onSubmit={submit} className="member-fields">
        {mode==="kayit"&&<><label>Ad soyad veya işletme adı<input autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Hesap türü<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value as "bireysel"|"kurumsal"})}><option value="bireysel">Bireysel</option><option value="kurumsal">İşletme / uzman</option></select></label></>}
        {mode!=="yenile"&&<label>E-posta<input type="email" required autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>}
        {mode!=="unuttum"&&<label>{mode==="yenile"?"Yeni şifre":"Şifre"}<input required type="password" minLength={8} maxLength={128} autoComplete={mode==="giris"?"current-password":"new-password"} value={form.pass} onChange={e=>setForm({...form,pass:e.target.value})}/></label>}
        {(mode==="kayit"||mode==="yenile")&&<label>Şifreyi tekrar yaz<input required type="password" minLength={8} autoComplete="new-password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/></label>}
        {error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="form-notice" role="status">{notice}</p>}
        <button disabled={busy} className="btn-primary">{busy?"İşlem sürüyor…":mode==="giris"?"Giriş yap →":mode==="kayit"?"Hesabımı oluştur":mode==="unuttum"?"Yenileme bağlantısı gönder":"Yeni şifreyi kaydet"}</button>
      </form>
      {mode==="giris"&&<button className="member-forgot" onClick={()=>{setMode("unuttum");setError("");}}>Şifremi unuttum</button>}
      <p className="member-privacy">Şifren bu sitenin tarayıcı deposunda saklanmaz. Fotoğraflar ve ilan bilgileri yayınlandığında herkese görünür. <Link href="/gizlilik/">Veri kullanımı</Link></p>
    </>}
    </section></div>;
}
export default function Page(){return <Suspense fallback={<div className="auth-loading">Hesap ekranı hazırlanıyor…</div>}><Auth/></Suspense>;}
