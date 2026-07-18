# Plan: Unify list page patterns (PCs, NPCs, Treasures)

Issue: [443-organize-icons-in-characters-and-treasures.md](../../issues/443-organize-icons-in-characters-and-treasures.md)

## Overview

This is entirely frontend work. It has two independent parts that can be implemented and
reviewed separately:

1. A small, low-risk UI fix: the admin treasures page's "hidden" badge currently shows an
   icon **and** visible text; switch it to icon + hover tooltip, matching the pattern NPCs
   already use.
2. Groundwork for future list-page unification: a shared index-list component, a per-type
   config object, and a per-entity wrapper class hierarchy — introduced without migrating any
   existing page onto them yet, since actually migrating the 7 affected pages is out of scope
   for this issue (see "Limited scope" in the issue file).

Since part 2 introduces new shared abstractions that nothing consumes yet, and this repo
avoids unused/speculative code, this plan has the new abstractions land already wired to
**one** representative page (`GameTreasures.jsx`, the simplest of the three list "families")
as proof that the pattern works end-to-end, while leaving PCs/NPCs/treasures-of-character/
photos pages on their current implementation for a future issue to migrate.

## Context

Investigation of the current code (see issue Problem section) found:

- Infobar/Actionbar (`common/InfoBar.jsx`, `common/ActionBar.jsx`, composed by
  `common/ActionsOverlay.jsx`) are **already** shared, generic components — nothing to build
  there.
- Sharing already exists per resource type: `GameCharactersHelper` (PCs/NPCs render helper),
  `BaseCharacterTreasuresController`/`BaseCharacterPhotosController` (extended by Pc/Npc
  variants). There is no cross-resource (character vs. treasure) sharing yet.
- Each list type's data-fetching is **not** a static endpoint string — it depends on a
  runtime permission check (`AccessStore.ensureGamePermissions`/`ensureGameAccess`) that
  picks between a public endpoint and an `.../all.json` admin endpoint, plus filter/pagination
  params pulled from `HashRouteResolver`. The mapping object's per-type config therefore needs
  to hold a **fetch strategy function**, not just an endpoint string.
- `TooltipBadge` (`common/TooltipBadge.jsx`) already implements the icon+hover-tooltip pattern
  used for NPC status badges (`common/helpers/CharacterStatusBadges.js#buildHidden`); the
  treasures hidden badge fix is a matter of reusing it in
  `common/helpers/TreasureCardHelper.jsx`.
- `common/Pagination.jsx` is already a single shared component reused identically by
  `GameCharactersHelper` and `GameTreasuresHelper`.

## Implementation Steps

### Step 1 — Treasures hidden badge: icon + tooltip instead of icon + text

In `frontend/assets/js/components/common/helpers/TreasureCardHelper.jsx`:

- Replace the `#buildHiddenInfoBarItems` implementation (currently returns a plain `Badge`
  with `icon` + visible `text`) with a `TooltipBadge`, mirroring
  `CharacterStatusBadges.buildHidden()`'s item shape (`{icon, text, variant}` passed as
  `items`):

  ```jsx
  static #buildHiddenInfoBarItems(treasure) {
    if (!treasure.hidden) {
      return [];
    }

    return [{
      key: 'hidden',
      label: (
        <TooltipBadge
          icon={Icons.eyeSlashFill}
          items={[{
            icon: Icons.eyeSlashFill,
            text: Translator.t('game_treasures_page.hidden_label'),
            variant: null,
          }]}
        />
      ),
    }];
  }
  ```

- Swap the `Badge` import for `TooltipBadge` (drop `Badge` entirely from this file only if
  `#buildQuantityInfoBarItems` — which still uses plain `Badge` for the `×N` quantity badge —
  is the only remaining user; keep both imports otherwise).
- No change needed to the NPC side (`CharacterStatusBadges.buildHidden`,
  `common/helpers/InfoBarRules.js`) — it already renders this way via `TooltipBadge`.
- No i18n change needed — `game_treasures_page.hidden_label` (already present in every
  `frontend/assets/i18n/*.yaml`) becomes tooltip content instead of inline text.

### Step 2 — Type-mapping config object

Add `frontend/assets/js/components/common/listTypes/listTypeConfig.js`, a plain object literal
keyed by list type (`'pcs'`, `'npcs'`, `'treasures'`, extendable later to the character
treasures/photos variants), following the existing `PHOTO_COMPONENTS` precedent in
`common/ActionsOverlay.jsx`. Each entry holds:

- `fetchList(gameSlug, hashResolver)` — returns `Promise<{data, pagination}>`; encapsulates
  the permission-check-then-pick-endpoint logic currently duplicated across
  `GameNpcsController`/`GameTreasuresController`/`BaseCharacterTreasuresController` for this
  type. For `treasures`, this wraps the existing logic in
  `GameTreasuresController#loadTreasures`/`#fetchTreasures`.
- `wrapperClass` — the `BaseListItem` subclass for this type (Step 3).
- `filtersComponent` — existing filter component to render above the grid, or `null`
  (e.g. `TreasureFilters` for `treasures`).
- `buildActionBarProps(item, context)` / `buildInfoBarItems(item, context)` — delegate to the
  existing per-card helpers (e.g. `TreasureCardHelper`) rather than re-implementing them.
- `showCaption` — boolean, whether caption text appears under the photo.
- `buildItemHref(item, context)` — click-through URL builder.

