# Frontend Plan: Add CharacterFaction

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the API surface described in [plan.md](plan.md)'s "Shared contracts" section: `CharacterFaction`'s `{id, game_faction_id, name, photo_path[, hidden]}` shape, the character-centric `factions`/`available`/`acquire`/`remove` routes, the faction-centric `characters.json`/`characters/all.json` (`{id, name, type, photo_path}` items) and `pcs/npcs/.../summary.json` (`{'enlisted': <bool>}`) routes, and picks the `regular` vs `restricted` variant per request via a `canGiveHidden`/`canRecruitHidden`-style flag — backend enforces the tier independently regardless, so getting this wrong fails closed, not open.

## Implementation Steps

### Step 1 — `faction` resource config additions

In `frontend/assets/js/utils/requests/config/factionConfig.js` (or wherever the per-resource `resourceConfig` registrations live for `faction`), add the new `characters` (paginated, faction-scoped) request definitions, mirroring how `documentConfig.js`/`itemConfig.js` register their `available`/`acquire`/`remove`/`summary` variants. Add a parallel `characterFactionConfig.js`-style registration (or extend the existing character-resource config) for the character-centric `factions`/`factions/available`/`factions/acquire`/`factions/remove` endpoints, mirroring `characterDocumentConfig`'s shape (check the exact existing filename via a grep for `documents/acquire` in `frontend/assets/js/utils/requests/config/`).

### Step 2 — Character show page: factions shortlist

In `frontend/assets/js/components/common/cards/shortListResourceConfig.js`, add a `faction` entry mirroring the `document` entry (lines ~126-139) field-for-field:

```js
faction: {
  titleKey: PREVIEW_LIST_TYPES.faction.titleKey,
  icon: PREVIEW_LIST_TYPES.faction.icon,
  emptyTextKey: 'character_factions_preview.empty',
  action: 'navigate',
  buildParams: characterResourceParams,
  buildSeeAllHref: (context) => characterResourceSeeAllHref('faction', context),
  buildHref: (context, item) => (
    `#/games/${context.game_slug}/${characterSegment(context)}/${context.id}/factions/${item.id}`
  ),
  renderItem: (item, context, href) => React.createElement(
    FactionPreviewCard, { key: item.id, faction: item, href },
  ),
},
```

Add the matching `faction` entry to `PREVIEW_LIST_TYPES` (wherever `document`'s `titleKey`/`icon` are registered), and a new `FactionPreviewCard.jsx` + `FactionPreviewCardHelper.jsx`, mirroring `PossessionPreviewCard.jsx`/`PossessionPreviewCardHelper.jsx` (photo + name, whole card links out) rather than `DocumentPreviewCard` if that one carries document-specific fields — check both before picking the closer template. Wire the new `<ShortList resource="faction" .../>` into both PC and NPC show-page layouts (`pcShowType.js`/`npcShowType.js`, same two files #833's possession fix touched).

### Step 3 — Character-side "factions" list page + enlist/quit modal

New files mirroring `CharacterDocuments.jsx`/`CharacterDocumentsHelper.jsx`/`PcCharacterDocuments.jsx`/`NpcCharacterDocuments.jsx` exactly (`document`→`faction`):

- `frontend/assets/js/components/resources/character/pages/shared/CharacterFactions.jsx` — same shape as `CharacterDocuments.jsx`, with `buildFactionExchangeCharacter` replacing `buildDocumentExchangeCharacter` (identical `{id, game_slug, is_pc, canEdit, gameCanEdit}` context shape — `canEdit` routes the modal's Remove/"quit" tab through `factions/remove/all.json`, `gameCanEdit` routes Acquire/"enlist" through `factions/acquire/all.json`, exactly as documents already do).
- `frontend/assets/js/components/resources/character/pages/PcCharacterFactions.jsx`, `NpcCharacterFactions.jsx` — thin wrappers, mirroring the Pc/Npc document wrappers.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterFactionsHelper.jsx` — mirrors `CharacterDocumentsHelper.jsx`.
- New `frontend/assets/js/components/resources/character/pages/elements/factionExchangeTabs.js`, mirroring `documentExchangeTabs.js` exactly but with **relabeled i18n keys** (this is the actual "enlist"/"quit" wording swap the issue asks for — no component logic changes, only which translation keys the existing `ResourceExchangeModal` tab config points at):

