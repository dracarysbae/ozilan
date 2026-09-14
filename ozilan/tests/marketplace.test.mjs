import test from 'node:test';
import assert from 'node:assert/strict';
import { MARKET_AREAS, MARKET_ITEMS, filterMarket, areaFor, isGoods, readMarketFilters, marketSearchHref } from '../src/data/marketplace.ts';

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
test('collection links open the intended area and subcategory', () => {
  for (const area of MARKET_AREAS) for (const category of area.categories) {
    const href=marketSearchHref({area:area.id,category});
    const filters=readMarketFilters(new URL(href,'https://example.com').searchParams);
    assert.equal(filters.area,area.id);
    assert.equal(filters.category,category);
    const items=filterMarket(MARKET_ITEMS,filters);
    assert.ok(items.length>0,`${area.id}/${category}`);
    assert.ok(items.every(item=>item.area===area.id&&item.category===category));
  }
});
test('shared searches preserve Turkish text, budgets, ordering and timing', () => {
  const expected={...base,area:'hizmet',category:'Tadilat',query:'mobilya montaj',city:'İzmir',max:'1000',sort:'price-up',fast:true};
  const params=new URL(marketSearchHref(expected),'https://example.com').searchParams;
  assert.deepEqual(readMarketFilters(params),expected);
  assert.deepEqual(filterMarket(MARKET_ITEMS,readMarketFilters(params)).map(i=>i.id),['service-6']);
});
test('foreign categories and malformed budgets cannot poison a shared search', () => {
  for (const max of ['-1','Infinity','NaN','abc',' ']) {
    const filters=readMarketFilters(new URLSearchParams({alan:'freelance',kategori:'Buketler',il:'İzmir',max,s:'bad'}));
    assert.equal(filters.category,'');assert.equal(filters.city,'');assert.equal(filters.max,'');assert.equal(filters.sort,'curated');
    assert.equal(filterMarket(MARKET_ITEMS,filters).length,6);
  }
  assert.equal(readMarketFilters(new URLSearchParams({max:'0'})).max,'0');
});
