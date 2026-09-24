import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {testDatabase} from './fixtures/database.mjs';
import {createMediaHandler,cloudinarySignature,validWebp} from '../../supabase/functions/listing-media/handler.ts';
import {cloudinaryPhotoUrl} from '../src/lib/photo-path.ts';

const seller='10000000-0000-4000-8000-000000000001';
const buyer='20000000-0000-4000-8000-000000000002';
// Minimal single VP8 chunk for transport tests; Cloudinary performs decoding.
const webp=Uint8Array.from([82,73,70,70,14,0,0,0,87,69,66,80,86,80,56,32,2,0,0,0,0,0]);
const config={supabaseUrl:'https://backend.example',serviceKey:'local-service-only',cloudName:'fixture-cloud',apiKey:'fixture-key',apiSecret:'fixture-secret',origins:['https://site.example'],cleanupSecret:'fixture-cleanup-only'};

test('photo delivery paths cannot inject transformations or another host',()=>{
  const path=`cloudinary/${seller}/${buyer}.webp`;
  assert.equal(cloudinaryPhotoUrl(path,'sample-cloud'),`https://res.cloudinary.com/sample-cloud/image/upload/ozilan/${seller}/${buyer}.webp`);
  for(const bad of ['https://evil.example/a.webp',path+'/../x',path+'?q_auto=1',path.replace(seller,'w_99999')])assert.equal(cloudinaryPhotoUrl(bad,'sample-cloud'),'');
  assert.equal(cloudinaryPhotoUrl(path,'sample/cloud'),'');
});
test('signed parameters are canonical and WebP rejects metadata or truncated bodies',async()=>{
  const params={timestamp:'123',public_id:'ozilan/example',backup:'false'};
  assert.equal(await cloudinarySignature(params,'secret'),createHash('sha256').update('backup=false&public_id=ozilan/example&timestamp=123secret').digest('hex'));
  assert.equal(validWebp(webp),true);
  assert.equal(validWebp(webp.slice(0,20)),false);
  const metadata=webp.slice();metadata.set([69,88,73,70],12);assert.equal(validWebp(metadata),false);
  assert.equal(validWebp(new TextEncoder().encode('<svg>not an image</svg>')),false);
});
test('real SQL controls upload ownership, atomic limits, publishing, deletion and recovery',async()=>{
  const db=await testDatabase();let uploads=0;let failDelete=false;let loseUploadResponse=false;
  const provider=new Map();const origins=[];
  const rpcArgs={reserve_media_upload:['p_owner','p_bytes'],complete_media_upload:['p_id','p_owner','p_bytes'],claim_media_delete:['p_owner','p_path'],finish_media_delete:['p_owner','p_path'],stale_media_assets:['p_owner']};
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  const transport=async(url,options)=>{
    if(url==='https://backend.example/auth/v1/user')return options.headers.Authorization===`Bearer ${seller}`?json({id:seller}):options.headers.Authorization===`Bearer ${buyer}`?json({id:buyer}):json({},401);
    if(url.includes('/rest/v1/rpc/')){
      const name=url.split('/').at(-1),args=JSON.parse(options.body);assert.ok(rpcArgs[name]);
      assert.equal(options.headers.apikey,config.serviceKey);
      try{
        await db.exec('set role service_role');
        const result=await db.query(`select * from public.${name}(${rpcArgs[name].map((_,i)=>'$'+(i+1))})`,rpcArgs[name].map(k=>args[k]));
        const rows=result.rows;
        // PostgREST answers void functions with 204 and no body.
        if(name==='finish_media_delete')return new Response(null,{status:204});
        return json(name==='reserve_media_upload'||name==='stale_media_assets'?rows:rows[0]?.[name]??null);
      }catch(error){return json({message:error.message},400);}finally{await db.exec('reset role');}
    }
    assert.ok(url.startsWith('https://api.cloudinary.com/v1_1/fixture-cloud/image/'));
    const form=options.body;const params=Object.fromEntries([...form].filter(([k])=>!['file','api_key','signature'].includes(k)));
    assert.equal(form.get('signature'),await cloudinarySignature(params,config.apiSecret));
    origins.push(url);
    if(url.endsWith('/upload')){
      uploads++;assert.equal(form.get('overwrite'),'false');assert.equal(form.get('backup'),'false');assert.equal(form.get('allowed_formats'),'webp');assert.equal(form.get('transformation'),null);
      const file=form.get('file');assert.equal(file.size,webp.length);provider.set(form.get('public_id'),file.size);
      if(loseUploadResponse)throw new Error('Simulated network timeout after provider stored image');
      return json({public_id:form.get('public_id'),resource_type:'image',format:'webp',bytes:file.size,width:640,height:480});
    }
    if(failDelete)return json({error:'fixture failure'},500);
    const existed=provider.delete(form.get('public_id'));return json({result:existed?'ok':'not found'});
  };
  const handler=createMediaHandler(config,transport);
  const request=(user,body=webp,origin='https://site.example',type='image/webp')=>handler(new Request('https://backend.example/functions/v1/listing-media',{method:'POST',headers:{authorization:`Bearer ${user}`,'content-type':type,origin},body}));
  const remove=(user,path)=>request(user,JSON.stringify({action:'delete',path}),'https://site.example','application/json');
  try{
    for(const id of [seller,buyer])await db.query(`insert into auth.users(id,raw_user_meta_data) values($1,'{"name":"Test kişi"}')`,[id]);
    assert.equal((await request('fake')).status,401);
    assert.equal((await request(seller,webp,'https://evil.example')).status,403);
    assert.equal((await request(seller,new Uint8Array(524289))).status,413);
    assert.equal((await request(seller,new TextEncoder().encode('<svg/>'))).status,400);
    assert.equal(uploads,0);
    const uploaded=await request(seller);assert.equal(uploaded.status,201);assert.equal(uploaded.headers.get('Access-Control-Allow-Origin'),'https://site.example');
    const {path}=await uploaded.json();assert.ok(path.startsWith(`cloudinary/${seller}/`));
    assert.equal(provider.size,1);
    assert.equal((await remove(buyer,path)).status,403);
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[seller]);await db.exec('set role authenticated');
    await assert.rejects(db.query(`select public.reserve_media_upload($1,100)`,[seller]));
    await assert.rejects(db.query('select * from public.media_assets'));
    await assert.rejects(db.query(`insert into storage.objects(bucket_id,name) values('listing-photos',$1)`,[`${seller}/${buyer}.webp`]));
    const listing=(await db.query(`insert into public.listings(title,description,category,subcategory,deal,price,city,district,photo_paths) values('Medya test ilanı','En az kırk karakterlik açıklama ile gerçek bir test ilanı.','ikinci-el','elektronik','Satılık',100,'İstanbul','Kadıköy',array[$1]) returning id`,[path])).rows[0].id;
    await assert.rejects(db.query(`update public.listings set photo_paths=array[$1] where id=$2`,[`cloudinary/${seller}/${buyer}.webp`,listing]));
    await db.exec('reset role');
    const buyerPath=(await (await request(buyer)).json()).path;
    await db.exec('set role authenticated');
    await assert.rejects(db.query(`update public.listings set photo_paths=array[$1] where id=$2`,[buyerPath,listing]),'even a ready asset belonging to another user cannot be attached');
    await db.exec('reset role');
    await remove(buyer,buyerPath);
    assert.equal((await (await remove(seller,path)).json()).deleted,false,'published assets survive deletion requests');
    await db.query('delete from public.listings where id=$1',[listing]);
    failDelete=true;assert.equal((await remove(seller,path)).status,502);
    assert.equal((await db.query('select state from public.media_assets where path=$1',[path])).rows[0].state,'deleting');
    failDelete=false;assert.equal((await (await remove(seller,path)).json()).deleted,true);
    assert.equal(provider.size,0);assert.equal((await (await remove(seller,path)).json()).deleted,false,'repeated deletion is safe');
    // A lost response does not free quota or expose a partially confirmed image.
    loseUploadResponse=true;assert.equal((await request(seller)).status,500);loseUploadResponse=false;
    assert.equal(provider.size,1);
    assert.equal((await db.query("select count(*)::int n from public.media_assets where state='pending'")).rows[0].n,1);
    await db.exec("update public.media_assets set created_at=now()-interval '2 days',touched_at=now()-interval '2 days' where state='pending'");
    const cronRequest=()=>new Request('https://backend.example/functions/v1/listing-media?cleanup=1',{method:'POST',headers:{authorization:`Bearer ${config.cleanupSecret}`}});
    failDelete=true;assert.equal((await handler(cronRequest())).status,502);failDelete=false;
    await db.exec("update public.media_assets set touched_at=now()-interval '20 minutes' where state='deleting'");
    const sweep=await handler(new Request('https://backend.example/functions/v1/listing-media?cleanup=1',{method:'POST',headers:{authorization:`Bearer ${config.cleanupSecret}`}}));
    assert.equal((await sweep.json()).deleted,1);assert.equal(provider.size,0);
    for(let i=0;i<29;i++)await db.query('select public.reserve_media_upload($1,100)',[seller]);
    assert.equal((await request(seller)).status,400,'deleted attempts still count in the upload rate');
    await assert.rejects(db.query('select public.reserve_media_upload($1,524289)',[seller]));
    await db.exec('delete from public.media_assets');
    await db.query(`insert into public.media_assets(owner_id,path,public_id,bytes,state) select $1,'quota/'||n,'quota/'||n,500000,'deleted' from generate_series(1,6000) n`,[buyer]);
    await assert.rejects(db.query('select public.reserve_media_upload($1,22)',[seller]),/Aylık fotoğraf yükleme kotası/,'deleted uploads still consume monthly proxy allowance');
    await db.exec('delete from public.media_assets');
    await db.query(`insert into public.media_assets(owner_id,path,public_id,bytes,state,created_at) select $1,'quota/'||n,'quota/'||n,500000,'ready',now()-interval '60 days' from generate_series(1,20000) n`,[buyer]);
    await assert.rejects(db.query('select public.reserve_media_upload($1,22)',[seller]),/depolama kotası/,'storage admission counts older live images');
    assert.ok(origins.every(url=>url.includes('/image/')));
  }finally{await db.close();}
});

