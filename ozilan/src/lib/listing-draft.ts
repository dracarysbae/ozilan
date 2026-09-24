/**
 * Unsent new-listing drafts are kept only in this browser and only under the
 * signed-in member's id, so a shared device never shows one member's draft to
 * another. Uploaded photos are dropped from a draft after 20 hours: unlinked
 * uploads are removed by the server's 24-hour cleanup, and a stale reference
 * would only fail at publish time.
 */
export type ListingDraft = {
  v: 1; savedAt: number; step: number;
  cat: string; sub: string; deal: string; title: string; desc: string; city: string; district: string;
  price: number | ""; attrs: Record<string, unknown>; path: string[]; photoPaths: string[]; photosAt: number;
};
export const PHOTO_DRAFT_TTL = 20 * 60 * 60 * 1000;
const DRAFT_TTL = 14 * 24 * 60 * 60 * 1000;
export const draftKey = (userId: string) => `ozilan.draft.${userId}`;

export function hasContent(d: Pick<ListingDraft, "cat" | "title" | "desc" | "photoPaths">) {
  return Boolean(d.cat || d.title.trim() || d.desc.trim() || d.photoPaths.length);
}

export function parseDraft(raw: string | null, now = Date.now()): ListingDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<ListingDraft>;
    if (d?.v !== 1 || typeof d.savedAt !== "number" || now - d.savedAt > DRAFT_TTL) return null;
    const str = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : "");
    const list = (x: unknown, max: number) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === "string").slice(0, max) : []);
    const photosFresh = typeof d.photosAt === "number" && now - d.photosAt < PHOTO_DRAFT_TTL;
    const draft: ListingDraft = {
      v: 1, savedAt: d.savedAt, step: Math.max(0, Math.min(3, Number(d.step) || 0)),
      cat: str(d.cat, 40), sub: str(d.sub, 100), deal: str(d.deal, 40), title: str(d.title, 90), desc: str(d.desc, 8000),
      city: str(d.city, 80), district: str(d.district, 80),
      price: typeof d.price === "number" && Number.isFinite(d.price) && d.price >= 0 ? d.price : "",
      attrs: d.attrs && typeof d.attrs === "object" && !Array.isArray(d.attrs) ? d.attrs : {},
      path: list(d.path, 8),
      photoPaths: photosFresh ? list(d.photoPaths, 6).filter((p) => /^cloudinary\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(p)) : [],
      photosAt: photosFresh ? (d.photosAt as number) : 0,
    };
    return hasContent(draft) ? draft : null;
  } catch { return null; }
}

export function readDraft(userId: string) {
  try { return parseDraft(localStorage.getItem(draftKey(userId))); } catch { return null; }
}
export function writeDraft(userId: string, draft: ListingDraft) {
  try { if (hasContent(draft)) localStorage.setItem(draftKey(userId), JSON.stringify(draft)); else localStorage.removeItem(draftKey(userId)); } catch { /* storage unavailable: nothing to keep */ }
}
export function clearDraft(userId: string) {
  try { localStorage.removeItem(draftKey(userId)); } catch { /* ignore */ }
}
