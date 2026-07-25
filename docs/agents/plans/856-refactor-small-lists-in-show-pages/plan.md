# Plan: Refactor small lists in show pages

Issue: [856-refactor-small-lists-in-show-pages.md](../issues/856-refactor-small-lists-in-show-pages.md)

## Overview

Replace `GamePreviewSections` and `CharacterPreviewSectionsSlot` — the two hand-written,
per-resource preview-list slots on the game/pc/npc show pages — with one generic, self-fetching
`ShortList` element, configured declaratively per show type. `ShortList` owns its own
`RequestStore` fetch (resource type + item count) and its own click behavior (`none`/`navigate`/
`show picture`), driven by a small per-resource-type behavior registry. The page-level
controllers (`GameController`, `CharacterListsController`) stop pre-fetching these lists; the
pages themselves stop threading `pcs`/`npcs`/`treasures`/`items`/`documents` through as props.

## Context

`ShowPageLayout` (`frontend/assets/js/components/common/show_page/ShowPageLayout.jsx`) renders
`left`/`right`/`bottom` slot arrays declared per show type in `showTypeConfig.js` and its
`show_types/configs/*.js` files. Every slot entry is a component (or `{Show, New, Edit}`
mode-variant) that receives the page's merged context spread as props — so a slot entry can
already be a small factory-built component closing over static config, exactly like
`buildCharacterNameField(...)` etc. do in `pcShowType.js`/`npcShowType.js` today.

Right now:
- `game`'s `right` slot includes `GamePreviewSections` (`resources/game/pages/elements/show/GamePreviewSections.jsx`), rendering PC/NPC preview sections from `pcs`/`npcs` arrays fetched by `GameController#fetchPcsPreview`/`#fetchNpcsPreview` and passed down through `Game.jsx` → `GameHelper.render(game, pcs, npcs, handlers)` → `context={{ ...game, pcs, npcs, handlers }}`.
- `pc`/`npc`'s `right` slot includes `CharacterPreviewSectionsSlot` (`resources/character/pages/elements/show/CharacterPreviewSectionsSlot.jsx`), rendering treasures/items/documents preview sections from arrays merged onto the character by `CharacterListsController#fetchAndMergeTreasures`/`#fetchAndMergeItems`/`#fetchAndMergeDocuments`, chained inside `CharacterController#loadCharacter` (`resources/character/pages/controllers/CharacterController.js`).
- Both slot components use the shared `PreviewSection`/`PreviewSectionHelper` (`common/cards/PreviewSection.jsx`) for the actual "row of cards + See all card" markup, with `MAX_PREVIEW_ITEMS = 5` from `common/cards/characterPreviewConstants.js` as the default cap.
- Click behavior today is baked into each card's helper: `CharacterPreviewCardHelper`/`TreasurePreviewCardHelper` wrap the card in an `<a href="#/...">`; `ItemPreviewCardHelper`/`DocumentPreviewCardHelper` render a plain, non-clickable card.
- Per the confirmed issue: pcs/npcs/treasures/items all get `navigate`; `show picture` is defined as a supported action but not wired to any resource yet.

**Important deviation found during planning, flagged here rather than re-asking (per this skill's autonomous-planning step):** the issue's discussion assumed documents could get `navigate` like items, since "they do have their own show pages." That's only true for **items** — `itemShowType` is genuinely shared by `game-item`/`pc-item`/`npc-item` and `HashRouteResolver.js` registers `pcCharacterItem`/`npcCharacterItem` (`/games/:game_slug/pcs|npcs/:character_id/items/:id`). **Character documents have no such route, and no backend detail endpoint at all** — `documentConfig.js`'s own doc comment states "no detail endpoint exists for `CharacterDocument`"; the only document show page (`documentShowType.js`, routes `gameDocument`/`gameDocumentEdit`) is for a different resource, the game-level `GameDocument`, not the `CharacterDocument`s shown in this shortlist. Adding a character-document detail page/endpoint is a real feature, well beyond this refactor's scope. This plan therefore keeps `document` at action `none` (matching `DocumentPreviewCardHelper`'s existing, still-accurate comment) and calls this out explicitly for the user to see once the plan is posted — `pc`/`npc`/`treasure`/`item` all get `navigate` as agreed.

