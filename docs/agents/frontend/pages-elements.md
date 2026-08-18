## Pages vs Elements

| Type | Location | Purpose |
|------|----------|---------|
| **Page** | `components/resources/<resource>/pages/` | Top-level route component. One per route. Has its own `controllers/` and `helpers/` sub-folders. |
| **Element (resource-specific)** | `components/resources/<resource>/pages/elements/` | Reusable building block used only by that resource's pages (e.g. `resources/game/pages/elements/GameCard.jsx`). [...]
| **Element (shared)** | `components/common/` | Reusable building block used across more than one resource, or from the app shell (e.g. `Pagination`, `Header`). Also has `controllers/` and `helpers/` [...]

Before placing a new element under a resource's `pages/elements/`, grep for its actual (or
anticipated) importers: if it's only ever imported from that resource's pages, it belongs there;
if it's imported from more than one resource, it belongs under `components/common/` instead.
Naming alone can be misleading — e.g. `TreasureExchangeModal` and `LinksEditModal` are used only
by the `character` resource despite their generic-sounding names, while `TreasureCard` and
`CharacterCard` are shared across resources despite their resource-specific-sounding names.

## Adding a New Page

1. Create `components/resources/<resource>/pages/MyPage.jsx` — state declarations + effect
   wiring only. If the page belongs to a new resource, create the
   `components/resources/<resource>/pages/` folder (with `controllers/`/`helpers/`
   sub-folders) first.
2. Create `components/resources/<resource>/pages/controllers/MyPageController.js` — extend
   `BasePageController` (`components/common/base/controllers/BasePageController.js`), implement
   `buildEffect()`.
3. Create `components/resources/<resource>/pages/helpers/MyPageHelper.jsx` — static class with
   all JSX factories.
4. Register the route in `utils/HashRouteResolver.js` and add the page to `helpers/AppHelper.jsx`
   (import from `../resources/<resource>/pages/MyPage.jsx`).

## Adding a New Element

1. Decide whether the element is specific to one resource or genuinely shared (see "Pages vs
   Elements" above).
2. Resource-specific: create `components/resources/<resource>/pages/elements/MyElement.jsx`.
   Shared: create `components/common/<theme>/MyElement.jsx`, picking (or creating) the themed
   subfolder it belongs to (`buttons/`, `modals/`, `cards/`, `badges/`, `forms/`, `header/`,
   `pagination/`, `list_page/`, `list_types/`, `misc/`, ...) rather than dropping it flat under
   `common/`.
3. If it has logic: add a `controllers/MyElementController.js` alongside it (under
   `pages/elements/controllers/` or `common/<theme>/controllers/`, respectively).
4. If it has complex rendering: add a `helpers/MyElementHelper.jsx` alongside it (under
   `pages/elements/helpers/` or `common/<theme>/helpers/`, respectively).
