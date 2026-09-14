"use client";
import {useState} from "react";
import {friendlyError,publicPhoto} from "@/lib/backend";
import {uploadPhoto,discardPhoto,uploadSizeLimit} from '@/lib/photo-upload';

async function prepare(file:File):Promise<Blob>{
  if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Fotoğraf JPG, PNG veya WebP olmalı.");
  if(file.size>15*1024*1024)throw new Error("Fotoğraf 15 MB'tan küçük olmalı.");
  const url=URL.createObjectURL(file),image=new Image();
  try{
    image.src=url;await image.decode();
    if(image.naturalWidth*image.naturalHeight>50000000)throw new Error("Fotoğraf en fazla 50 megapiksel olmalı.");
    const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement("canvas");canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    const context=canvas.getContext("2d");if(!context)throw new Error("Fotoğraf hazırlanamadı.");context.drawImage(image,0,0,canvas.width,canvas.height);
    let blob:Blob|null=null;
    // Retain the 1600px image where possible. Avoid aggressive downscaling:
    // a detailed source that exceeds the cap asks for another photo instead.
    for(const quality of [.84,.78,.72]){
      blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Fotoğraf hazırlanamadı.")),"image/webp",quality));
      if(blob.size<=uploadSizeLimit)break;
    }
    canvas.width=0;canvas.height=0;
    if(!blob||blob.type!=="image/webp"||blob.size>uploadSizeLimit)throw new Error("Bu fotoğraf çok ayrıntılı ve yükleme sınırını aşıyor. Biraz daha küçük bir görsel seç.");
    return blob;
  }finally{URL.revokeObjectURL(url);image.src="";}
}
export function PhotoUploader({paths,onChange,onBusy}:{paths:string[];onChange:(p:string[])=>void;onBusy:(busy:boolean)=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function upload(files:FileList|null){
    if(!files||busy)return;const selected=Array.from(files);if(selected.length+paths.length>6){setError("En fazla 6 fotoğraf ekleyebilirsin.");return;}
    setBusy(true);onBusy(true);setError("");const added:string[]=[];
    try{for(const file of selected){const blob=await prepare(file);added.push(await uploadPhoto(blob));}onChange([...paths,...added]);}
    catch(e){if(added.length)onChange([...paths,...added]);setError(friendlyError(e)+(added.length?' Yüklenmiş fotoğrafların korundu.':''));}
    finally{setBusy(false);onBusy(false);}
  }
  async function remove(path:string){
    if(busy)return;setBusy(true);onBusy(true);setError('');
    try{
      // A published image stays available until the edited listing is saved.
      // The server refuses deleting referenced assets; stale cleanup handles it later.
      await discardPhoto(path);onChange(paths.filter(p=>p!==path));
    }catch(e){setError(friendlyError(e));}finally{setBusy(false);onBusy(false);}
  }
  return <div className="photo-editor"><div className="photo-editor-heading"><h3>Fotoğraflar</h3><span>{paths.length}/6</span></div><p>İlk fotoğraf kapak görselin olur. JPG, PNG veya WebP; her biri en fazla 15 MB. Konum bilgisi görsellere aktarılmaz.</p><label className="photo-drop"><span>{busy?"Fotoğraflar hazırlanıyor…":"＋ Fotoğraf ekle"}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy||paths.length>=6} onChange={e=>{void upload(e.target.files);e.currentTarget.value="";}}/></label>{error&&<p className="form-error" role="alert">{error}</p>}<div className="photo-thumbnails">{paths.map((path,i)=><div key={path}><img src={publicPhoto(path)} alt={`İlan fotoğrafı ${i+1}`}/><span>{i===0?"Kapak":i+1}</span><button type="button" disabled={busy} aria-label={`${i+1}. fotoğrafı kaldır`} onClick={()=>void remove(path)}>×</button>{i>0&&<button type="button" disabled={busy} className="photo-cover" onClick={()=>onChange([path,...paths.filter(p=>p!==path)])}>Kapak yap</button>}</div>)}</div></div>;
}
