# Editorial visual refinement — 14 September 2026

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