Keep this file's initial content limited to a `treasures` entry (Step 5 wires only that one);
add `pcs`/`npcs` entries in the future migration issue instead of speculatively filling them
in now with unverified shapes.

### Step 3 — Wrapper object class hierarchy

Add `frontend/assets/js/components/common/listTypes/BaseListItem.js`:

- Constructor takes the raw response entry (`this.data = data`).
- Shared getters: `photoUrl`, `displayText` (default: `this.data.name`).

Add `frontend/assets/js/components/common/listTypes/TreasureListItem.js`, extending
`BaseListItem`:

- Override `displayText`/add a `formattedValue` getter delegating to the same transformation
  `TreasureMoney`/`TreasureMoneyHelper` already perform, so the wrapper doesn't duplicate that
  logic — it should call into the existing helper, not reimplement currency formatting.
- Add whatever accessor Infobar/Actionbar need beyond the base (e.g. `hidden`).

Do not add `PcListItem`/`NpcListItem` yet — no consumer needs them until the future migration
issue; adding them now would be unused speculative code per this repo's conventions.

### Step 4 — Shared index-list component

Add `frontend/assets/js/components/common/ListPage.jsx` (component) +
`common/controllers/ListPageController.js` + `common/helpers/ListPageHelper.jsx`, following
this repo's standard three-layer split (see `docs/agents/frontend.md`'s "Component
Architecture"):

- `ListPageController` extends `BasePageController`, takes a `type` (key into
  `listTypeConfig`) plus the usual state setters, and in `buildEffect()` calls that type's
  `fetchList(gameSlug, hashResolver)` instead of hardcoding a client call.
- `ListPage.jsx` owns `useState` for items/pagination/loading/error (replacing each page's
  local state), instantiates `ListPageController`, and delegates rendering to
  `ListPageHelper`.
- `ListPageHelper` wraps each raw item with `listTypeConfig[type].wrapperClass`, renders
  `Pagination` (reusing `common/Pagination.jsx` unchanged), the type's `filtersComponent`, and
  each item via `ActionsOverlay` fed by `buildInfoBarItems`/`buildActionBarProps` from the
  config.

### Step 5 — Wire `GameTreasures.jsx` onto the new component

Update `frontend/assets/js/components/resources/treasure/pages/GameTreasures.jsx` (and retire
its bespoke `GameTreasuresController.js`/`GameTreasuresHelper.jsx` in favor of `ListPage` with
`type="treasures"`), proving the new abstractions actually work end-to-end for a real page.
Keep behavior identical to today (same endpoints, same filters, same permissions) — this step
is a refactor, not a behavior change.

Leave `GamePcs.jsx`, `GameNpcs.jsx`, the PC/NPC treasures pages, and the PC/NPC photos pages
on their current implementation. Migrating them is future work once this pattern has proven
itself on one page (per the issue's "Limited scope").

## Files to Change

- `frontend/assets/js/components/common/helpers/TreasureCardHelper.jsx` — hidden badge: `Badge` → `TooltipBadge`.
- `frontend/assets/js/components/common/listTypes/listTypeConfig.js` — new, per-type config object (starts with `treasures` only).
- `frontend/assets/js/components/common/listTypes/BaseListItem.js` — new, shared wrapper base class.
- `frontend/assets/js/components/common/listTypes/TreasureListItem.js` — new, treasure wrapper subclass.
- `frontend/assets/js/components/common/ListPage.jsx` — new, shared index-list component.
- `frontend/assets/js/components/common/controllers/ListPageController.js` — new.
- `frontend/assets/js/components/common/helpers/ListPageHelper.jsx` — new.
- `frontend/assets/js/components/resources/treasure/pages/GameTreasures.jsx` — rewired onto `ListPage`.
- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js` — removed (logic moved into `listTypeConfig.js`'s `treasures.fetchList`).
- `frontend/assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx` — removed (logic moved into `ListPageHelper.jsx` + `listTypeConfig.js`).
- Matching spec files under `frontend/specs/...` for every file above (new specs for new files, updated specs for `TreasureCardHelper`/`GameTreasures`, removed specs for the two retired files).

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: frontend lint)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: frontend tests)

## Notes

- **Scope boundary**: only `GameTreasures.jsx` is migrated onto the new shared component in
  this issue. PCs/NPCs/character-treasures/character-photos pages keep their current,
  already-shared-per-resource-type implementation. A follow-up issue should migrate them once
  this pattern is validated in production on the treasures page.
- **Risk**: `GameNpcsController`'s fetch logic is the most complex of the three (dual
  endpoint + `AccessStore.ensureGameAccess` for `is_player` + `AccessStore.ensureGamePermissions`
  for `can_edit`, vs. treasures' single `ensureGamePermissions` check) — when a future issue
  migrates NPCs onto `listTypeConfig`, `fetchList`'s signature may need an extra hook for
  `is_player`-derived UI state (e.g. `onPlayerSlainClick` gating) that treasures doesn't need.
  Not a blocker for this issue, but worth flagging so the mapping object's `fetchList` contract
  isn't assumed final after just one type.
- Per the discuss-issue dialogue: the NPC hidden-badge tooltip already exists (since #547) and
  needed no change; the issue title was updated from "Organize icons in characters and
  treasures" to reflect the actual scope.
