import type { Listing, Seller, Thread, Message } from "./types";

export type ListingRow = {
  id:string;seller_id:string;title:string;description:string;category:string;subcategory:string;deal:string;
  price:number;city:string;district:string;attributes:Listing["attrs"];path:string[];path_labels:string[];
  photo_paths:string[];status:Listing["status"];created_at:string;bumped_at:string;
};
export const listingFromRow=(r:ListingRow):Listing=>({
  id:r.id,sellerId:r.seller_id,title:r.title,desc:r.description,cat:r.category,sub:r.subcategory,deal:r.deal,
  price:Number(r.price),city:r.city,district:r.district,attrs:r.attributes,path:r.path,pathLabels:r.path_labels,
  photoPaths:r.photo_paths,photos:r.photo_paths.length,status:r.status,createdAt:Date.parse(r.created_at),bumpedAt:Date.parse(r.bumped_at),views:0,
  art:r.id.split("").reduce((n,c)=>(n*31+c.charCodeAt(0))%999999,0),
});
export const sellerFromRow=(r:{id:string;name:string;kind:Seller["kind"];city:string;created_at:string}):Seller=>({
  id:r.id,name:r.name,kind:r.kind,city:r.city,joinedAt:Date.parse(r.created_at),verified:false,rating:0,reviews:0,responseMins:0,phone:"",
});
export const threadFromRow=(r:{id:string;listing_id:string;buyer_id:string;seller_id:string;updated_at:string}):Thread=>({id:r.id,listingId:r.listing_id,buyerId:r.buyer_id,sellerId:r.seller_id,updatedAt:Date.parse(r.updated_at)});
export const messageFromRow=(r:{id:string;thread_id:string;sender_id:string;body:string;created_at:string}):Message=>({id:r.id,threadId:r.thread_id,from:r.sender_id,body:r.body,at:Date.parse(r.created_at)});

/** A return link is a local application route, never an external redirect. */
export function safeReturnPath(value:string|null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/hesap/";
  const path=value.split(/[?#]/)[0];
  return ["/hesap/","/ilan-ver/","/ilan/","/mesajlar/","/favorilerim/","/kesfet/","/arama/","/akis/"].includes(path) ? value : "/hesap/";
}
