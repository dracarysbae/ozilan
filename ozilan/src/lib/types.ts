export type AttrValue = string | number | boolean;

export type Listing = {
  id: string;
  title: string;
  desc: string;
  cat: string;
  sub: string;
  deal: string;
  price: number;
  city: string;
  district: string;
  attrs: Record<string, AttrValue>;
  createdAt: number;
  bumpedAt: number;
  sellerId: string;
  views: number;
  photos: number;
  status: "active" | "pending" | "removed";
  featured?: boolean;
  /** deterministic art seed */
  art: number;
};

export type Seller = {
  id: string;
  name: string;
  kind: "bireysel" | "kurumsal";
  city: string;
  joinedAt: number;
  verified: boolean;
  rating: number;
  reviews: number;
  responseMins: number;
  phone: string;
};

export type Message = {
  id: string;
  threadId: string;
  from: string;
  body: string;
  at: number;
};

export type Thread = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  updatedAt: number;
};

export type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  kind: "bireysel" | "kurumsal";
  createdAt: number;
  role: "user" | "admin";
};

export type Report = {
  id: string;
  listingId: string;
  reason: string;
  note: string;
  at: number;
  by: string;
  state: "open" | "resolved";
};