## Implementation Steps

### Step 1 — Add the per-resource-type shortlist behavior registry

Create `frontend/assets/js/components/common/cards/shortListResourceConfig.js`, keyed by
`'pc'`, `'npc'`, `'treasure'`, `'item'`, `'document'`. Each entry provides everything `ShortList`
needs to fetch and render one resource type generically, lifted from the current per-section JSX
in `GamePreviewSections.jsx`/`CharacterPreviewSectionsSlot.jsx`:

- `titleKey`, `icon`, `emptyTextKey` — reuse `PREVIEW_LIST_TYPES` (`characterPreviewConstants.js`) for `titleKey`/`icon`; keep the existing `character_treasures_preview.empty`/`character_items_preview.empty`/`character_documents_preview.empty` i18n keys for `emptyTextKey` (pc/npc have no empty-state text today — keep that as-is, `emptyTextKey: undefined`).
- `buildParams(context)` — the `RequestStore.ensure` `params` object for this resource: `pc`/`npc` → `{ gameSlug: context.game_slug }`; `treasure`/`item`/`document` → `{ gameSlug: context.game_slug, kind: context.is_pc ? 'pcs' : 'npcs', id: context.id }`.
- `buildSeeAllHref(context)` — `pc`/`npc` → `#/games/${game_slug}/${resource}s`; `treasure`/`item`/`document` → `#/games/${game_slug}/${segment}/${id}/${resource}s` (`segment` = `pcs`/`npcs` from `is_pc`).
- `action` — `'navigate'` for `pc`, `npc`, `treasure`, `item`; `'none'` for `document`.
- `buildHref(context, item)` — only for `navigate` resources: `pc`/`npc` → `#/games/${game_slug}/${resource}s/${item.id}`; `treasure` → `#/treasures/${item.treasure_id}` (unchanged from today); `item` → `#/games/${game_slug}/${segment}/${id}/items/${item.id}` (new — the route already exists, see Context).
- `renderItem(item, context, href)` — returns the existing per-resource card element (`CharacterPreviewCard`, `TreasurePreviewCard`, `ItemPreviewCard`, `DocumentPreviewCard`), passing `href` through where the card now accepts it (Step 2).

### Step 2 — Add `href` support to `ItemPreviewCard`

`ItemPreviewCard`/`ItemPreviewCardHelper` (`common/cards/ItemPreviewCard.jsx`,
`common/cards/helpers/ItemPreviewCardHelper.jsx`) currently render a plain, non-clickable card.
Add an optional `href` prop; when present, wrap the card in `<a href={href} className="text-decoration-none text-dark">` exactly like `TreasurePreviewCardHelper` does. Update the class/method
JSDoc that currently says "items have no standalone detail page in scope" — that's no longer
true (`pc`/`npc` character-item detail routes already exist). `DocumentPreviewCard`/
`DocumentPreviewCardHelper` are **not** changed — no route exists to link to (see Context).

### Step 3 — Build the generic `ShortList` element

Add, under `common/cards/` (same folder as `PreviewSection`, following `OpenPollsWidget`'s
self-fetching-element pattern — `resources/game/pages/elements/OpenPollsWidget.jsx` +
`elements/controllers/OpenPollsWidgetController.js`):