```js
export default {
  acquire: {
    labelKey: 'faction_exchange_modal.acquire_tab', // "Enlist"
    tooltipKey: 'faction_exchange_modal.acquire_tab_tooltip',
    Component: AcquireFactionTab,
  },
  remove: {
    labelKey: 'faction_exchange_modal.remove_tab', // "Quit"
    tooltipKey: 'faction_exchange_modal.remove_tab_tooltip',
    Component: RemoveFactionTab,
  },
};
```

- New `frontend/assets/js/components/resources/character/pages/elements/tabs/AcquireFactionTab.jsx` (+ its controller/helper) and `RemoveFactionTab.jsx` (+ controller/helper), each a straight `document`→`faction` mirror of `AcquireDocumentTab.jsx`/`RemoveDocumentTab.jsx` and their controllers/helpers — same browse/select/confirm flow, same `hidden` toggle behavior on Acquire (defaulted from... note: unlike `GameDocument.hidden`, there is no faction-level `hidden` to default from, so the "hidden" toggle either seeds from `false` always or is dropped from this tab entirely — confirm which by checking whether `CharacterFaction.hidden` needs a UI control at all in this issue, or is API-only/DM-set-later; the issue doesn't specify a UI for it, so dropping the toggle from `AcquireFactionTab` and always submitting `hidden: false` is the simpler, issue-consistent default).
- Register the button opening this modal on the faction list page itself (button label "enlist," per the issue), and add the route (`/games/:game_slug/pcs/:character_id/factions`, `/games/:game_slug/npcs/:character_id/factions`) wherever `AppHelper.jsx` registers the documents-index routes, plus a `pc-factions`/`npc-factions` entry in `listTypeConfig.js`/a new `factionListTypes.js` (mirroring `documentListTypes.js`) driving the plain list-of-factions rendering above the modal trigger.

### Step 4 — Faction show page: character-list panel + recruit modal

- `GameFaction.jsx` currently renders no right column (see its own docstring). Add one: a new panel component (e.g. `FactionCharactersPanel.jsx` — exact name at implementer's discretion) rendered alongside the existing detail content, fetching via `RequestStore` against `/factions/:id/characters.json` (or `/all.json` for DM/admin, chosen the same way `canEdit`/`canUploadPhoto` are already independently derived in `GameFactionController.js`).
- Pagination: read `page`/`per_page` directly from `getCurrentHash()`'s query string (not component state), render with the existing `Pagination` component (`frontend/assets/js/components/common/pagination/Pagination.jsx`) using its default `pageParam`/`perPageParam`.
- New read-only card component (e.g. `FactionCharacterCard.jsx`), mirroring `PossessionPreviewCard.jsx`'s shape (photo + name, whole card links out), showing photo/name per item; href branches on `item.type` (`'pc'` → `#/games/:slug/pcs/:id`, `'npc'` → `#/games/:slug/npcs/:id`), same convention `shortListResourceConfig`'s `pc`/`npc` entries use.
- Empty state: a new `faction_page.characters_panel_empty`-keyed message (see [translator.md](translator.md)) when the faction has zero members.
- New `RecruitModal.jsx` + `RecruitModalController.js` + `RecruitModalHelper.jsx`, a 1:1 structural copy of `GiveDocumentModal.jsx`/`GiveDocumentModalController.js`/`GiveDocumentModalHelper.jsx` (`document`→`faction`, `documents/acquire.json`→`factions/acquire.json`): left side browses a game's PCs/NPCs (debounced server-side `name` search, tabs), picking adds to a right-side "receiving" list (repeat click no-op), submit fires one acquire request per newly-picked character. Ownership check on each browsed character uses the new `factions/<id>/pcs/<char_id>/summary.json` endpoint (`{'enlisted': <bool>}`) in place of `document.summary`'s `{'owned': <bool>}` — update the controller's field read accordingly (`data.enlisted ?? false`, not `data.owned ?? false`).
- Add a `canRecruitHidden` flag to `GameFactionController.js`, computed exactly like `GameDocumentController.js`'s `canGiveHidden` (superuser/dm/staff, dropping player) from the same `AccessStore.ensureGameAccess` call pattern fixed for documents in #833. Wire the recruit button + modal into `GameFaction.jsx`, gated by this flag for which acquire variant it submits through (mirrors `GameDocument.jsx`'s `canGiveHidden` wiring at lines ~28/43/123).
- On successful recruit, purge the `faction` (characters) cache and re-trigger the panel's fetch, mirroring `GameDocument.jsx`'s `handleUploadSuccess`-style cache-purge-then-refetch pattern.

### Step 5 — Tests

- Jasmine specs for every new component/controller/helper above, mirroring the equivalent existing document/possession spec files 1:1 in structure (e.g. `GiveDocumentModalSpec.js` → `RecruitModalSpec.js`, `AcquireDocumentTabSpec.js`/`RemoveDocumentTabSpec.js` → `AcquireFactionTabSpec.js`/`RemoveFactionTabSpec.js`, `GameDocumentControllerSpec.js`'s `canGiveHidden` tests → `GameFactionControllerSpec.js`'s `canRecruitHidden` tests).
- `pcShowTypeSpec.js`/`npcShowTypeSpec.js` updates for the new `faction` shortlist entry (mirrors #833's possession-shortlist spec additions).
- `shortListResourceConfigSpec.js` update for the new `faction` config entry.

## Files to Change

- `frontend/assets/js/utils/requests/config/factionConfig.js` (+ character-faction request config) — new endpoint registrations.
- `frontend/assets/js/components/common/cards/shortListResourceConfig.js`, `FactionPreviewCard.jsx`, `helpers/FactionPreviewCardHelper.jsx` — new.
- `frontend/assets/js/components/common/show_page/show_types/configs/pcShowType.js`, `npcShowType.js` — add faction shortlist entry.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterFactions.jsx`, `PcCharacterFactions.jsx`, `NpcCharacterFactions.jsx`, `helpers/CharacterFactionsHelper.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/elements/factionExchangeTabs.js`, `tabs/AcquireFactionTab.jsx`, `tabs/RemoveFactionTab.jsx` (+ their controllers/helpers) — new.
- `frontend/assets/js/components/common/list_types/configs/factionListTypes.js`, `listTypeConfig.js` update — new/updated.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — new character-factions routes.
- `frontend/assets/js/components/resources/faction/pages/GameFaction.jsx`, `controllers/GameFactionController.js`, `helpers/FactionDetailHelper.jsx` — right-column panel + recruit button wiring, `canRecruitHidden`.
- `frontend/assets/js/components/resources/faction/pages/elements/RecruitModal.jsx`, `controllers/RecruitModalController.js`, `helpers/RecruitModalHelper.jsx` — new.
- `frontend/assets/js/components/resources/faction/pages/elements/FactionCharactersPanel.jsx`, `FactionCharacterCard.jsx` (+ helpers/controllers) — new.
- Spec files mirroring every file above, per Step 5.

## CI Checks

- `npm run coverage` (CI job: `jasmine`).
- `npm run lint` (CI job: `frontend-checks`).
- `npm run check_i18n` (CI job: `frontend-checks`) — will fail until [translator.md](translator.md)'s keys land in both `en`/`pt`.

## Notes

- Confirm whether `CharacterFaction.hidden` gets any UI control at all in this issue (Step 3's `AcquireFactionTab` note) — the issue only specifies the field exists on the model, not a UI toggle; defaulting to always-`false` on acquire is the safer, more minimal reading.
- `GameFaction.jsx`'s own docstring currently states it "renders no give/acquisition modal" — update that comment once the recruit modal lands, it'll be stale otherwise.
