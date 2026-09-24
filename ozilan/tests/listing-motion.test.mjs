import test from 'node:test';
import assert from 'node:assert/strict';
import { updateListingMotion, clearListingMotion, revealProgress, motionAmplitude } from '../src/lib/listing-motion.ts';
import { journeyPosition } from '../src/lib/scene-residency.ts';

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
    updateListingMotion(view,688,400,844,side);
    assert.equal(view.progress,.5);
    assert.equal(view.veil.style.transform,`translate3d(${-side*50}%,0,0)`);
    updateListingMotion(view,532,400,844,side);
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
  updateListingMotion(view,688,400,844,1);
  assert.equal(view.progress,.5);
  assert.equal(view.card.dataset.listingOpen,'false');
  clearListingMotion(view);
  for(const node of [view.card,view.art,view.veil,view.light])assert.equal(node.style.transform,'');
  assert.equal(view.card.dataset.listingResident,undefined);
  assert.equal(view.card.dataset.listingOpen,undefined);
});

test('cards settle before they reach the reading zone',()=>{
  // iPhone-sized viewport, typical card: straight once its top passes ~55% of the screen
  assert.equal(revealProgress(664*.55,380,664),1);
  assert.ok(revealProgress(600,380,664)<.5);
});

test('narrow screens use a calmer entrance amplitude',()=>{
  const {view}=surface();
  updateListingMotion(view,844,400,844,1,motionAmplitude(390));
  assert.ok(view.card.style.transform.includes('translateX(29.7px) rotateY(13.2deg)'));
  assert.equal(motionAmplitude(1440),1);
});

test('journey rail dwells on each scene and still reaches both ends',()=>{
  assert.equal(journeyPosition(0,7),0);
  assert.equal(journeyPosition(1,7),6);
  const step=1/6;
  assert.equal(journeyPosition(step*2.1,7),2);
  assert.equal(journeyPosition(step*2.9,7),3);
  assert.equal(journeyPosition(step*2.5,7),2.5);
  let prev=-1;for(let p=0;p<=1;p+=.001){const x=journeyPosition(p,7);assert.ok(x>=prev-1e-9);prev=x;}
});
