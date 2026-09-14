import test from 'node:test';
import assert from 'node:assert/strict';
import {testDatabase} from './fixtures/database.mjs';

test('marketplace permissions are enforced by PostgreSQL, including direct hostile requests',async()=>{
  const db=await testDatabase();
  try{
    const seller='10000000-0000-4000-8000-000000000001',buyer='20000000-0000-4000-8000-000000000002',other='30000000-0000-4000-8000-000000000003';
    for(const [id,name] of [[seller,'Satıcı'],[buyer,'Alıcı'],[other,'Başka kullanıcı']])await db.query(`insert into auth.users(id,raw_user_meta_data) values($1,jsonb_build_object('name',$2::text))`,[id,name]);
    const photo=`${seller}/a0000000-0000-4000-8000-000000000001.webp`;
    await db.query(`insert into storage.objects(bucket_id,name) values('listing-photos',$1)`,[photo]);
    const as=async(id,admin=false)=>{await db.exec('reset role');await db.query(`select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)`,[id,JSON.stringify({app_metadata:admin?{role:'admin'}:{}})]);await db.exec(id?'set role authenticated':'set role anon');};
    await as(seller);
    const listing=(await db.query(`insert into public.listings(title,description,category,subcategory,deal,price,city,district,photo_paths)
      values('Gerçek test ilanı','Bu açıklama ilanın gerçek özelliklerini en az kırk karakterle anlatıyor.','ikinci-el','elektronik','Satılık',1250,'İstanbul','Kadıköy',array[$1]) returning id`,[photo])).rows[0].id;
    await assert.rejects(db.query(`update public.profiles set id=$1 where id=$2`,[other,seller]));
    await assert.rejects(db.query(`update public.listings set seller_id=$1 where id=$2`,[other,listing]));
    await assert.rejects(db.query(`update public.listings set photo_paths=array[$1] where id=$2`,[`${other}/a.webp`,listing]));
    await assert.rejects(db.query(`select public.start_thread($1)`,[listing]));
    await as(buyer);
    assert.equal((await db.query(`update public.listings set title='Ele geçirilmiş ilan' where id=$1 returning id`,[listing])).rows.length,0);
    const thread=(await db.query(`select public.start_thread($1) id`,[listing])).rows[0].id;
    assert.equal((await db.query(`select public.start_thread($1) id`,[listing])).rows[0].id,thread,'opening twice is idempotent');
    await db.query(`insert into public.messages(thread_id,body) values($1,'Merhaba, ürün güncel mi?')`,[thread]);
    await assert.rejects(db.query(`insert into public.messages(thread_id,sender_id,body) values($1,$2,'Sahte cevap')`,[thread,seller]));
    await db.query(`insert into public.favorites(listing_id) values($1)`,[listing]);
    await as(other);
    assert.equal((await db.query('select * from public.messages')).rows.length,0);
    assert.equal((await db.query('select * from public.threads')).rows.length,0);
    assert.equal((await db.query('select * from public.favorites')).rows.length,0);
    await assert.rejects(db.query(`insert into public.messages(thread_id,body) values($1,'İzinsiz mesaj')`,[thread]));
    await assert.rejects(db.query(`insert into storage.objects(bucket_id,name) values('listing-photos',$1)`,[photo]));
    await as(seller);
    assert.equal((await db.query('select * from public.messages')).rows.length,1);
    await db.query(`insert into public.messages(thread_id,body) values($1,'Evet, güncel.')`,[thread]);
    await db.query(`update public.listings set status='removed' where id=$1`,[listing]);
    await as('');
    assert.equal((await db.query('select * from public.listings')).rows.length,0);
    await assert.rejects(db.query(`select public.start_thread($1)`,[listing]));
    await as(buyer);
    assert.equal((await db.query('select * from public.messages')).rows.length,2);
    assert.equal((await db.query('select * from public.listings')).rows.length,1,'participant retains listing context');
    await as(other,true);
    await db.query(`update public.listings set status='removed' where id=$1`,[listing]);
    await as(seller);
    await assert.rejects(db.query(`update public.listings set status='active' where id=$1`,[listing]));
    await as(other,true);
    await db.query(`update public.listings set status='active' where id=$1`,[listing]);
    await as('');assert.equal((await db.query('select * from public.listings')).rows.length,1);
  }finally{await db.close();}
});
