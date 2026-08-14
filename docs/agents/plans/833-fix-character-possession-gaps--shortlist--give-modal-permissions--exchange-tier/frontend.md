# Frontend Plan: Fix character possession gaps: shortlist, give-modal permissions, exchange tier

Main plan: [plan.md](plan.md)

## Shared contracts

None from other agents to consume. Translator (see [translator.md](translator.md)) adds the two translation keys this work references (`character_page.possessions_title`, `character_possessions_preview.empty`) — either agent's work can land first; reference the keys by name below, they don't need to exist yet to write the code that reads them.

## Implementation Steps

### Step 1 — Add `possession` to `shortListResourceConfig.js`

In `frontend/assets/js/components/common/cards/shortListResourceConfig.js`, add a `possession` entry mirroring the existing `document` entry exactly (same `characterResourceParams`/`characterResourceSeeAllHref` helpers, just resource name and href swapped):

```js
possession: {
  titleKey: PREVIEW_LIST_TYPES.possession.titleKey,
  icon: PREVIEW_LIST_TYPES.possession.icon,
  emptyTextKey: 'character_possessions_preview.empty',
  action: 'navigate',
  buildParams: characterResourceParams,
  buildSeeAllHref: (context) => characterResourceSeeAllHref('possession', context),
  buildHref: (context, item) => (
    `#/games/${context.game_slug}/${characterSegment(context)}/${context.id}/possessions/${item.id}`
  ),
  renderItem: (item, context, href) => React.createElement(
    PossessionPreviewCard, { key: item.id, possession: item, href },
  ),
},
```

Import `PossessionPreviewCard` from `./PossessionPreviewCard.jsx` (new component, Step 2) at the top of the file, alongside the existing `DocumentPreviewCard`/`ItemPreviewCard` imports.

### Step 2 — Add `PossessionPreviewCard` (+ helper)

Add `frontend/assets/js/components/common/cards/PossessionPreviewCard.jsx` and `frontend/assets/js/components/common/cards/helpers/PossessionPreviewCardHelper.jsx`, copied verbatim from `DocumentPreviewCard.jsx`/`DocumentPreviewCardHelper.jsx` with `document`→`possession` renamed throughout — including swapping `CardDocumentImage` for the already-existing `CardPossessionImage.jsx` (built in #1074, no changes needed there). `CharacterPossession`'s preview payload shape (`id`, `name`, `photo_path`) already matches `CharacterDocument`'s, since both are thin joins delegating every display attribute to their game-level counterpart — no new backend field required.

### Step 3 — Register `possession` in `PREVIEW_LIST_TYPES`

In `frontend/assets/js/components/common/cards/characterPreviewConstants.js`, add a `possession` entry alongside `treasure`/`item`/`document`:

```js
possession: {
  titleKey: 'character_page.possessions_title',
  icon: Icons.houseDoor,
},
```

`Icons.js` has no possession-appropriate icon yet — add `houseDoor: 'bi-house-door'` to `frontend/assets/js/utils/ui/Icons.js` (Bootstrap Icons; possessions are framed as "big, unique belongings" per #1076 — a house/door glyph fits and is visually distinct from `gem`/`box2HeartFill`/`folder`). Confirm the icon reads sensibly at a glance before committing to `bi-house-door` specifically — swap for another Bootstrap Icons name if a better fit turns up during implementation.

### Step 4 — Wire the shortlist slot into `pcShowType.js`/`npcShowType.js`

In both `frontend/assets/js/components/common/show_page/show_types/configs/pcShowType.js` and `.../npcShowType.js`, add `{ Show: buildShortListSlot('possession') }` to the `right` array, immediately after the existing `{ Show: buildShortListSlot('document') }` entry (matching the treasure→item→document ordering already established).

### Step 5 — Fix `canGiveHidden` derivation (Document, Item, Treasure)

All three controllers already fetch `AccessStore.ensureGameAccess(gameSlug)` for `canUploadPhoto`. Add a sibling derivation for `canGiveHidden` from the same `access` object, dropping `is_player`:

```js
static #canGiveHidden(access) {
  return Boolean(access.is_superuser || access.is_dm || access.is_staff);
}
```

- **`GameDocumentController.js`**: add a `setCanGiveHidden` constructor param + `#loadCanGiveHidden` (mirroring `#loadCanUploadPhoto`'s shape, reusing the same `AccessStore.ensureGameAccess` call — either call it twice or restructure `#loadCanUploadPhoto` to derive both flags from one fetch; the latter avoids a duplicate network/cache call and is preferred). Remove `setCanEdit`'s use as the `canGiveHidden` source entirely — `canEdit` (`ensureDocumentPermissions().can_edit`) keeps gating the Edit button and file/photo upload as today, but no longer feeds the give-modal.
- **`GameDocument.jsx`**: add `canGiveHidden` state, wire the new controller setter, and change `<GiveDocumentModal canGiveHidden={canEdit} .../>` to `canGiveHidden={canGiveHidden}`.
- **`GameItemController.js`** / **`GameItem.jsx`**: same shape — `GiveItemModal` currently receives `canEdit={canEdit}` (see `GiveItemModal.jsx`'s prop, internally forwarded as `canGiveHidden` to the controller). Rename the derivation the same way: add `canGiveHidden` alongside the existing `canEdit`, and pass `canGiveHidden={canGiveHidden}` to `GiveItemModal` instead of `canEdit={canEdit}`. Update `GiveItemModal.jsx`'s prop name from `canEdit` to `canGiveHidden` to stop the misleading name (it was never about edit permission), threading it straight to the controller call unchanged.
- **`GameTreasureController.js`** / **`GameTreasure.jsx`**: `GameTreasure.jsx` currently derives `canEdit={Boolean(treasure?.can_edit)}` inline (no controller-level `canEdit` state) and passes it as `<GiveTreasureModal canEdit={...}>`. Add `canGiveHidden` state to `GameTreasureController.js` (a new `setCanGiveHidden` param, loaded the same way as `#loadCanUploadPhoto`/`#canUploadPhoto` — treasure already has `AccessStore.ensureGameAccess` wired for that), and pass `canGiveHidden={canGiveHidden}` to `GiveTreasureModal` instead of the `treasure?.can_edit`-derived `canEdit`. Update `GiveTreasureModal.jsx`'s prop name from `canEdit` to `canGiveHidden` to match.

Rename the `canEdit` prop on `GiveDocumentModal`/`GiveItemModal`/`GiveTreasureModal` is **not** required for Document (it already receives `canGiveHidden` as its prop name, per `GameDocument.jsx:123` — only its *value* was wrong) — only Item's and Treasure's modal components currently name the prop `canEdit`, which should be renamed to `canGiveHidden` for clarity and consistency with Document, since it never meant "may edit" in the first place.

## Files to Change

- `frontend/assets/js/components/common/cards/shortListResourceConfig.js` — add `possession` entry.
- `frontend/assets/js/components/common/cards/PossessionPreviewCard.jsx` — new.
- `frontend/assets/js/components/common/cards/helpers/PossessionPreviewCardHelper.jsx` — new.
- `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — add `possession` to `PREVIEW_LIST_TYPES`.
- `frontend/assets/js/utils/ui/Icons.js` — add a possession icon (e.g. `houseDoor: 'bi-house-door'`).
- `frontend/assets/js/components/common/show_page/show_types/configs/pcShowType.js` — add possession shortlist slot.
- `frontend/assets/js/components/common/show_page/show_types/configs/npcShowType.js` — add possession shortlist slot.
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js` — add `canGiveHidden` derivation off `AccessStore.ensureGameAccess`.
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — wire `canGiveHidden` state, stop passing `canEdit` to `GiveDocumentModal`.
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js` — add `canGiveHidden` derivation.
- `frontend/assets/js/components/resources/item/pages/GameItem.jsx` — wire `canGiveHidden` state, stop passing `canEdit` to `GiveItemModal`.
- `frontend/assets/js/components/resources/item/pages/elements/GiveItemModal.jsx` — rename `canEdit` prop to `canGiveHidden`.
- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js` — add `canGiveHidden` derivation.
- `frontend/assets/js/components/resources/treasure/pages/GameTreasure.jsx` — wire `canGiveHidden` state off the controller instead of `treasure?.can_edit`, stop passing `canEdit` to `GiveTreasureModal`.
- `frontend/assets/js/components/resources/treasure/pages/elements/GiveTreasureModal.jsx` — rename `canEdit` prop to `canGiveHidden`.

Corresponding spec files under `frontend/specs/assets/js/...` mirroring every file above need matching updates/new specs (new specs for `PossessionPreviewCard`/`shortListResourceConfig`'s new entry; updated specs anywhere `canEdit`/`canGiveHidden` derivation or props are asserted, e.g. `GameDocumentControllerSpec.js`, `GameDocumentSpec.js`, `GameItemControllerSpec.js`, `GameItemSpec.js`, `GiveItemModalSpec.js`, `GameTreasureControllerSpec.js`, `GameTreasureSpec.js`, `GiveTreasureModalSpec.js`, `pcShowTypeSpec.js`/`npcShowTypeSpec.js` if they exist, `shortListResourceConfigSpec.js`).

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `frontend-checks`)

## Notes

- Confirm during implementation whether `GameDocumentController`'s `#loadCanUploadPhoto` should be restructured to derive both `canUploadPhoto` and `canGiveHidden` from a single `AccessStore.ensureGameAccess` call (one fetch, two derived booleans) rather than fetching it twice — the access-store layer may already dedupe/cache concurrent calls for the same `gameSlug`, in which case either approach is fine; prefer whichever reads more clearly in context.
- The give-modal fix (Step 5) is a frontend-only correctness fix: the backend already independently authorizes every acquire/remove request regardless of which variant the frontend picks, so this doesn't change what's ultimately allowed — it fixes the frontend's currently-wrong "which endpoint variant to call" behavior.
