/** Dependency-free handler shared by Deno Edge and the Node integration tests. */
type Config = {supabaseUrl:string;serviceKey:string;cloudName:string;apiKey:string;apiSecret:string;origins:string[];cleanupSecret?:string};
type Transport = typeof fetch;
class MediaError extends Error { status:number; constructor(message:string,status=400){super(message);this.status=status;} }
const LIMIT=524288;
const UUID='[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const PATH=new RegExp(`^cloudinary/(${UUID})/(${UUID})\\.webp$`);

export async function cloudinarySignature(params:Record<string,string>,secret:string) {
  const payload=Object.keys(params).sort().map(k=>`${k}=${params[k]}`).join('&')+secret;
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
async function boundedBody(req:Request) {
  if(Number(req.headers.get('content-length')??0)>LIMIT)throw new MediaError('Fotoğraf en fazla 512 KB olmalı.',413);
  const reader=req.body?.getReader();if(!reader)throw new MediaError('Fotoğraf zorunlu.');
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>LIMIT){await reader.cancel();throw new MediaError('Fotoğraf en fazla 512 KB olmalı.',413);}chunks.push(value);}
  const result=new Uint8Array(size);let at=0;for(const chunk of chunks){result.set(chunk,at);at+=chunk.length;}return result;
}
export function validWebp(bytes:Uint8Array) {
  const text=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b));
  if(bytes.length<20||text(0,4)!=='RIFF'||text(8,12)!=='WEBP')return false;
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(view.getUint32(4,true)+8!==bytes.length)return false;
  let image=false;
  for(let at=12;at<bytes.length;){
    if(at+8>bytes.length)return false;
    const kind=text(at,at+4),length=view.getUint32(at+4,true);const end=at+8+length;
    if(end>bytes.length||['ANIM','ANMF','EXIF','XMP '].includes(kind))return false;
    if(kind==='VP8 '||kind==='VP8L')image=true;
    at=end+(length%2);if(at>bytes.length)return false;
  }
  return image;
}
export function createMediaHandler(config:Config,transport:Transport=fetch) {
  async function rpc(name:string,args:Record<string,unknown>) {
    const result=await transport(`${config.supabaseUrl}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:config.serviceKey,Authorization:`Bearer ${config.serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});
    const data=await result.json();
    if(!result.ok){const message=String(data?.message??'');throw new MediaError(/fotoğraf|Fotoğraf|kota|sınır/.test(message)?message:'Fotoğraf kaydı tamamlanamadı.',result.status===429?429:400);}
    return data;
  }
  async function cloud(action:'upload'|'destroy',params:Record<string,string>,bytes?:Uint8Array) {
    const signed={...params,timestamp:String(Math.floor(Date.now()/1000))};
    const form=new FormData();for(const [key,value]of Object.entries(signed))form.set(key,value);
    form.set('api_key',config.apiKey);form.set('signature',await cloudinarySignature(signed,config.apiSecret));
    if(bytes)form.set('file',new Blob([bytes as BlobPart],{type:'image/webp'}),'photo.webp');
    const response=await transport(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/${action}`,{method:'POST',body:form,signal:AbortSignal.timeout(action==='upload'?45000:10000)});
    const data=await response.json();
    if(!response.ok)throw new MediaError('Fotoğraf hizmetine ulaşılamadı. Biraz sonra tekrar dene.',502);
    return data;
  }
  async function remove(owner:string,path:string) {
    const id=await rpc('claim_media_delete',{p_owner:owner,p_path:path});
    if(!id)return false;
    const result=await cloud('destroy',{public_id:id,invalidate:'true'});
    if(!['ok','not found'].includes(result.result))throw new MediaError('Fotoğraf silme işlemi tamamlanamadı.',502);
    await rpc('finish_media_delete',{p_owner:owner,p_path:path});return true;
  }
  return async(req:Request):Promise<Response>=>{
    const origin=req.headers.get('origin')??'';
    const allowed=config.origins.includes(origin);
    const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
    if(allowed){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';headers['Access-Control-Allow-Methods']='POST,OPTIONS';}
    const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
    if(origin&&!allowed)return respond({error:'Bu site için fotoğraf bağlantısı açık değil.'},403);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(req.method!=='POST')return respond({error:'İşlem desteklenmiyor.'},405);
    try{
      if(!config.serviceKey||!config.apiKey||!config.apiSecret||!/^[-a-z0-9]+$/.test(config.cloudName))throw new MediaError('Fotoğraf bağlantısı hazırlanıyor.',503);
      const token=req.headers.get('authorization')??'';
      const cleanup=new URL(req.url).searchParams.get('cleanup')==='1';
      if(cleanup){
        // The scheduled job reads its token from Supabase Vault. Without a
        // dedicated Edge secret, the same Vault value is checked in PostgreSQL,
        // so the token never has to be copied between dashboards by hand.
        const presented=/^Bearer (\S+)$/.exec(token)?.[1];
        let authorized=false;
        if(presented&&config.cleanupSecret)authorized=presented===config.cleanupSecret;
        else if(presented)authorized=await rpc('media_cleanup_authorized',{p_token:presented}).then(v=>v===true,()=>false);
        if(!authorized)throw new MediaError('Yetkisiz işlem.',401);
        const started=Date.now();
        const rows=await rpc('stale_media_assets',{p_owner:null});let deleted=0,failed=0,examined=0;
        // Each item is claimed in PostgreSQL before deletion. A failed provider
        // call leaves a retryable tombstone and continues consuming quota.
        for(const row of rows){
          if(Date.now()-started>75000)break;
          examined++;
          try{if(await remove(row.owner_id,row.path))deleted++;}catch{failed++;break;}
        }
        return respond({examined,deleted,failed,remaining:rows.length-examined},failed?502:200);
      }
      if(!/^Bearer \S+$/i.test(token))throw new MediaError('Fotoğraf için giriş yapmalısın.',401);
      const auth=await transport(`${config.supabaseUrl}/auth/v1/user`,{headers:{apikey:config.serviceKey,Authorization:token},signal:AbortSignal.timeout(10000)});
      if(!auth.ok)throw new MediaError('Oturumun sona erdi. Yeniden giriş yap.',401);
      const user=await auth.json();if(!new RegExp(`^${UUID}$`).test(user.id??''))throw new MediaError('Oturum doğrulanamadı.',401);
      const bytes=await boundedBody(req);
      if(req.headers.get('content-type')?.split(';')[0]==='image/webp'){
        if(!validWebp(bytes))throw new MediaError('Geçerli, hareketsiz bir WebP fotoğrafı seç.');
        const reservation=await rpc('reserve_media_upload',{p_owner:user.id,p_bytes:bytes.length});
        const asset=Array.isArray(reservation)?reservation[0]:reservation;
        if(!asset?.id||asset.owner_id!==user.id)throw new MediaError('Fotoğraf kaydı tamamlanamadı.',502);
        // Fixed endpoint and parameters: the caller cannot request paid
        // transformations, overwrite an asset, fetch a URL or upload video.
        const result=await cloud('upload',{public_id:asset.public_id,overwrite:'false',allowed_formats:'webp',backup:'false'},bytes);
        if(result.public_id!==asset.public_id||result.resource_type!=='image'||result.format!=='webp'||result.bytes!==bytes.length||!(result.width>0&&result.width<=1600&&result.height>0&&result.height<=1600))throw new MediaError('Fotoğraf yüklemesi doğrulanamadı.',502);
        const path=await rpc('complete_media_upload',{p_id:asset.id,p_owner:user.id,p_bytes:result.bytes});
        return respond({path},201);
      }
      if(req.headers.get('content-type')?.split(';')[0]!=='application/json')throw new MediaError('Geçerli fotoğraf zorunlu.');
      const body=JSON.parse(new TextDecoder().decode(bytes));
      if(body.action!=='delete'||typeof body.path!=='string'||PATH.exec(body.path)?.[1]!==user.id)throw new MediaError('Fotoğraf bu hesaba ait olmalı.',403);
      return respond({deleted:await remove(user.id,body.path)});
    }catch(error){return respond({error:error instanceof MediaError?error.message:'Fotoğraf işlemi tamamlanamadı. Tekrar deneyebilirsin.'},error instanceof MediaError?error.status:500);}
  };
}
