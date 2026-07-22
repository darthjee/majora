# Plan: Request page data through the new RequestStore

Issue: [791-request-page-data-through-the-new-requeststore.md](../../issues/791-request-page-data-through-the-new-requeststore.md)

## Overview

Wire `RequestStore` (`frontend/assets/js/utils/requests/RequestStore.js`, built structure-only in
#778/#790) into every games/home-area data fetch: single-resource show pages, list pages, edit
pages, and the handful of page-embedded components/controllers that fetch their own data
independently of their parent page. No resource is excluded — pcs/npcs are fully in scope,
including the pc/npc preview widget on the Game show page. See
[plan_pages.md](plan_pages.md) for the full per-page/per-file breakdown.

## Context

`RequestStore.ensure({resource, quantityType, params, query})` resolves (or reuses) one `Request`
per resource/quantity-type/params combination, picking the `regular` vs `private` variant from
`resourceConfig.js` based on live permissions resolved via `RequestPermissionResolvers.js`, and
returns `Promise<{data}>`. `resourceConfig.js` + `config/{game,npc,pc,item,treasure}Config.js`
already model every endpoint the issue's affected pages need for `game`, `npc`, `pc`, `item`, and
`treasure` — **except** game sessions and character documents, which have no resource config yet
(needed for the edit-pages and documents-list additions the issue asked for). Currently nothing
in the app calls `ensure()`.

Today, data fetching happens through three separate, ad hoc patterns, none of which get
`RequestStore`'s caching/dedup/permission-resync behavior:

- **Show pages**: each page's `XController.js` calls `client.fetch(...)` directly in
  `buildEffect()` (e.g. `GameController` fetching `/games/${slug}.json`).
- **List pages** (`Games`/home, `GameTreasures`, `GameItems`, `GamePcs`, `GameNpcs`, per-character
  treasure/item/document lists): go through `ListPageController` → `listTypeConfig[type].fetchList`,
  which itself calls a shared `fetchPermissionGatedIndex` helper that manually resolves
  `AccessStore.ensure*Permissions()` to pick between a restricted and a public endpoint — the same
  regular/private decision `Request.js` already encodes generically.
- **Page-embedded components/controllers** with their own independent fetch, decoupled from their
  parent page's main data: `GamePreviewSections`'s data (fetched inside `GameController`, not the
  component itself), `TreasureExchangeModalController`, `AddGameTreasureModalController`.

### Two infrastructure gaps found while planning (must be fixed first)

1. **`query` is accepted but never sent.** `RequestStore.ensure()` and `Request#ensure()` both take
   a `query` argument and fold it into their cache key, but `Request#ensure()` calls
   `this.#client.fetchResource(variant.path(params), signal)` — `query` never reaches the URL, and
   `RequestClient#fetchResource(path, signal)` has no query-string handling at all. Every list page
   needs pagination (`page`/`per_page`) and some need filters (treasure filters), and the Game
   preview widgets need `per_page`, so this silently-dropped-query bug must be fixed before any
   `collection` migration (list pages or previews) can work correctly.
2. **No resource config for game sessions or character documents.** `resourceConfig.js` only
   registers `game`/`npc`/`pc`/`item`/`treasure`. The issue's affected pages include game session
   edit and pc/npc document lists, neither of which has a matching config today.

### A real simplification, not just a swap

`pcConfig`/`npcConfig`'s `single` entry already models the exact regular-vs-`full.json`-on-
`can_edit` decision that `CharacterController#loadCharacter` currently hand-rolls via
`fetchCharacterFull`/`handleFullResponse`/`mergeFullCharacter`/`loadFullCharacter`. Migrating the
base character fetch to `RequestStore.ensure()` eliminates that whole chain, not just relocates it.

## Progress

- Step 1 (query wiring + `sessionConfig.js`/`documentConfig.js`) — done, landed in its own PR
  per the multi-PR note below. Steps 2-5 (show pages, list pages, edit pages, embedded
  components) are not started yet — each is expected to land as its own follow-up PR against
  this same issue.

## Implementation Steps

### Step 1 — Fix query wiring + add missing resource configs (prerequisite for everything else)

- `RequestClient#fetchResource(path, signal)`: accept and append a query object as a query string
  onto `path` (e.g. via `URLSearchParams`), only when non-empty.
- `Request#ensure()`: pass `query` through to `this.#client.fetchResource(...)`.
- Add `frontend/assets/js/utils/requests/config/sessionConfig.js` (`single`, mirroring
  `gameConfig.js`'s shape — check `docs/agents/access-control/` for the session endpoint's actual
  permission model, it may not be `AllowAny` like games) and register it in `resourceConfig.js`.
- Add `frontend/assets/js/utils/requests/config/documentConfig.js` (`collection`, mirroring
  `itemConfig.js`'s per-`kind` shape: `gameSlug`, `kind`, `id`) and register it in
  `resourceConfig.js`.
- Specs: extend `Request`/`RequestClient` specs for query-string building (empty query → no `?`,
  non-empty → correctly encoded); add specs for the two new config files mirroring
  `gameConfig`/`itemConfig`'s existing spec shape.

### Step 2 — Migrate show pages (`single` quantity type)

Replace each controller's direct `client.fetch(...)` (or, for characters, the
`fetchCharacter`/`fetchCharacterFull` chain) with `RequestStore.ensure({resource, quantityType:
'single', params})`:

- `game` — `GameController#fetchGame`.
- `treasure` — `TreasureController`.
- `item` (game-scoped) — `GameItemController`.
- `item` (character-scoped, single) — `CharacterItemDetailController` (currently hand-rolls the
  same `full.json`-on-`can_edit` branch `itemConfig.js` already encodes — collapse it).
- `pc`/`npc` — `CharacterController#loadCharacter`'s base `fetchCharacter` call. Collapse
  `fetchCharacterFull`/`handleFullResponse`/`mergeFullCharacter`/`loadFullCharacter` per the
  simplification noted in Context. The treasures/items/documents/photos preview-merge chain and
  `fetchAndMergeGameType`/`fetchAndMergeAccess` stay as-is in this step (see Step 5 for the
  preview-merge fetches).

See [plan_pages.md](plan_pages.md) for the exact file list and params shape per page.

### Step 3 — Migrate list pages (`collection` quantity type)

Update the `fetchList` implementations in `listTypeConfig.js` and its `configs/*.js` files for:
`games`/home, `treasures` (game-scoped), `items` (game-scoped), `pcs`, `npcs`, `pc-items`,
`npc-items`, `pc-treasures`, `npc-treasures`, and the new `pc-documents`/`npc-documents` (using
Step 1's `documentConfig.js`). Each currently resolves `AccessStore.ensure*Permissions()` by hand
to choose between a restricted/public endpoint (`fetchPermissionGatedIndex`) — `Request.js`'s
`#resolveVariant` already does the equivalent regular/private decision generically, so this
collapses per-type permission branching into a single `RequestStore.ensure()` call passing
`query: { page, per_page, ...filterParams }` (pagination + `TreasureFilters`' active filters via
`hashResolver.getFilterParams()`, unchanged).

**Pagination metadata**: `fetchPermissionGatedIndex` currently returns `{data, pagination,
canEdit}` — check exactly where `pagination` comes from (response headers vs. body) before
migrating; `RequestClient#fetchResource` only returns the parsed JSON body today, so if pagination
metadata lives in headers, `RequestClient`/`Request` need to expose it too (extend the wrapped
`{data}` result, e.g. `{data, pagination}`) as part of this step.

**Explicitly out of scope**: `players`, `my-games`, `treasures-global` list types (no resource in
`resourceConfig`, not part of the issue's games/home affected pages) and staff list types — leave
these on `fetchPermissionGatedIndex` as-is.

### Step 4 — Migrate edit pages

- **Non-character edits** (`GameEditController`, `TreasureEditController`,
  `GameTreasureEditController`, `GameItemEditController`, `GameSessionEditController`): each calls
  `BaseEditController#fetchWithAccess`/`#fetchSingle`, which expect a raw `Promise<Response>` and
  call `parseJsonOrReject` on it — but `RequestStore.ensure()` already returns parsed
  `Promise<{data}>`. Either add a `BaseEditController` variant that accepts an already-parsed data
  promise (skip `parseJsonOrReject`), or adapt at the call site. Resolve this mismatch before
  touching any edit controller, since every one of them hits it.
- **Character edits** (`PcCharacterEditController`/`NpcCharacterEditController` via
  `BaseCharacterEditController`) delegate loading entirely to the show-page load controller — they
  should already benefit from Step 2's migration with no code change. Verify with existing/updated
  specs rather than assuming.
- **Character item edits** (`PcCharacterItemEditController`/`NpcCharacterItemEditController` via
  `BaseCharacterItemEditController`): check whether these delegate to `CharacterItemDetailController`
  the same way character edits delegate to the character show controller; if so, same free-ride
  logic as above, otherwise migrate directly using `item`'s config like Step 2 did.

### Step 5 — Migrate self-fetching embedded/preview components

- `GameController#fetchPcsPreview`/`#fetchNpcsPreview` (data source behind `GamePreviewSections`):
  replace with `RequestStore.ensure({resource: 'pc'|'npc', quantityType: 'collection', params:
  {gameSlug}, query: {per_page: MAX_PREVIEW_ITEMS}})`. For npcs, `npcConfig`'s existing
  private/`can_edit`-gated `all.json` variant replaces the current ad hoc
  token-presence-then-fallback-on-failure logic in `#fetchNpcsPreview`/`#applyNpcsPreviewResult`.
- `CharacterController`'s own preview-merge fetches (`fetchAndMergeTreasures`/`fetchAndMergeItems`)
  — optional in this step, using `treasureConfig`/`itemConfig`'s `collection` entries.
  `fetchAndMergeDocuments` can use Step 1's new `documentConfig.js`. `fetchAndMergePhotos` has no
  resource config and photos are out of scope for this issue — leave it on
  `characterClient.fetchCharacterPhotos`.
- `TreasureExchangeModalController` (treasure browse/sell lists on PC/NPC show pages) and
  `AddGameTreasureModalController` (on the `GameTreasures` list page): evaluate each against
  `treasureConfig`'s existing shape first. If either has a fetch shape that doesn't fit
  `resourceConfig`'s single/collection model (e.g. a "sell" vs "browse" distinction, or an
  endpoint not covered by `treasureConfig.js` today), document the mismatch in this plan's Notes
  rather than forcing an ill-fitting migration — do not invent new `resourceConfig` shapes without
  confirming against the actual endpoint contracts in `docs/agents/access-control/`.

## Files to Change

Representative files — see [plan_pages.md](plan_pages.md) for the full per-page list:

- `frontend/assets/js/utils/requests/Request.js`, `RequestClient.js` — query wiring (Step 1)
- `frontend/assets/js/utils/requests/config/sessionConfig.js`, `documentConfig.js` — new (Step 1)
- `frontend/assets/js/utils/requests/resourceConfig.js` — register the two new configs
- `frontend/assets/js/components/resources/game/pages/controllers/GameController.js`,
  `GameEditController.js`
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureController.js`,
  `TreasureEditController.js`, `GameTreasureEditController.js`
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js`,
  `GameItemEditController.js`
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js`,
  `CharacterItemDetailController.js`, `PcCharacterEditController.js`, `NpcCharacterEditController.js`,
  `PcCharacterItemEditController.js`, `NpcCharacterItemEditController.js`
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionEditController.js`
- `frontend/assets/js/components/common/base/controllers/BaseEditController.js` — parsed-data
  variant (Step 4)
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` and
  `common/list_types/configs/*.js` — `fetchList` implementations (Step 3)
- `frontend/assets/js/components/resources/treasure/pages/elements/controllers/AddGameTreasureModalController.js`,
  `character/pages/elements/controllers/TreasureExchangeModalController.js` (Step 5, pending evaluation)
- `frontend/specs/**` — new/updated specs mirroring every changed file above

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`) — every migrated controller's existing spec
  must be updated (mocked `RequestStore.ensure()` instead of the client); this is a data-fetching
  refactor, not a behavior change, so rendered output must stay identical
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — no new translation keys expected

## Notes

- Given the size (5 phases spanning every games/home page plus several embedded components), land
  this as multiple PRs against this same issue, one per phase above — same precedent as the #738
  ShowPageLayout migration (`docs/agents/plans/738-extract-common-page-layout-component/plan.md`
  in git history, PRs #783 and #785–#788).
- Step 1 is a hard prerequisite for Steps 3 and 5 (both need working `query` support) — do not
  attempt list-page or preview-widget migration before it lands.
- `TreasureExchangeModalController`/`AddGameTreasureModalController` (Step 5) may not cleanly fit
  `resourceConfig`'s existing shape — confirm against the real endpoints before forcing it, and
  flag any mismatch found rather than papering over it with a new ad hoc config shape.
- `players`/`my-games`/`treasures-global`/staff list types are intentionally left out — no resource
  config exists for them and they're outside the issue's games/home affected-pages scope.
- `BaseEditController#fetchWithAccess`/`#fetchSingle` assume a raw `Response`; resolving that
  mismatch (Step 4) affects every non-character edit controller, so do it once, centrally, rather
  than per-controller.
