import {CATEGORIES,MARKET_ATTRS,type Category} from "@/data/taxonomy";
import {MARKET_AREAS} from "@/data/marketplace";
export const categorySlug=(s:string)=>s.toLocaleLowerCase("tr").replace(/ı/g,"i").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export const PUBLISH_CATEGORIES:Category[]=[...CATEGORIES,...MARKET_AREAS.map(area=>({
  slug:area.id,label:area.label,tagline:area.description,dealTypes:area.id==="hizmet"||area.id==="freelance"?["Hizmet"]:["Satılık"],
  subs:area.categories.map(label=>({slug:categorySlug(label),label,attrs:MARKET_ATTRS[area.id]??[],band:[1,1000000] as [number,number]})),
}))];
