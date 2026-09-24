/** Keep the visible panel and immediate transition neighbours resident, independent of total count. */
export function isSceneResident(index:number,position:number,inViewport:boolean):boolean {
  return inViewport && Math.abs(index-position)<=1.05;
}

/**
 * Maps linear scroll progress to a rail position that dwells on each scene.
 * About 40% of every step keeps the scene perfectly centred, so readers never
 * stop scrolling on a half-shifted panel with neighbouring copy cut at the edge.
 */
export function journeyPosition(progress:number,count:number):number {
  const steps=Math.max(0,count-1);
  const raw=Math.max(0,Math.min(1,progress))*steps;
  const base=Math.min(Math.floor(raw),Math.max(0,steps-1));
  const t=Math.max(0,Math.min(1,(raw-base-.2)/.6));
  return Math.min(steps,base+t*t*(3-2*t));
}
