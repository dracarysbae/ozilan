import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {isSceneResident} from '../src/lib/scene-residency.ts';
import {assetRecoveryScript} from '../src/lib/asset-recovery.ts';

test('an offscreen exhibition retains no drawing surfaces',()=>{
  for(const p of [0,1.2,4.8,6])assert.equal(Array.from({length:7},(_,i)=>isSceneResident(i,p,false)).filter(Boolean).length,0);
});
test('both sides of every visible transition are resident, with at most three panels',()=>{
  for(let step=0;step<=600;step++){
    const p=step/100;
    const visible=Array.from({length:7},(_,i)=>i).filter(i=>isSceneResident(i,p,true));
    assert.ok(visible.includes(Math.floor(p)));
    assert.ok(visible.includes(Math.ceil(p)));
    assert.ok(visible.length<=3);
  }
});
function boot({store=new Map(),online=true,blocked=false}={}){
  const listeners={},replacements=[];
  const current=new URL('https://example.com/ozilan/kesfet/?alan=hizmet&q=montaj#market-results');
  vm.runInNewContext(assetRecoveryScript('/ozilan'),{
    URL,Date,navigator:{onLine:online},
    sessionStorage:{getItem:key=>{if(blocked)throw Error('unavailable');return store.get(key)??null;},setItem:(key,value)=>store.set(key,value)},
    location:{href:current.href,origin:current.origin,replace:value=>replacements.push(value)},
    window:{addEventListener:(name,listener)=>listeners[name]=listener},
  });
  return {listeners,replacements,store};
}
const failedChunk={target:{tagName:'SCRIPT',src:'https://example.com/ozilan/_next/static/chunks/old.js'}};
test('missing own chunk reloads once and preserves the route, filters and anchor',()=>{
  const app=boot();app.listeners.error(failedChunk);app.listeners.error(failedChunk);
  assert.equal(app.replacements.length,1);
  const next=new URL(app.replacements[0]);
  assert.equal(next.pathname,'/ozilan/kesfet/');assert.equal(next.searchParams.get('q'),'montaj');assert.equal(next.hash,'#market-results');
  assert.ok(next.searchParams.has('_oz_refresh'));
  const second=boot({store:app.store});second.listeners.error(failedChunk);assert.equal(second.replacements.length,0);
});
test('offline, blocked storage, image errors and third-party failures never create reload loops',()=>{
  for(const opts of [{online:false},{blocked:true}]){const app=boot(opts);app.listeners.error(failedChunk);assert.equal(app.replacements.length,0);}
  const app=boot();
  app.listeners.error({target:{tagName:'IMG',src:failedChunk.target.src}});
  app.listeners.error({target:{tagName:'SCRIPT',src:'https://other.example/ozilan/_next/static/chunks/x.js'}});
  app.listeners.unhandledrejection({reason:Error('An unrelated application error')});
  assert.equal(app.replacements.length,0);
});
test('a chunk failure during navigation uses the same bounded recovery',()=>{
  const app=boot();app.listeners.unhandledrejection({reason:Error('ChunkLoadError: Loading chunk 10 failed')});
  app.listeners.unhandledrejection({reason:Error('Failed to load chunk /ozilan/_next/static/chunks/old.js')});
  assert.equal(app.replacements.length,1);
});
