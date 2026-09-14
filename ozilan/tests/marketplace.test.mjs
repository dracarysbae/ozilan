import test from 'node:test';
import assert from 'node:assert/strict';
import { MARKET_AREAS, MARKET_ITEMS, filterMarket, areaFor, isGoods } from '../src/data/marketplace.ts';

const base = {area:'alisveris',category:'',query:'',city:'',max:'',sort:'curated',fast:false};
test('each offering belongs to one valid area/category and has a unique identity', () => {
  assert.equal(new Set(MARKET_ITEMS.map(i => i.id)).size, MARKET_ITEMS.length);
  for (const item of MARKET_ITEMS) {
    const area = MARKET_AREAS.find(a => a.id === item.area);
    assert.ok(area.categories.includes(item.category), item.id);
    assert.ok(item.price > 0 && item.days >= 1 && item.includes.length > 0, item.id);
  }
});
test('combined technology and budget filters do not leak another area', () => {
  assert.deepEqual(filterMarket(MARKET_ITEMS, {...base, category:'Teknoloji',max:'3500'}).map(i=>i.id), ['shop-1']);
});
test('Turkish query tokens, city and service timing intersect', () => {
  assert.deepEqual(filterMarket(MARKET_ITEMS, {...base,area:'hizmet',city:'İzmir',query:'mobilya montaj',fast:true}).map(i=>i.id), ['service-6']);
  assert.equal(filterMarket(MARKET_ITEMS, {...base,area:'hizmet',city:'Ankara',query:'montaj'}).length,0);
  assert.deepEqual(filterMarket(MARKET_ITEMS, {...base,query:'KABLOSUZ'}).map(i=>i.id), ['shop-1']);
});
test('price sorting is numeric and leaves the source order intact', () => {
  const before = MARKET_ITEMS.map(i=>i.id);
  const ascending = filterMarket(MARKET_ITEMS,{...base,sort:'price-up'});
  assert.deepEqual(ascending.map(i=>i.price),[890,1290,1790,3490,4290,8490]);
  assert.deepEqual(filterMarket(MARKET_ITEMS,{...base,sort:'price-down'}).map(i=>i.id),ascending.map(i=>i.id).reverse());
  assert.deepEqual(MARKET_ITEMS.map(i=>i.id),before);
});
test('fallback area and goods/service distinction support separate flows', () => {
  assert.equal(areaFor('unknown').id,'alisveris');
  assert.equal(areaFor('freelance').id,'freelance');
  assert.equal(isGoods('cicek-hediye'),true);
  assert.equal(isGoods('hizmet'),false);
  assert.equal(isGoods('freelance'),false);
});
