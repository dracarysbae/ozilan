import test from 'node:test';
import assert from 'node:assert/strict';
import { updateListingMotion, clearListingMotion } from '../src/lib/listing-motion.ts';

function surface() {
  const writes=[];
  const node=name=>({
    style:new Proxy({}, {set(target,key,value){writes.push(`${name}.style.${String(key)}`);target[key]=value;return true;}}),
    dataset:new Proxy({}, {set(target,key,value){writes.push(`${name}.data.${String(key)}`);target[key]=value;return true;}}),
  });
  return {view:{card:node('card'),art:node('art'),veil:node('veil'),light:node('light'),resident:null,open:null,progress:-1,transform:''},writes};
}

test('directional entrances retain the mirrored 3D motion, zoom and light sweep',()=>{
  for(const side of [-1,1]) {
    const {view}=surface();
    updateListingMotion(view,844,400,844,side);
    assert.equal(view.progress,0);
    assert.ok(view.card.style.transform.includes(`translateX(${side*54}px) rotateY(${side*24}deg)`));
    assert.equal(view.art.style.transform,'scale(1.18)');
    assert.equal(view.light.style.transform,'translate3d(-110%,0,0)');
    updateListingMotion(view,624,400,844,side);
    assert.equal(view.progress,.5);
    assert.equal(view.veil.style.transform,`translate3d(${-side*50}%,0,0)`);
    updateListingMotion(view,404,400,844,side);
    assert.equal(view.progress,1);
    assert.equal(view.art.style.transform,'scale(1)');
    assert.equal(view.light.style.transform,'translate3d(110%,0,0)');
  }
});

test('settled scrolling does not repeatedly update artwork, masks or inherited variables',()=>{
  const {view,writes}=surface();
  updateListingMotion(view,200,400,844,-1);writes.length=0;
  for(let top=199;top>=0;top--)updateListingMotion(view,top,400,844,-1);
  assert.deepEqual(writes,[]);
  updateListingMotion(view,-40,400,844,-1);
  assert.deepEqual(writes,['card.style.transform']);
});

test('offscreen cards release promotion and perform no recurring DOM writes',()=>{
  const {view,writes}=surface();
  updateListingMotion(view,600,400,844,1);
  updateListingMotion(view,1200,400,844,1);
  assert.equal(view.card.dataset.listingResident,'false');writes.length=0;
  for(let top=1201;top<2000;top++)updateListingMotion(view,top,400,844,1);
  assert.deepEqual(writes,[]);
});

test('scrolling back reverses the reveal and disabling motion restores plain content',()=>{
  const {view}=surface();
  updateListingMotion(view,200,400,844,1);
  updateListingMotion(view,624,400,844,1);
  assert.equal(view.progress,.5);
  assert.equal(view.card.dataset.listingOpen,'false');
  clearListingMotion(view);
  for(const node of [view.card,view.art,view.veil,view.light])assert.equal(node.style.transform,'');
  assert.equal(view.card.dataset.listingResident,undefined);
  assert.equal(view.card.dataset.listingOpen,undefined);
});
