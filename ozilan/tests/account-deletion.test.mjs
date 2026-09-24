import test from 'node:test';
import assert from 'node:assert/strict';
import {testDatabase} from './fixtures/database.mjs';

test('a member can erase only their own account, and others keep a scrubbed conversation',async()=>{
  const db=await testDatabase();
  try{
    const seller='10000000-0000-4000-8000-000000000001',buyer='20000000-0000-4000-8000-000000000002',other='30000000-0000-4000-8000-000000000003';
    for(const [id,name] of [[seller,'Satıcı Üye'],[buyer,'Alıcı Üye'],[other,'Başka Üye']])await db.query(`insert into auth.users(id,raw_user_meta_data) values($1,jsonb_build_object('name',$2::text))`,[id,name]);
    const as=async id=>{await db.exec('reset role');await db.query(`select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims','{}',false)`,[id]);await db.exec(id?'set role authenticated':'set role anon');};
    const photo=n=>`${seller}/a0000000-0000-4000-8000-00000000000${n}.webp`;
    await db.query(`insert into storage.objects(bucket_id,name) values('listing-photos',$1),('listing-photos',$2)`,[photo(1),photo(2)]);
    await as(seller);
    const insert=p=>db.query(`insert into public.listings(title,description,category,subcategory,deal,price,city,district,photo_paths)
      values('Satıcının gerçek ilanı','Bu açıklama ilanın gerçek özelliklerini en az kırk karakterle anlatıyor.','ikinci-el','elektronik','Satılık',900,'İzmir','Bornova',array[$1]) returning id`,[p]);
    const discussed=(await insert(photo(1))).rows[0].id,quiet=(await insert(photo(2))).rows[0].id;
    await db.query(`insert into public.saved_searches(label,href) values('Telefonlar','/arama/?k=ikinci-el')`);
    await as(buyer);
    const thread=(await db.query(`select public.start_thread($1) id`,[discussed])).rows[0].id;
    await db.query(`insert into public.messages(thread_id,body) values($1,'Hâlâ satılık mı?')`,[thread]);
    await db.query(`insert into public.favorites(listing_id) values($1),($2)`,[discussed,quiet]);
    await as(seller);
    await db.query(`insert into public.messages(thread_id,body) values($1,'Evet, telefon numaram 0555 000 00 00')`,[thread]);

    await assert.rejects(db.query(`select public.delete_my_account('evet')`),/Onay metni/);
    await as('');
    await assert.rejects(db.query(`select public.delete_my_account('HESABIMI SİL')`));
    await as(seller);
    await db.query(`select public.delete_my_account('HESABIMI SİL')`);

    await db.exec('reset role');
    assert.equal((await db.query('select * from auth.users where id=$1',[seller])).rows.length,0,'sign-in identity removed');
    const profile=(await db.query('select name,city,deleted_at from public.profiles where id=$1',[seller])).rows[0];
    assert.equal(profile.name,'Silinmiş üye');assert.ok(profile.deleted_at);
    assert.equal((await db.query('select * from public.listings where id=$1',[quiet])).rows.length,0,'undiscussed listing deleted');
    const kept=(await db.query('select status,title,photo_paths,attributes from public.listings where id=$1',[discussed])).rows[0];
    assert.equal(kept.status,'removed');assert.equal(kept.title,'Silinen hesaba ait ilan');assert.deepEqual(kept.photo_paths,[]);
    assert.equal((await db.query('select * from public.saved_searches where user_id=$1',[seller])).rows.length,0);
    assert.ok(!(await db.query('select body from public.messages where sender_id=$1',[seller])).rows.some(r=>/0555/.test(r.body)),'message text erased');

    // A still-valid token of the deleted member cannot write through the tombstone.
    await as(seller);
    await assert.rejects(db.query(`insert into public.messages(thread_id,body) values($1,'Geri döndüm')`,[thread]),/row-level security/);
    await assert.rejects(db.query(`insert into public.listings(title,description,category,subcategory,deal,price,city,district,photo_paths)
      values('Silinmiş hesabın ilanı','Bu açıklama ilanın gerçek özelliklerini en az kırk karakterle anlatıyor.','ikinci-el','elektronik','Satılık',900,'İzmir','Bornova',array[$1])`,[photo(1)]));
    assert.equal((await db.query(`update public.listings set status='active' where id=$1 returning id`,[discussed])).rows.length,0);

    // The buyer keeps the conversation, now without the seller's personal text.
    await as(buyer);
    const messages=(await db.query('select body from public.messages order by created_at')).rows.map(r=>r.body);
    assert.equal(messages.length,2);assert.equal(messages[0],'Hâlâ satılık mı?');
    assert.equal((await db.query('select * from public.favorites')).rows.length,1,'favorite on deleted listing removed');
    // Another member's account and data are untouched.
    await as(other);
    await db.exec('reset role');
    assert.equal((await db.query('select * from auth.users where id=$1',[buyer])).rows.length,1);
    assert.equal((await db.query('select deleted_at from public.profiles where id=$1',[buyer])).rows[0].deleted_at,null);
  }finally{await db.close();}
});
