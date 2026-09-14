# OzBirArada: multi-marketplace discovery release

## Product scope

The existing classifieds, comparison, vehicle taxonomy, favourites and listing creation remain connected. New routes use the current `/ozilan/` base path:

- `/kesfet/?alan=alisveris`: product discovery, categories, numeric budget/sort filters, favourites, quantities and persistent cart.
- `/kesfet/?alan=cicek-hediye`: gift selection, note/date preferences, cart and order drafts.
- `/kesfet/?alan=hizmet`: city/service filters and scoped request drafts.
- `/kesfet/?alan=freelance`: expertise discovery and project scope/budget drafts.
- `/akis/`: secondhand discovery using the existing listing pool, seller closets, local follows, existing favourites, city-based nearby results, conditions, sorting, incremental loading and offer drafts.

These are working browser-local discovery flows. Products/providers are examples. No payment, reservation, shipping, live messaging or remote order fulfilment is implied. A real marketplace requires server authentication, catalog ownership, inventory and order APIs, payment-provider integration, seller onboarding, moderation, fraud handling and durable server persistence. No paid service was activated for this release.

## Motion and navigation

The three-scene horizontal showcase retains object perspective, rotating rings, parallax copy and scene progress. Geometry is measured on resize rather than every frame. Only changed values and nearby cards receive writes. Offscreen scene animations pause and the permanent full-page compositor layer was removed.

Query-only navigation now bypasses the pathname-based page curtain; otherwise repeated sector changes could leave navigation locked. Mobile menu query links close the menu as well. Gift dates are collected from submitted form data, preserving the selected browser date in the cart/draft.

## Naming audit — 2026-09-14

The user requires a meaningful main name containing `Oz`, with no known previous use. The working name **OzBirArada** expresses the product promise: listings, shopping, gifts and expertise together. **OzBuldum** is an alternative expressing discovery.

Exact public-web queries for `"OzBirArada"`, `"ÖzBirArada"`, `"OzBuldum"`, and `"ÖzBuldum"` returned no results at the time of review. This is a preliminary search, not proof of worldwide non-use or legal clearance. Generic category labels are descriptive, not separately claimed exclusive brands.

Domain registration could not be verified: direct Verisign RDAP requests failed to connect and the browser blocked that endpoint. No domain was purchased. Trademark registers, similar marks, social handles and historical uses have not been conclusively cleared. Obtain those results before committing to brand registration or paid launch materials. The repository name, URLs and browser-storage keys remain `ozilan` to preserve compatibility.

## Validation

Run production export with `NODE_ENV=production` and `NEXT_PUBLIC_BASE_PATH=/ozilan`.

`node --experimental-strip-types --test tests/marketplace.test.mjs` checks area/category integrity, combined filtering, Turkish text search, numeric price ordering, non-mutation and goods/service routing.

Browser checks include repeated area navigation, gift notes/date, quantities and totals, persistence after reload, service and freelance drafts, city-based secondhand filtering, favourite selection, seller follow persistence and offer drafts. Native dialogs support close/backdrop/Escape. Responsive layout and existing home showcase are inspected separately; no physical-device FPS claim is made.
