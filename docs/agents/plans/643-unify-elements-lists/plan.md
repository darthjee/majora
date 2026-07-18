# Plan: Unify elements lists

Issue: [643-unify-elements-lists.md](../../issues/643-unify-elements-lists.md)

## Overview

Unify the two duplicated "preview list" shells — the PC/NPC preview on the Game show page
(`CharacterPreviewSection`) and the Treasures preview on the PC/NPC show pages
(`CharacterTreasuresPreview`) — into a single generic `PreviewSection` component, backed by a
shared type→{title, icon, endpoint} constants map. Standardize the item cap at 5 for all three
list types (Treasures currently caps at 6), keep reusing the existing `SeeAllCard` "see more"
pattern, and replace each card's always-visible name/value text with a mouse-over tooltip using
the same `react-bootstrap` `OverlayTrigger`/`Tooltip` primitives already used by `TooltipBadge`.

## Context

Both preview families are already partially unified (PCs/NPCs share one component via a
`characterType` prop; Treasures share one component across PC and NPC), but the two families
duplicate the same shell markup (heading, slice-to-N, row of cards, `SeeAllCard`) and disagree on
item cap (5 vs 6). Icon/title per list type are hardcoded ad hoc at each JSX call site
(`GameHelper.jsx`, `CharacterHelper.jsx`) instead of centralized. `CharacterPreviewCard` (PC/NPC)
currently shows no text at all beneath the photo; `TreasureCard` (reused for the Treasures
preview today) shows a visible name + money value, because `TreasureCard` is also the card used
by the full treasures list pages (`TreasuresHelper`, `GameTreasuresHelper`,
`CharacterTreasuresHelper`), which must keep that text always visible — so the preview cannot
keep reusing `TreasureCard` as-is once its text moves to a tooltip.

Per discussion:
- PC/NPC preview cards get a name tooltip added net-new (there's nothing to remove today).
- Treasures preview cards' tooltip shows both name and money value.
- All three preview types standardize on a page size of 5 (Treasures preview shrinks from 6 to 5).
- The NPCs preview's existing behavior — prefer the authenticated `npcs/all.json` endpoint when a
  token is present, falling back to public `npcs.json` — must be preserved by the new per-type
  endpoint config.
- The Photos preview (`CharacterPhotosPreview`, `MAX_PREVIEW_PHOTOS`) is **out of scope** — it is
  not one of the pages listed in the issue and is left untouched.

## Implementation Steps

### Step 1 — Centralize per-type title/icon/endpoint in `characterPreviewConstants.js`

Extend `frontend/assets/js/components/common/characterPreviewConstants.js`:

- Replace `MAX_PREVIEW_CHARACTERS` and `MAX_PREVIEW_TREASURES` (both would now be the same value)
  with a single `MAX_PREVIEW_ITEMS = 5`. Leave `MAX_PREVIEW_PHOTOS` untouched.
- Add a `PREVIEW_LIST_TYPES` map keyed by `pc`, `npc`, `treasure`, each entry providing
  `titleKey` (i18n key) and `icon` (from `Icons.js`). For `pc` and `npc` — the two cases whose
  endpoint is a simple, self-contained template string not shared with any other client method —
  also provide `buildEndpoint({ gameSlug })`, and for `npc` an additional
  `buildAuthEndpoint({ gameSlug })` for the token-present case.
- Deliberately do **not** route the `treasure` type's endpoint through this map: it's already
  built by `CharacterClient#fetchCharacterTreasures` / `CharacterController#fetchCharacterTreasures`,
  a generic per-character-suffix client shared with unrelated endpoints (`full`, `access`,
  `permissions`, `money`, `photos`). Forcing it through a type-keyed endpoint builder would
  entangle two unrelated abstractions for no benefit; `treasure`'s entry in `PREVIEW_LIST_TYPES`
  only carries `titleKey`/`icon`.

### Step 2 — Build the generic `PreviewSection` shell

Create `frontend/assets/js/components/common/PreviewSection.jsx` +
`helpers/PreviewSectionHelper.jsx`, replacing both `CharacterPreviewSection` and
`CharacterTreasuresPreview`. Props: `items`, `title`, `seeAllHref`, `icon`,
`maxItems = MAX_PREVIEW_ITEMS`, `renderItem` (function, `(item) => ReactElement`, called for each
sliced item so the shell stays agnostic of what a "card" looks like per type), and an optional
`emptyText` (shown as a muted paragraph above the row when `items.length === 0` — preserves
`CharacterTreasuresPreviewHelper`'s current empty-state message; omitted for PC/NPC, matching
today's behavior where there's no such message).

Delete `CharacterPreviewSection.jsx`, `helpers/CharacterPreviewSectionHelper.jsx`,
`CharacterTreasuresPreview.jsx`, and
`resources/character/pages/elements/helpers/CharacterTreasuresPreviewHelper.jsx` once callers are
migrated (Step 5).

### Step 3 — Add the shared hover-tooltip wrapper

Create `frontend/assets/js/components/common/CardHoverTooltip.jsx`: a small component wrapping
`children` in `react-bootstrap`'s `OverlayTrigger`/`Tooltip` (same libraries/pattern as
`TooltipBadge.jsx`, but wrapping arbitrary content instead of a badge icon), given a `content`
prop (`ReactNode`, so it can hold either plain text or richer markup like name + money).

