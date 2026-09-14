/** Keep the visible panel and immediate transition neighbours resident, independent of total count. */
export function isSceneResident(index:number,position:number,inViewport:boolean):boolean {
  return inViewport && Math.abs(index-position)<=1.05;
}
