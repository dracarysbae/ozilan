import test from 'node:test';
import assert from 'node:assert/strict';
import {safeReturnPath,listingFromRow,sellerFromRow,messageFromRow} from '../src/lib/listing-data.ts';

test('authentication return paths preserve local context and reject external redirects',()=>{
  for(const path of ['/ilan/?id=123','/ilan-ver/?duzenle=123','/mesajlar/?gorusme=456','/akis/']) {
    assert.equal(safeReturnPath(path),path);
    assert.equal(new URL(path,'https://example.com').origin,'https://example.com');
  }
  for(const path of [null,'','https://evil.test','//evil.test','/\\evil.test','/ilan/\r\n//evil.test','/%2f%2fevil.test','/unknown/','javascript:alert(1)']) {
    assert.equal(safeReturnPath(path),'/hesap/');
  }
});

test('database records retain prices, photographs and ownership without invented metrics',()=>{
  const listing=listingFromRow({id:'ad-1',seller_id:'seller-1',title:'Fotoğraflı bir ilan',description:'Açıklama',category:'alisveris',subcategory:'teknoloji',deal:'Satılık',price:'1350.50',city:'İstanbul',district:'Kadıköy',attributes:{},path:[],path_labels:[],photo_paths:['seller-1/a.webp','seller-1/b.webp'],status:'active',created_at:'2026-09-14T10:00:00Z',bumped_at:'2026-09-14T10:00:00Z'});
  assert.equal(listing.price,1350.5);
  assert.equal(listing.sellerId,'seller-1');
  assert.equal(listing.photos,2);
  assert.deepEqual(listing.photoPaths,['seller-1/a.webp','seller-1/b.webp']);
  assert.equal(listing.views,0);
  const seller=sellerFromRow({id:'seller-1',name:'Ada',kind:'bireysel',city:'İstanbul',created_at:'2026-09-14T10:00:00Z'});
  assert.equal(seller.verified,false);
  assert.equal(seller.reviews,0);
  assert.equal(seller.phone,'');
  const message=messageFromRow({id:'m-1',thread_id:'thread-1',sender_id:'seller-1',body:'Gerçek yanıt',created_at:'2026-09-14T10:01:00Z'});
  assert.equal(message.from,'seller-1');
  assert.equal(message.threadId,'thread-1');
  assert.equal(message.body,'Gerçek yanıt');
});