### Step 4 — Update the PC/NPC preview card

Edit `CharacterPreviewCardHelper.jsx`: wrap the existing card markup in
`<CardHoverTooltip content={character.name}>`. No visible markup changes otherwise — this is a
net-new tooltip, since these cards show no text today.

### Step 5 — Add a dedicated Treasures preview card

Create `frontend/assets/js/components/common/TreasurePreviewCard.jsx` +
`helpers/TreasurePreviewCardHelper.jsx` — a preview-only card, distinct from the shared
`TreasureCard.jsx` (which keeps its always-visible `card-title`/`card-text` unchanged, since it's
reused by the full treasures list pages). Mirrors `CharacterPreviewCard`'s minimal photo-only
layout (same grid/card classes as `SeeAllCard`), no `card-body` text, wrapped in
`<CardHoverTooltip content={...}>` showing the treasure name plus its money value (reuse the
existing `TreasureMoney` component for the value, same as `TreasureCard` does today).

### Step 6 — Migrate call sites

- `GameHelper.jsx`: replace the two `<CharacterPreviewSection>` calls with `<PreviewSection>`,
  reading `title`/`icon` from `PREVIEW_LIST_TYPES.pc`/`.npc` instead of the current inline
  `Translator.t(...)`/`Icons.filePerson`/`Icons.filePersonFill`, with `renderItem` producing a
  `<CharacterPreviewCard>` per item.
- `GameController.js`: `#fetchPcsPreview`/`#fetchNpcsPreview` build their request URLs via
  `PREVIEW_LIST_TYPES.pc.buildEndpoint`/`.npc.buildEndpoint`/`.buildAuthEndpoint` instead of
  inline template strings, and use `MAX_PREVIEW_ITEMS` for the `per_page` query param (replacing
  `MAX_PREVIEW_CHARACTERS`). The existing `Promise.allSettled` public/authenticated fallback logic
  in `#fetchNpcsPreview`/`#applyNpcsPreviewResult` is unchanged, just pointed at the new endpoint
  builders.
- `CharacterHelper.jsx`: replace `<CharacterTreasuresPreview>` with `<PreviewSection>`, reading
  `title`/`icon` from `PREVIEW_LIST_TYPES.treasure`, `emptyText` from the existing
  `character_treasures_preview.empty` key, and `renderItem` producing a `<TreasurePreviewCard>`
  per item (passing `quantity` through, same mapping `CharacterTreasuresPreviewHelper` does today
  from `treasure_id`/`name`/`value`/`photo_path`/`gameType`).
- No changes needed to `CharacterController`/`CharacterClient`/`fetchAndMergeTreasures` — the
  treasures fetch already returns the full list and the existing helper already sliced it
  client-side; only the slice cap (`MAX_PREVIEW_ITEMS` replacing `MAX_PREVIEW_TREASURES`) changes.

