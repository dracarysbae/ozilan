"use client";
import type {Listing} from "@/lib/types";
import {publicPhoto} from "@/lib/backend";
import {Artwork} from "./Artwork";
export function ListingImage({listing,index=0,className="",eager=false}:{listing:Listing;index?:number;className?:string;eager?:boolean}){
  const path=listing.photoPaths?.[index]??listing.photoPaths?.[0];
  if(path)return <img src={publicPhoto(path)} alt={`${listing.title} · fotoğraf ${index+1}`} className={`${className} object-cover`} loading={eager?"eager":"lazy"} decoding="async" width={1600} height={1200}/>;
  return <Artwork seed={listing.art+index*977} sub={listing.sub} kind={String(listing.pathLabels?.join(" ")??listing.attrs.tip??"")} className={className} label={listing.title}/>;
}
