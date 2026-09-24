/** Scroll changes only compositor transforms; artwork filters stay on a stable surface. */
export type ListingMotion = {
  card: HTMLElement;
  art: HTMLElement;
  veil: HTMLElement;
  light: HTMLElement;
  resident: boolean | null;
  open: boolean | null;
  progress: number;
  transform: string;
};

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Entrance progress for a card. It settles once the card's top edge reaches
 * roughly the middle of the viewport, so a card is never tilted or veiled
 * while it sits in the reading zone (earlier it only settled near the top).
 */
export function revealProgress(top: number, height: number, viewport: number) {
  return Math.round(clamp((viewport - top) / (Math.min(viewport * .36, height * .7) + 32)) * 10000) / 10000;
}

/** Narrow screens get a calmer entrance so cards never swing past the gutter. */
export function motionAmplitude(width: number) {
  return width < 768 ? .55 : 1;
}

export function cardTransform(side: -1 | 1, progress: number, exit: number, amp = 1) {
  const rest = 1 - progress;
  return `perspective(1100px) translateX(${+(side * rest * 54 * amp).toFixed(2)}px) rotateY(${+(side * rest * 24 * amp).toFixed(2)}deg) rotateZ(${+(side * (rest * 3 * amp + exit * 1.5)).toFixed(3)}deg) scale(${+(.87 + .13 * progress - exit * .035).toFixed(4)})`;
}

export function updateListingMotion(view: ListingMotion, top: number, height: number, viewport: number, side: -1 | 1, amp = 1) {
  const resident = top < viewport + 150 && top + height > -100;
  if (resident !== view.resident) {
    view.card.dataset.listingResident = String(resident);
    view.resident = resident;
  }
  if (!resident) return;

  const progress = revealProgress(top, height, viewport);
  const exit = Math.round(clamp(-top / height) * 10000) / 10000;
  const transform = cardTransform(side, progress, exit, amp);
  if (transform !== view.transform) {
    view.card.style.transform = transform;
    view.transform = transform;
  }
  if (progress === view.progress) return;
  view.progress = progress;
  const open = progress === 1;
  if (open !== view.open) {
    view.card.dataset.listingOpen = String(open);
    view.open = open;
  }
  // A moving opaque veil reproduces the previous directional mask without
  // re-clipping the filtered SVG or cascading a CSS variable through the card.
  view.art.style.transform = `scale(${1.18 - progress * .18})`;
  view.veil.style.transform = `translate3d(${-side * progress * 100}%,0,0)`;
  view.light.style.transform = `translate3d(${-110 + progress * 220}%,0,0)`;
}

export function clearListingMotion(view: ListingMotion) {
  delete view.card.dataset.listingResident;
  delete view.card.dataset.listingOpen;
  for (const node of [view.card, view.art, view.veil, view.light]) node.style.transform = "";
}
