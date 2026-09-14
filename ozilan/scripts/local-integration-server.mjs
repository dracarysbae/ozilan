/** Loopback-only UI fixture. Never deploy: it deliberately uses fixed test users.
 * Real PostgreSQL migration/RLS, simulated Supabase HTTP/Auth/Storage transport.
 */
import {createServer} from 'node:http';
import {testDatabase} from '../tests/fixtures/database.mjs';
const db=await testDatabase(),photos=new Map(),tokens=new Map();
const users=['seller','buyer'].map((name,i)=>({id:`${i+1}0000000-0000-4000-8000-00000000000${i+1}`,email:`qa.${name}@ozilan.test`,aud:'authenticated',role:'authenticated',user_metadata:{name:i?'Deniz Alıcı':'Ada Satıcı',kind:'bireysel'},app_metadata:{provider:'email',providers:['email']},created_at:new Date().toISOString(),confirmed_at:new Date().toISOString(),identities:[]}));
for(const user of users)await db.query(`insert into auth.users(id,raw_user_meta_data) values($1,$2)`,[user.id,JSON.stringify(user.user_metadata)]);
const tables=new Set(['profiles','listings','favorites','threads','messages','reports','saved_searches']);
const identifier=s=>{if(!/^[a-z_]+$/.test(s))throw Error('Invalid field');return `"${s}"`;};
let queue=Promise.resolve();
function as(user,fn){const job=queue.then(async()=>{await db.exec('begin;reset role');try{await db.query(`select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims','{}',true)`,[user?.id??'']);await db.exec(user?'set local role authenticated':'set local role anon');const r=await fn();await db.exec('commit;reset role');return r;}catch(e){await db.exec('rollback;reset role');throw e;}});queue=job.catch(()=>{});return job;}
function session(user){const encode=s=>Buffer.from(JSON.stringify(s)).toString('base64url');const exp=Math.floor(Date.now()/1000)+3600;const access=`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,exp,aud:'authenticated',role:'authenticated'})}.local-test-only`;tokens.set(access,user);return {access_token:access,refresh_token:`refresh:${user.id}`,token_type:'bearer',expires_in:3600,expires_at:exp,user};}
createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(origin&&origin!=='http://127.0.0.1:4173'){res.writeHead(403);res.end();return;}
  res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:4173');res.setHeader('Access-Control-Allow-Headers',req.headers['access-control-request-headers']??'authorization,apikey,content-type,prefer,x-client-info,x-upsert,x-supabase-api-version,accept-profile,content-profile,x-retry-count');res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  const reply=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  try{
    const url=new URL(req.url,'http://127.0.0.1:54329');const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>3*1024*1024)throw Error('Too large');chunks.push(chunk);}const raw=Buffer.concat(chunks);const body=req.headers['content-type']?.includes('json')&&raw.length?JSON.parse(raw):{};
    const token=req.headers.authorization?.replace(/^Bearer /i,''),user=tokens.get(token);
    if(url.pathname==='/auth/v1/token'){
      const candidate=url.searchParams.get('grant_type')==='refresh_token'?users.find(u=>body.refresh_token===`refresh:${u.id}`):users.find(u=>u.email===body.email&&body.password==='LocalQaOnly!24');
      if(!candidate){reply({message:'Invalid login credentials',error_code:'invalid_credentials'},400);return;}reply(session(candidate));return;
    }
    if(url.pathname==='/auth/v1/logout'){tokens.delete(token);reply({});return;}
    if(url.pathname==='/auth/v1/user'){reply(user??{message:'Not authenticated'},user?200:401);return;}
    const publicPhoto='/storage/v1/object/public/listing-photos/';
    if(url.pathname.startsWith(publicPhoto)){const image=photos.get(decodeURIComponent(url.pathname.slice(publicPhoto.length)));if(!image){reply({},404);return;}res.writeHead(200,{'Content-Type':'image/webp'});res.end(image);return;}
    const upload='/storage/v1/object/listing-photos/';
    if(url.pathname.startsWith(upload)&&req.method==='POST'){
      const path=decodeURIComponent(url.pathname.slice(upload.length));let image=raw;
      if(req.headers['content-type']?.startsWith('multipart/form-data')){const form=await new Response(raw,{headers:{'Content-Type':req.headers['content-type']}}).formData();const file=[...form.values()].find(v=>typeof v!=='string');if(!file)throw Error('No image');image=Buffer.from(await file.arrayBuffer());}
      await as(user,()=>db.query(`insert into storage.objects(bucket_id,name) values('listing-photos',$1)`,[path]));photos.set(path,image);reply({Key:`listing-photos/${path}`,Id:path});return;
    }
    if(url.pathname==='/storage/v1/object/listing-photos'&&req.method==='DELETE'){const paths=body.prefixes??[];for(const path of paths){const result=await as(user,()=>db.query(`delete from storage.objects where bucket_id='listing-photos' and name=$1 returning name`,[path]));if(result.rows.length)photos.delete(path);}reply([]);return;}
    if(url.pathname==='/rest/v1/rpc/start_thread'){const r=await as(user,()=>db.query('select public.start_thread($1) id',[body.listing]));reply(r.rows[0].id);return;}
    const table=url.pathname.replace('/rest/v1/','');if(!tables.has(table)){reply({message:'Fixture endpoint not available'},404);return;}
    const values=[],conditions=[];for(const [field,filter]of url.searchParams){if(['select','order','limit','offset'].includes(field))continue;if(!filter.startsWith('eq.'))throw Error('Fixture supports eq filters');values.push(filter.slice(3));conditions.push(`${identifier(field)}=$${values.length}`);}
    const where=conditions.length?` where ${conditions.join(' and ')}`:'';let sql;
    if(req.method==='GET'){const fields=url.searchParams.get('select')??'*';sql=`select ${fields==='*'?'*':fields.split(',').map(identifier).join(',')} from public.${identifier(table)}${where}`;const order=url.searchParams.get('order');if(order){const [field,dir]=order.split('.');sql+=` order by ${identifier(field)} ${dir==='desc'?'desc':'asc'}`;}sql+=` limit ${Math.min(1000,Math.max(1,Number(url.searchParams.get('limit')??1000)))}`;}
    else if(req.method==='POST'){const object=Array.isArray(body)?body[0]:body;const fields=Object.keys(object);values.length=0;for(const field of fields){const value=object[field];values.push(value&&typeof value==='object'&&!Array.isArray(value)?JSON.stringify(value):value);}sql=`insert into public.${identifier(table)}(${fields.map(identifier)}) values(${fields.map((_,i)=>'$'+(i+1))}) returning *`;}
    else if(req.method==='PATCH'){const sets=[];for(const [field,value]of Object.entries(body)){values.push(value&&typeof value==='object'&&!Array.isArray(value)?JSON.stringify(value):value);sets.push(`${identifier(field)}=$${values.length}`);}sql=`update public.${identifier(table)} set ${sets.join(',')}${where} returning *`;}
    else if(req.method==='DELETE')sql=`delete from public.${identifier(table)}${where} returning *`;
    else throw Error('Unsupported fixture method');
    const result=await as(user,()=>db.query(sql,values));const single=req.headers.accept?.includes('vnd.pgrst.object');if(single&&result.rows.length!==1){reply({message:'Expected one row'},406);return;}reply(single?result.rows[0]:result.rows);
  }catch(e){replyError(res,e);}
}).listen(54329,'127.0.0.1',()=>console.log('Local integration fixture on http://127.0.0.1:54329; two local QA accounts only.'));
function replyError(res,error){if(!res.headersSent){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({message:error.message,code:error.code}));}}