- `common/cards/controllers/ShortListController.js` — plain class, constructor takes
  `(resource, setItems, setLoading)`. `buildEffect(context)` fetches via
  `RequestStore.ensure({ componentName: 'ShortListController', resource, quantityType: 'collection', params: shortListResourceConfig[resource].buildParams(context), query: { per_page: maxItems } })`, degrading to `[]` on failure (mirroring `GameController#fetchPcsPreview`'s degrade-on-failure behavior) and guarding against post-unmount `setState` the same way `OpenPollsWidgetController` does.
- `common/cards/ShortList.jsx` — component: `useState` for `items`/`loading`, `useMemo` for the
  controller, `useEffect` wiring `controller.buildEffect(context)()` (dependency: `resource` +
  whatever `buildParams` needs, e.g. `game_slug`/`id`/`is_pc`), renders `null` while loading (or
  once resolved with an empty list and an `emptyTextKey`, defers to `PreviewSection`'s own
  empty-state handling), otherwise renders `<PreviewSection items=... title=... seeAllHref=...
  icon=... maxItems=... renderItem={(item) => config.renderItem(item, context, config.action ===
  'navigate' ? config.buildHref(context, item) : undefined)} emptyText=... />`. Props: `resource`
  (required), `maxItems` (optional, defaults to `MAX_PREVIEW_ITEMS`), plus the full spread
  context (`game_slug`, `id`, `is_pc`, `game_type`, ...).

### Step 4 — Add the `buildShortListSlot` factory

Add `common/cards/buildShortListSlot.js` (or a named export alongside `ShortList.jsx`):
`buildShortListSlot(resource, { maxItems } = {})` returns a small functional component that
receives the page's merged context (spread by `ShowPageLayout#renderSlot`) and renders
`<ShortList resource={resource} maxItems={maxItems} {...context} />` — the same closure pattern
`pcShowType.js`/`npcShowType.js` already use for `buildCharacterNameField(...)` etc. This is what
makes the show-type config itself the source of truth for which shortlists appear, in what order,
and with what per-list count — exactly what the issue asks for.

### Step 5 — Wire the new slots into the show type configs

- `gameShowType.js`: replace `{ Show: GamePreviewSections }` with
  `{ Show: buildShortListSlot('pc') }, { Show: buildShortListSlot('npc') }`. Drop the
  `GamePreviewSections` import.
- `pcShowType.js`/`npcShowType.js`: replace `{ Show: CharacterPreviewSectionsSlot }` with
  `{ Show: buildShortListSlot('treasure') }, { Show: buildShortListSlot('item') }, { Show: buildShortListSlot('document') }`. Drop the `CharacterPreviewSectionsSlot` import from both.

### Step 6 — Remove the now-redundant page-level fetching

- `GameController.js`: delete `#fetchPcsPreview`/`#fetchNpcsPreview` and their calls in
  `buildEffect()`; drop the `setPcs`/`setNpcs` constructor params (and the `MAX_PREVIEW_ITEMS`
  import if no longer used).
- `Game.jsx`: drop the `pcs`/`npcs` `useState` pair and stop passing `setPcs`/`setNpcs` into
  `new GameController(...)`.
- `GameHelper.jsx`: drop the `pcs`/`npcs` params from `render(...)` and from the `context={{ ...game, pcs, npcs, handlers }}` spread (becomes `context={{ ...game, handlers }}`) and its JSDoc.
- `CharacterListsController.js`: delete `fetchAndMergeTreasures`/`fetchAndMergeItems`/
  `fetchAndMergeDocuments` (keep `fetchCharacterPhotos`/`fetchAndMergePhotos` — out of scope, bottom slot). Drop the now-unused `MAX_PREVIEW_ITEMS` import if nothing else in the file needs it.
- `CharacterController.js`: in `loadCharacter(...)`, drop the `.then((character) => this.fetchAndMergeTreasures(...))` / `#fetchAndMergeItems` / `#fetchAndMergeDocuments` links from the promise chain (keep the photos/game_type/access links).

### Step 7 — Delete the obsolete per-resource slot components

Delete `GamePreviewSections.jsx` and `CharacterPreviewSectionsSlot.jsx` and their specs
(`GamePreviewSectionsSpec.js`, `CharacterPreviewSectionsSlotSpec.js`) — fully superseded by
`ShortList` + `buildShortListSlot`.

### Step 8 — Tests

- New specs: `ShortListSpec.js`, `ShortListControllerSpec.js` (mirror
  `OpenPollsWidgetControllerSpec.js`'s fetch/degrade/unmount-guard style),
  `shortListResourceConfigSpec.js`, `buildShortListSlotSpec.js`.
- Update `ItemPreviewCardSpec.js`/`ItemPreviewCardHelperSpec.js` for the new `href` prop/link
  behavior (mirror `TreasurePreviewCardHelperSpec.js`'s link assertions).
- Update `gameShowTypeSpec.js`/`pcShowTypeSpec.js`/`npcShowTypeSpec.js` (if present) for the new
  slot entries.
- Update `GameControllerSpec.js`, `GameSpec.js` (or equivalent), `GameHelperSpec.js` for the
  dropped `pcs`/`npcs` wiring.
- Update `CharacterListsControllerSpec.js`, `CharacterControllerSpec.js` for the dropped
  treasures/items/documents fetch/merge steps.
- Run the full frontend suite (`npm run coverage`) and confirm no stale references to the
  deleted files remain (`grep -rn "GamePreviewSections\|CharacterPreviewSectionsSlot" frontend/`).

## Files to Change

- `frontend/assets/js/components/common/cards/shortListResourceConfig.js` — new: per-resource-type fetch params/href/render behavior registry.
- `frontend/assets/js/components/common/cards/ShortList.jsx` — new: generic self-fetching shortlist element.
- `frontend/assets/js/components/common/cards/controllers/ShortListController.js` — new: `RequestStore`-backed fetch for `ShortList`.
- `frontend/assets/js/components/common/cards/buildShortListSlot.js` — new: factory binding a `ShowPageLayout` slot entry to a resource type.
- `frontend/assets/js/components/common/cards/ItemPreviewCard.jsx`, `common/cards/helpers/ItemPreviewCardHelper.jsx` — add optional `href`/link wrapping, update stale JSDoc.
- `frontend/assets/js/components/common/show_page/show_types/configs/gameShowType.js` — swap `GamePreviewSections` for `buildShortListSlot('pc')`/`('npc')`.
- `frontend/assets/js/components/common/show_page/show_types/configs/pcShowType.js`, `npcShowType.js` — swap `CharacterPreviewSectionsSlot` for `buildShortListSlot('treasure'|'item'|'document')`.
- `frontend/assets/js/components/resources/game/pages/controllers/GameController.js` — drop pcs/npcs preview fetch.
- `frontend/assets/js/components/resources/game/pages/Game.jsx`, `pages/helpers/GameHelper.jsx` — drop pcs/npcs state/props threading.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterListsController.js`, `CharacterController.js` — drop treasures/items/documents fetch+merge.
- `frontend/assets/js/components/resources/game/pages/elements/show/GamePreviewSections.jsx`, `frontend/assets/js/components/resources/character/pages/elements/show/CharacterPreviewSectionsSlot.jsx` — deleted.
- Corresponding spec files under `frontend/specs/...` for every file above (new specs for new files, updated specs for changed files, deleted specs for deleted files).

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- **Documents keep `none`, not `navigate`.** During planning, `documentConfig.js` and
  `HashRouteResolver.js` confirmed no detail endpoint or route exists for a character's own
  `CharacterDocument`s (only game-level `GameDocument`s have a show page). Wiring `navigate` for
  documents would require a new backend endpoint and frontend route/page — out of scope for this
  refactor. `item` does get `navigate`, since its detail routes/pages already exist.
- `show picture` is added as a valid `action` value in `shortListResourceConfig`'s shape but is
  not assigned to any resource in this plan, per the confirmed issue scope.
- `PreviewSection`/`PreviewSectionHelper` are reused as-is; no changes needed there.
- `CharacterPhotosPreviewSlot`/`CharacterPhotosPreview` (bottom slot) are untouched — explicitly
  out of scope per the issue.
