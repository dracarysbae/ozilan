import test from 'node:test';
import assert from 'node:assert/strict';
import {MARKET_ATTRS} from '../src/data/market-attrs.ts';
import {contactStarter,withGiftPreferences} from '../src/lib/contact-starter.ts';

test('every marketplace area publishes its own fields, core categories keep theirs',()=>{
  for(const area of ['alisveris','cicek-hediye','hizmet','freelance']){
    const defs=MARKET_ATTRS[area];assert.ok(defs.length>=4,area);
    assert.ok(defs.some(d=>d.required),area+' has required fields');
    assert.equal(new Set(defs.map(d=>d.key)).size,defs.length);
  }
  const text=JSON.stringify(MARKET_ATTRS);
  assert.ok(!/stok garantisi|kesin teslim|emanet/i.test(text),'no platform guarantees in field labels');
});

test('contact starters fit each area and gift preferences stay inside the message',()=>{
  assert.match(contactStarter('hizmet'),/kapsam/i);
  assert.match(contactStarter('freelance'),/Bütçe/);
  assert.equal(contactStarter('emlak'),'Merhaba, ilan hâlâ güncel mi?');
  const body=withGiftPreferences('Merhaba','2026-10-05','İyi ki doğdun');
  assert.equal(body,'Merhaba\nTercih ettiğim gün: 05.10.2026\nKart notu: İyi ki doğdun');
  assert.equal(withGiftPreferences('Merhaba','bozuk',''),'Merhaba');
  assert.ok(withGiftPreferences('a'.repeat(1990),'2026-10-05','x'.repeat(500)).length<=2000);
});