test('scheduled cleanup accepts only the Vault token when no Edge secret is set',async()=>{
  const db=await testDatabase();
  try{
    const token='v'.repeat(48);
    await db.exec(`create schema vault;create table vault.decrypted_secrets(name text,decrypted_secret text);insert into vault.decrypted_secrets values('media_cleanup_secret','${token}')`);
    const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
    const calls=[];
    const transport=async(url,options)=>{
      const name=url.split('/').at(-1),args=JSON.parse(options.body);calls.push(name);
      await db.exec('set role service_role');
      try{
        if(name==='media_cleanup_authorized')return json((await db.query('select public.media_cleanup_authorized($1) ok',[args.p_token])).rows[0].ok);
        if(name==='stale_media_assets')return json([]);
        return json({message:'unexpected'},400);
      }catch(error){return json({message:error.message},400);}finally{await db.exec('reset role');}
    };
    const handler=createMediaHandler({...config,cleanupSecret:undefined},transport);
    const run=auth=>handler(new Request('https://backend.example/functions/v1/listing-media?cleanup=1',{method:'POST',headers:auth?{authorization:auth}:{}}));
    assert.equal((await run()).status,401);
    assert.equal((await run('Bearer short')).status,401);
    assert.equal((await run('Bearer '+'x'.repeat(48))).status,401);
    assert.ok(!calls.includes('stale_media_assets'),'no cleanup work before authorization');
    const ok=await run('Bearer '+token);
    assert.equal(ok.status,200);assert.deepEqual(await ok.json(),{examined:0,deleted:0,failed:0,remaining:0});
    await db.exec('set role authenticated');
    await assert.rejects(db.query('select public.media_cleanup_authorized($1)',[token]),/permission denied/,'members cannot probe the token');
  }finally{await db.close();}
});
