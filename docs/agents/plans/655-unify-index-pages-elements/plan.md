# Plan: Unify index pages elements

Issue: [655-unify-index-pages-elements.md](../../issues/655-unify-index-pages-elements.md)

## Overview

Extends the `ListPage`/`ListPageController`/`ListPageHelper` + `listTypeConfig.js` pattern
introduced in #443 (currently covering `treasures`, `items`, `pc-items`, `npc-items`) to the
remaining bespoke list pages: the top-level games list, PCs, NPCs, character-scoped PC/NPC
treasures, and the global `/#/treasures` list. Pure refactor — same endpoints, same filters,
same permissions, same visible behavior. Frontend-only; no other agent has work on this issue.

## Context

- #443/PR #665 built the shared abstraction and proved it end-to-end on `GameTreasures` only,
  explicitly leaving PCs, NPCs, and character-scoped treasures/photos on their prior
  implementation as a deliberate follow-up (see that plan's "Details" section).
- #658 later migrated the two items list types (`pc-items`, `npc-items`) onto the same pattern,
  which is the closest precedent for the character-scoped treasures work here (`fetchList`
  resolving character-level edit permission before choosing between `treasures.json` and
  `treasures/all.json`).
- Discussion with the user settled three scope questions:
  - `/#/games` **is** in scope, even though it currently has no `ActionsOverlay`/infobar/filters
    — its `listTypeConfig` entry supplies no-op values for those, same as `items` already opts
    out of `filtersComponent`.
  - Sessions, polls, staff users, and the PC/NPC `/photos` galleries stay **out of scope**.
  - The global `/#/treasures` list **is** in scope, in addition to the 8 pages named in the
    issue body.
  - Character-scoped treasures must preserve current behavior exactly (owner/quantity display,
    permissions) — no behavior changes bundled into this refactor.

## Current-state gaps found during exploration

- `ListPageHelper.#renderItem` always wraps each item in `ActionsOverlay` and renders a fixed
  caption shape (title, `formattedValue`, `availabilityText`) inside a hardcoded
  `"card h-100 position-relative"` div. Games/PCs/NPCs don't need most of this, but nothing
  in the shape is exclusive — `buildActionBarProps` returning `{canEdit: false,
  secondaryButtons: []}` (as `items` already does) yields a plain, non-interactive photo.
- NPCs render an allegiance-colored border on the outer `.card` div today
  (`allegianceBorderClass` in `CharacterCardHelper.jsx`). `ListPageHelper` has no hook for a
  per-item extra class on that div — this is the one genuine new capability needed in the
  shared component (see Step 1).
- NPC grayscale (slain) / dimmed (hidden) photo states map directly onto `ActionsOverlay`'s
  existing `grayscale`/`dimmed` props, which already flow through `buildActionBarProps`'s
  spread — no core change needed there.
- NPCs have three different secondary-button sets depending on viewer role (DM: real + public
  slain/revive; player: single public-facing slain/revive; neither: none), built today by
  `CharacterCardHelper.#buildSecondaryButtons`/`SlainSecondaryButtons`. This logic needs to move
  into the `npcs` list-type entry's `buildActionBarProps`, which must resolve `canEdit` and
  `isPlayer` itself (mirroring what `GameNpcsController#loadNpcs` does today via
  `AccessStore.ensureGameAccess`/`ensureGamePermissions`).
- Character-scoped treasures pages also manage a `character` object (for the "Add treasure"
  page action and the treasure-exchange modal) that is unrelated to the list grid itself — this
  stays page-level chrome fetched by the owning page component, same as `GameTreasuresHelper`
  keeps its own upload-modal state alongside `ListPage` today.
- The global treasures page redirects non-staff/non-superuser viewers away before rendering
  anything; that gate is page-level and stays in the owning page component, not in `fetchList`.

## Implementation Steps

### Step 1 — Extend `ListPageHelper`/`listTypeConfig` with an optional card class-name hook

Add an optional `buildCardClassName(item)` (default: returns `''`) to the `listTypeConfig`
entry shape, and use it in `ListPageHelper.#renderItem` to append to the outer card div's
class list. This is the only shared-component change required; every existing entry
(`treasures`, `items`, `pc-items`, `npc-items`) is unaffected since the default is a no-op.

### Step 2 — `games` list type

- Add a `games` entry to `listTypeConfig.js`: `fetchList` calls `GET /games.json` (paginated,
  no permission check — same as today's `GamesController`), `wrapperClass` a new
  `GameListItem extends BaseListItem` (photo: `cover_photo_path`, display text: `name`),
  `photoType: 'photo'` (matches `GameCard`'s current plain photo, not avatar/treasure/item),
  `filtersComponent: null`, `buildActionBarProps` returning `{canEdit: false,
  secondaryButtons: []}`, `buildInfoBarItems` returning `[]`, `showCaption: true`,
  `buildItemHref(item) => `#/games/${item.data.game_slug}``.
- Migrate `Games.jsx` onto `ListPage` (`type="games"`, no `gameSlug`), retire
  `GamesController.js`, slim `GamesHelper.jsx` down to page chrome (the "New game" button,
  gated on `loggedIn` exactly as today).

### Step 3 — `pcs` list type

- Add a `pcs` entry: `fetchList` calls `GET /games/{gameSlug}/pcs.json` (same as today's
  `GamePcsController`, no permission split — PCs have no `all.json` variant today), wrapper
  class `PcListItem extends BaseListItem`, `photoType: 'avatar'`, `filtersComponent: null`,
  `buildActionBarProps` returning `{canEdit: false, secondaryButtons: []}` (PCs have no
  upload/edit affordance on this page today — matches `CharacterCardHelper`'s plain
  `CardAvatar` branch for PCs), `buildInfoBarItems` delegating to the existing `InfoBarRules`
  helper, `showCaption: true`, `buildItemHref(item, context) =>
  `#/games/${context.gameSlug}/pcs/${item.data.id}``.
- Migrate `GamePcs.jsx` onto `ListPage`, retire `GamePcsController.js`, slim
  `GameCharactersHelper.jsx`'s PC usage down to page chrome (back button, "New PC" button
  gated on the game-level `canEdit` `ListPage` reports via `onCanEditChange`).

### Step 4 — `npcs` list type

- Add an `npcs` entry: `fetchList` resolves `AccessStore.ensureGameAccess`/
  `ensureGamePermissions` first (mirroring `GameNpcsController#loadNpcs` exactly, including the
  `isPlayer` resolution), then fetches `npcs/all.json` (editor) or `npcs.json` (everyone else)
  with the current hash's filter params — same as today.
- `buildActionBarProps(item, context)` resolves `canUploadPhoto = context.canEdit ||
  context.isPlayer` (threaded through `context`, since `ListPage`'s `context` prop is
  extensible), builds the DM/player/neither secondary-button set via the existing
  `SlainSecondaryButtons` helper (moved/reused as-is, not rewritten), and returns
  `grayscale: item.data.slain`, `dimmed: item.data.hidden`, `onClick` for the upload button.
- `buildCardClassName(item)` returns `allegianceBorderClass(item.data.allegiance)` (Step 1's
  new hook), preserving the current border-color behavior.
- `buildInfoBarItems` delegates to `InfoBarRules.build(item.data)`, same as PCs/today.
- Migrate `GameNpcs.jsx` onto `ListPage`, threading `isPlayer`/`onSlainClick`/
  `onPublicSlainClick`/`onPlayerSlainClick`/filters(`NpcFilters`) through `context`/
  `filtersProps` exactly as `GameTreasures.jsx` already threads `onUploadClick` through
  `context` for the `treasures` type. Retire `GameNpcsController.js`, slim
  `GameCharactersHelper.jsx` (now NPC-only) down to page chrome.
- Once both PCs and NPCs are migrated, delete the now-dead shared parts of
  `GameCharactersHelper.jsx` / `CharacterCardHelper.jsx` that are no longer reachable from any
  list page (keep whatever `CharacterCard`/`CharacterCardHelper` pieces are still used by
  non-list pages, e.g. the character detail page, if any — verify before deleting).

### Step 5 — `pc-treasures` / `npc-treasures` list types

- Add `fetchList` functions for both, mirroring `buildFetchCharacterItems` (already in
  `listTypeConfig.js` for items) but reusing `BaseCharacterTreasuresController`'s exact
  endpoint-selection logic: PCs always fetch `treasures.json` (character-scoped, filtered);
  NPCs resolve game-level `canEdit` first, then `treasures/all.json` vs `treasures.json` —
  same asymmetry that exists today between the two.
- `wrapperClass`: a `CharacterTreasureListItem extends BaseListItem` (or extend
  `TreasureListItem` if the shape overlaps enough) modeling `quantity` in addition to the
  existing `formattedValue`/`hidden`/`availabilityText`, since `TreasureCardHelper.jsx`
  already supports an optional quantity badge — thread it through `buildInfoBarItems` or the
  caption exactly as `CharacterTreasuresHelper.jsx` renders it today (`TreasureCard` with
  `quantity` prop).
- `filtersComponent: TreasureFilters` (same filters as game-level treasures, per
  `BaseCharacterTreasuresController#buildFilterQueryHash`).
- `buildActionBarProps`: read-only (no per-card action) — the exchange/acquire/sell flow stays
  a page-level modal (`TreasureExchangeModal`), not a per-item action.
- Migrate `PcCharacterTreasures.jsx`/`NpcCharacterTreasures.jsx` (and shared
  `CharacterTreasures.jsx`) onto `ListPage`, keeping the `character` fetch (for the "Add
  treasure" button and exchange modal) as page-level state alongside it, same pattern as
  `GameTreasuresHelper` keeps its own upload-modal state today. Retire
  `PcCharacterTreasuresController.js`/`NpcCharacterTreasuresController.js`/
  `BaseCharacterTreasuresController.js`'s list-fetching responsibility (keep whatever character/
  game-type fetching still needs to live somewhere for the exchange modal — do not remove the
  character-context fetch, only the treasures-list fetch it currently also does).

### Step 6 — Global `treasures` list type

- Add a `treasures-global` entry (distinct key from the existing per-game `treasures` entry):
  `fetchList` calls `GET /treasures.json` with filter params (no game_slug, no `all.json`
  variant — every viewer of this staff-only page already sees the full list), `canEdit`
  resolved once via `AccessStore.ensureStaffOrSuperUser` (same check `TreasuresController` does
  today) rather than per-item.
- Reuse the existing `TreasureListItem`/`buildInfoBarItems`/`buildItemHref` from the `treasures`
  entry where the shape matches; only `fetchList` and the action-bar permission source differ.
- Migrate `Treasures.jsx` onto `ListPage`, keeping the staff/superuser redirect-away gate as
  page-level logic that runs before rendering `ListPage` at all (same as today). Retire
  `TreasuresController.js`, slim `TreasuresHelper.jsx` to page chrome ("New treasure" button).

### Step 7 — Cleanup pass

- Search for any remaining imports of the retired controllers/helpers (`GamesController.js`,
  `GameCharactersHelper.jsx`'s PC/NPC-specific pieces, `GamePcsController.js`,
  `GameNpcsController.js`, `TreasuresController.js`, `TreasuresHelper.jsx`) and delete dead
  code. Do not delete `CharacterCard`/`CharacterCardHelper`/`SlainSecondaryButtons`/
  `InfoBarRules` if still referenced by non-list pages (e.g. character detail pages) — verify
  each before removing.
- Update/remove specs for every retired file; add specs for every new `listTypeConfig` entry
  and wrapper class, following the existing `listTypeConfigSpec.js`/`BaseListItemSpec.js`/
  `TreasureListItemSpec.js` structure.

## Files to Change

- `frontend/assets/js/components/common/helpers/ListPageHelper.jsx` — add
  `buildCardClassName(item)` hook (Step 1).
- `frontend/assets/js/components/common/listTypes/listTypeConfig.js` — add `games`, `pcs`,
  `npcs`, `pc-treasures`, `npc-treasures`, `treasures-global` entries.
- `frontend/assets/js/components/common/listTypes/GameListItem.js` (new),
  `PcListItem.js` (new), `NpcListItem.js` (new), `CharacterTreasureListItem.js` (new).
- `frontend/assets/js/components/resources/game/pages/Games.jsx`,
  `helpers/GamesHelper.jsx` — migrate onto `ListPage`; retire `controllers/GamesController.js`.
- `frontend/assets/js/components/resources/character/pages/GamePcs.jsx`,
  `GameNpcs.jsx`, `helpers/GameCharactersHelper.jsx` — migrate onto `ListPage`; retire
  `controllers/GamePcsController.js`, `controllers/GameNpcsController.js`.
- `frontend/assets/js/components/resources/character/pages/PcCharacterTreasures.jsx`,
  `NpcCharacterTreasures.jsx`, `shared/CharacterTreasures.jsx`,
  `helpers/CharacterTreasuresHelper.jsx` — migrate onto `ListPage`; retire the list-fetching
  half of `controllers/BaseCharacterTreasuresController.js`/`PcCharacterTreasuresController.js`/
  `NpcCharacterTreasuresController.js` (keep the character/game-type fetch for the exchange
  modal).
- `frontend/assets/js/components/resources/treasure/pages/Treasures.jsx`,
  `helpers/TreasuresHelper.jsx` — migrate onto `ListPage`; retire
  `controllers/TreasuresController.js`.
- Corresponding spec files under `frontend/specs/assets/js/components/...` for every file above
  (updated or removed for retired files, added for new `listTypeConfig` entries/wrapper
  classes).

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)

## Notes

- Recommend implementing in the step order above (games → pcs → npcs → character-treasures →
  global-treasures) since each step's risk and NPC/character-permission complexity increases;
  games and pcs are the simplest and validate the class-name hook before the harder NPC step.
- The NPC step (Step 4) carries the most risk: three distinct secondary-button sets depending
  on viewer role, plus grayscale/dimmed/border-color styling all need to reach parity with
  `CharacterCardHelper.jsx`'s current rendering. Test this step thoroughly against all three
  viewer roles (DM, player, neither) before moving on.
- Verify whether `CharacterCard`/`CharacterCardHelper` are still used by any non-list-page
  (e.g. a character detail page) before deleting them in the Step 7 cleanup — if still used
  there, keep them and only remove the list-page call sites.
- This is a pure refactor: no new translation keys, no backend/API changes, no migrations.
