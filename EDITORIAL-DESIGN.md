# Editorial visual refinement — 14 September 2026

## Listing scroll performance — 14 September 2026

The "İlk sen keşfet" listing entrance previously changed an inherited CSS variable every frame. That recomputed a clip-path, scaled an inline SVG with blur/noise filters, and ran a 700 ms transform transition that kept chasing scroll updates. The alternating perspective entrance now drives explicit cached card, artwork-plane, reveal-veil and light transforms. The directional wipe, 18% artwork zoom, 3D entry/exit, and light sweep remain; the SVG artwork and its filters are unchanged. A shaded deal badge avoids sampling the moving backdrop. Only nearby cards retain compositor hints; offscreen cards and settled artwork receive no recurring writes. Hover zoom remains for a fine pointer, and keyboard focus exposes the full card.

Interaction QA also found that the capture-phase page-transition handler intercepted favourite/compare buttons inside listing links. It now leaves nested controls to their own handlers, while ordinary card navigation retains the transition curtain.

Validation: production build and static export checks pass (15 pages, 207 asset references). All 17 tests pass, including four new motion tests covering mirrored entrances, reversible reveals, no repeated settled/offscreen DOM writes, and cleanup. Browser checks at 320×740, 390×844 and 1280×900 retain layout and effects without horizontal overflow. All tested listing artwork windows have computed clip-path:none; an entering artwork has no chasing CSS transition. The 320 px view retained two nearby card surfaces out of nine cards. Favourite and comparison toggles worked in place and were restored after testing; motion-off removes all card transforms/veils and motion-on restores them. These are browser and code checks, not physical iPhone/Samsung frame-rate measurements.

## Art direction

Replace repeated pastel hero cards with material-focused still lifes, a navy editorial cover, asymmetrical shopping/gift compositions, a warm workshop feature and horizontal expertise listings. Keep the original home hero, ScrollJourney and ScrollExperience effects. Add a shared-frame cached scroll parallax, diagonal mask reveal, periodic light sweep, and secondhand category hotspots. No additional packages or paid services.

## Asset provenance

Generated with the built-in image_gen tool (three new image generations). Photographic-style concept illustrations, not photographs of actual listings or providers; visible captions explicitly label them as representative. No logos or identities supplied. Original outputs were 1536 × 1024; Sharp produced WebP variants at 640 and 1280 pixels, quality 84. All six variants total approximately 487 KB.

Final project files:
- `ozilan/public/editorial/objects-640.webp` and `objects-1280.webp`
- `ozilan/public/editorial/flowers-640.webp` and `flowers-1280.webp`
- `ozilan/public/editorial/studio-640.webp` and `studio-1280.webp`

Reproduction: `node ozilan/scripts/prepare-editorial-assets.cjs <objects.png> <flowers.png> <studio.png>`.

### Objects prompt

Create an original photorealistic editorial still-life photograph for a high-end Turkish multi-marketplace website, conveying beautifully cared-for objects finding a new owner. Landscape 3:2 image, extremely sophisticated independent design-magazine art direction, medium format camera, tactile natural materials and convincing daylight, not a rendered startup illustration. A navy wool overshirt draped casually on the left side of a brushed stainless steel open shelf, a cognac leather shoulder bag with visible stitching and gentle patina in the center, an unbranded silver compact film camera and dark over-ear headphones placed on a travertine plinth at right, a short stack of two cream design books with completely blank spines. Matte midnight blue wall and warm chalk floor, afternoon directional sunlight, soft long shadows, honest imperfections, fine fabric weave, crisp metal reflections, editorial composition with depth and asymmetrical breathing room. Most objects in center-right two thirds so image can crop responsively. Rich navy, warm tan and off-white palette with a tiny red-orange fabric label accent. No people, no letters, no brands, no logos, no watermarks, no UI, no gradient blobs, no floating objects, no decorative neon, no excessive props. The photograph should feel like a real boutique's beautifully composed display, grounded and desirable, not an AI advertising cliché.

### Flowers prompt

Create an original ultra-photorealistic luxury editorial still-life photograph for the flower and gift section of a Turkish design-led marketplace. Landscape 3:2 crop. A loose sculptural bouquet of blush pink ranunculus, a few rust-red anthurium petals, cream cosmos and delicate olive foliage, standing in a low handmade ivory ceramic vase on a rich dark plum tabletop. Beside it an unbranded pale-pink gift box with a natural dark burgundy fabric ribbon, and a small blank folded ivory note card. Real tactile petals, subtle irregular leaf shapes, soft northern window daylight and beautifully long warm shadows. Background matte pale peach plaster, high-end independent design magazine, restrained and editorial not bridal or generic florist advertising, sophisticated visual hierarchy with objects clustered right of center, generous breathing room, realistic materials, crisp detail, 50 mm camera. No people, no lettering, no brand logos, no watermark, no UI, no glitter, no floating objects, no CGI plastic aesthetic.

### Studio prompt

Create an original photorealistic architectural editorial photograph for the expertise, local services and freelance section of a Turkish premium marketplace. Wide landscape 3:2 composition. An intimate empty creative studio in Istanbul: a long oak workbench with a closed unbranded thin silver laptop, neatly fanned thick paper color swatches in midnight blue, chalk white and muted orange, a cream notebook with blank pages, a graphite pencil, a small steel architect model made of simple planes, and a beautiful dark olive adjustable task lamp. A folded blue carpenter's apron rests on a wooden stool at the edge. Tall sunlit window outside frame left casts diagonal shadows across warm off-white plaster and walnut shelves, subtle workshop details in background, authentic human workspace without any person present. Quiet craft, material sophistication, warm daylight balanced with deep blue accents, medium format photographic realism, extremely refined editorial art direction, no text anywhere, no typography, no logos, no fake interface on screens, no glowing gradients, no generic tech icons, no watermarks.

