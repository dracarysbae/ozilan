import test from 'node:test';
import assert from 'node:assert/strict';
import {testDatabase} from './fixtures/database.mjs';

test('OAuth profile metadata cannot break signup or grant administrative access',async()=>{
  const db=await testDatabase();
  try{
    const cases=[
      [{full_name:'Deniz Yılmaz'},'Deniz Yılmaz'],
      [{name:'X'},'Yeni üye'],
      [{name:'   ',full_name:'Ada Satıcı'},'Ada Satıcı'],
      [{name:'Ad'.repeat(60),role:'admin'},'Ad'.repeat(40)],
      [{},'Yeni üye'],
    ];
    for(let i=0;i<cases.length;i++) {
      const [metadata,expected]=cases[i];
      const id=`40000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`;
      await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id,JSON.stringify(metadata)]);
      const profile=(await db.query('select name,kind from public.profiles where id=$1',[id])).rows[0];
      assert.equal(profile.name,expected);
      assert.equal(profile.kind,'bireysel');
    }
    await db.query(`select set_config('request.jwt.claims',$1,false)`,[JSON.stringify({user_metadata:{role:'admin'},app_metadata:{}})]);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select public.is_admin() allowed')).rows[0].allowed,false);
  }finally{await db.close();}
});
