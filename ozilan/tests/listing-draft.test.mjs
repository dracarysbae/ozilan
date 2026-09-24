import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDraft,draftKey,PHOTO_DRAFT_TTL} from '../src/lib/listing-draft.ts';

const photo='cloudinary/10000000-0000-4000-8000-000000000001/a0000000-0000-4000-8000-000000000001.webp';
const base={v:1,savedAt:1_000_000,step:2,cat:'vasita',sub:'otomobil',deal:'Satılık',title:'Temiz aile aracı',desc:'',city:'Ankara',district:'Çankaya',price:450000,attrs:{yakit:'Dizel'},path:[],photoPaths:[photo],photosAt:1_000_000};

test('drafts are stored per member and restore their fields',()=>{
  assert.notEqual(draftKey('a'),draftKey('b'));
  const d=parseDraft(JSON.stringify(base),1_000_000+60_000);
  assert.equal(d.title,'Temiz aile aracı');assert.equal(d.step,2);assert.deepEqual(d.photoPaths,[photo]);
});
test('photos older than the cleanup window are dropped, text is kept',()=>{
  const d=parseDraft(JSON.stringify(base),1_000_000+PHOTO_DRAFT_TTL+1);
  assert.deepEqual(d.photoPaths,[]);assert.equal(d.title,'Temiz aile aracı');
});
test('foreign, malformed, empty or expired drafts are ignored',()=>{
  assert.equal(parseDraft('{broken',0),null);
  assert.equal(parseDraft(JSON.stringify({...base,v:2}),1_000_000),null);
  assert.equal(parseDraft(JSON.stringify({...base,cat:'',title:'',photoPaths:[]}),1_000_000),null);
  assert.equal(parseDraft(JSON.stringify(base),1_000_000+15*24*3600e3),null);
  const d=parseDraft(JSON.stringify({...base,photoPaths:['https://evil.example/x.webp',photo],step:99,price:-5}),1_000_000);
  assert.deepEqual(d.photoPaths,[photo]);assert.equal(d.step,3);assert.equal(d.price,'');
});