### Step 7 — Tests

- Delete specs for removed components: `CharacterPreviewSectionSpec.js`,
  `helpers/CharacterPreviewSectionHelperSpec.js`,
  `resources/character/pages/elements/CharacterTreasuresPreviewSpec.js`,
  `resources/character/pages/elements/helpers/CharacterTreasuresPreviewHelperSpec.js`.
- Add specs for `PreviewSection`/`PreviewSectionHelper` covering: slicing to `maxItems`, the
  `SeeAllCard` always rendered, and the `emptyText` branch.
- Add specs for `CardHoverTooltip`, `TreasurePreviewCard`/`TreasurePreviewCardHelper`.
- Update `CharacterPreviewCardHelperSpec.js`/`CharacterPreviewCardSpec.js` to assert the new
  tooltip content.
- Update `GameHelper/characterPreviewsSpec.js` and any `GameController`/`CharacterHelper` specs
  touching the migrated call sites and endpoint-building.

## Files to Change

- `frontend/assets/js/components/common/characterPreviewConstants.js` — collapse
  `MAX_PREVIEW_CHARACTERS`/`MAX_PREVIEW_TREASURES` into `MAX_PREVIEW_ITEMS = 5`; add
  `PREVIEW_LIST_TYPES`.
- `frontend/assets/js/components/common/PreviewSection.jsx` (new) +
  `helpers/PreviewSectionHelper.jsx` (new) — generic shell, replaces
  `CharacterPreviewSection`/`CharacterTreasuresPreview`.
- `frontend/assets/js/components/common/CardHoverTooltip.jsx` (new) — shared hover-tooltip
  wrapper.
- `frontend/assets/js/components/common/CharacterPreviewCard.jsx` /
  `helpers/CharacterPreviewCardHelper.jsx` — wrap in `CardHoverTooltip` showing `character.name`.
- `frontend/assets/js/components/common/TreasurePreviewCard.jsx` (new) +
  `helpers/TreasurePreviewCardHelper.jsx` (new) — preview-only treasure card with tooltip.
- `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx` — migrate to
  `PreviewSection` + `PREVIEW_LIST_TYPES`.
- `frontend/assets/js/components/resources/game/pages/controllers/GameController.js` — migrate
  `#fetchPcsPreview`/`#fetchNpcsPreview` to `PREVIEW_LIST_TYPES` endpoint builders and
  `MAX_PREVIEW_ITEMS`.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` — migrate
  to `PreviewSection` + `PREVIEW_LIST_TYPES.treasure`.
- Delete: `CharacterPreviewSection.jsx`, `helpers/CharacterPreviewSectionHelper.jsx`,
  `resources/character/pages/elements/CharacterTreasuresPreview.jsx`,
  `resources/character/pages/elements/helpers/CharacterTreasuresPreviewHelper.jsx`, and their
  specs (listed in Step 7).
- Spec files listed in Step 7 (new and updated).

## CI Checks

- `frontend`: `npm run coverage` (CI job: `frontend_test`)
- `frontend`: `npm run lint` (CI job: `frontend_lint`)
- `frontend`: `npm run check_i18n` (CI job: `frontend_lint`) — no new translation keys are
  introduced (all reused: `character_preview_section.see_all`, `game_page.player_characters`,
  `game_page.non_player_characters`, `character_page.treasures_title`,
  `character_treasures_preview.empty`), so this should pass without any `en.yaml`/other-locale
  changes.

## Notes

- `CharacterPreviewCard` and `TreasureCard` (the full-detail card, not the new
  `TreasurePreviewCard`) are unaffected in every other place they're used — only the preview
  call sites change.
- Photos preview (`CharacterPhotosPreview`, `MAX_PREVIEW_PHOTOS`) is intentionally left alone;
  not listed in the issue's Pages section.
- `PREVIEW_LIST_TYPES.treasure` intentionally has no `buildEndpoint` — see Step 1's rationale.
  If a future issue wants full endpoint centralization too, that's a separate, larger change to
  `CharacterClient`'s suffix-based fetch helper, not part of this one.