## Checks

- Production static export and TypeScript succeeded; 15 routes generated.
- Existing marketplace data/filter suite: 5/5 passed.
- Secondhand hotspot selects Moda: 255 → 51 listings. Combining condition Az kullanılmış gives 16.
- Mobile photo parallax changed from -15.3px to +19.8px while scrolling; visible-area animations run, offscreen light/ring animation pauses. The user's motion toggle still disables decorative motion.
- Responsive QA and publishing results are recorded in the task delivery.

## Boundaries

Browser-local demo storage and existing catalog illustrations remain. This work does not enable payments, live stock, messaging or provider delivery. OzBirArada remains a working name pending trademark/domain checks, as documented in MARKETPLACE-RELEASE.md.

## Motion restoration after user review

The first editorial pass removed the floating secondhand and marketplace covers, replaced the animated category cards, and placed a tall photo section ahead of the horizontal category journey. Keeping the old animation source was insufficient: the effects were absent from those new surfaces or too far down the page. The user explicitly rejected that result.

- All seven discovery areas now appear in an animated navigation at the top of the home page.
- The original three-scene horizontal journey directly follows the hero; photography comes later.
- The hero's Vasıta tab transitions to the car scene in place. The category navigation and Vasıta scene link still open vehicle discovery.
- Restored floating cover illustrations and the four original category cards; retained the newer editorial photographs further down the home page.
- Connected the original alternating sideways rotation, clipping and light sweep to secondhand and marketplace cards as well as home listings.
- Newly filtered cards and replaced category heroes are registered with the motion loop while scrolling is idle. Visibility pauses offscreen ambient loops.
- The explicit motion toggle remains available; full motion is active on mobile as requested.

Validation: production export passed. Browser checks at 320, 390 and 1280 pixels found no horizontal page overflow. On mobile the horizontal journey reached -92.8852% during the Vasıta transition, with a corresponding 3D object transform. Paired category cards were observed at approximately -17.68/+17.68 degrees and -39.78/+39.78 pixels during their entrance. Secondhand filtering retained 24 animated cards while narrowing Moda to 51 results. Both shopping and gift covers ran marketLevitate, with six animated catalog cards and no browser console errors.
# September 14 — seven-area discovery and vehicle showroom

- Removed the large “Yeni bir hikâye” ribbon and replaced the same phrase in the home invitation and secondhand collection copy.
- Both home showcases now contain all seven areas. The vertical-to-horizontal collection keeps its original perspective, orbit, floating illustration and light effects. Scene navigation and progress derive from the scene count.
- Main search follows the selected collection. Shopping, gifts, services and freelance links open the corresponding search and category filters. Share-search copies a URL with public filters; private favorites are excluded, and clipboard failure exposes a selectable link.
- Vasıta has a continuous night-blue showroom through category selection and configuration. Seven original metallic vehicle illustrations, mobile hero artwork, moving light, perspective entrances and tactile selected filters replace the plain white workspace. Offscreen continuous animation pauses.
- Listing search now has a blue context header, category navigation, a distinct filter surround and sideways perspective listing reveals. Marketplace and resale filter surfaces also receive the material treatment.
- Validation: production static export and TypeScript passed (15 routes); all eight marketplace tests passed, including category deep links, Turkish shared-search round trips and malformed-filter rejection. Browser checks covered 320/390/1280 widths, seven-scene navigation to Freelance, a Yazılım link opening two results, an orkide search opening one gift, clipboard success, Volkswagen filtering to four listings, and invalid budgets disabling submit. No horizontal overflow observed in those checks. A physical-phone FPS or thermal claim is not made.
# September 14 — mobile loading hardening and one category picker

- Incident investigation: the current public HTML and its 13 CSS/JS references returned HTTP 200. The browser showed a 14,146 CSS-pixel page surface and 21 permanently promoted object/copy/ring elements in seven offscreen journey panels. This is a concrete rendering risk; the reported physical-phone crash was not directly reproduced.
- Page transitions now animate a viewport curtain and a bounded intro, never the entire document or a page-wide zero-opacity surface. Timers/frames are released on navigation; a stalled navigation cannot permanently cover the page.
- Only the current scene and transition neighbours retain drawing layers (maximum three); offscreen residency and promotion are zero. Visible perspective, floating objects, rings, scroll transitions and light sweeps remain. Hero ambient loops pause out of view; shine uses transforms instead of animated layout positions.
- A bootstrap preceding every Next script retries missing first-party chunks once, preserving route/filter/hash. Offline state, inaccessible session storage, unrelated errors and repeat attempts do not loop. Static export now validates every local chunk path and places the bootstrap first.
- Removed the top category grid and duplicate journey category navigation. Keşif Koleksiyonu retains all seven selections and receives the original staggered category entrance. The lower illustrated cards now lead to specific useful searches instead of repeating the category menu.
- Verification: 13 automated tests, 15 exported HTML pages and 207 local chunk references pass. Mobile browser checks at 320/390 pixels confirm one seven-button picker, no horizontal overflow, zero offscreen scene promotions, visible adjacent-scene perspective transitions, final-scene/back navigation, and an unchanged fully opaque document during the curtain transition. A real intentional missing-script fixture reloaded once and remained stable, then its test state was cleared. Physical iPhone/Samsung verification remains a user-device check.
