# Frontend Plan: Add acquire treasure

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section in full. In particular, rely on:

- `CharacterTreasureSerializer` items (from `.../pcs|npcs/<id>/treasures.json`, consumed
  both by the full-list pages and, via `CharacterController#fetchAndMergeTreasures`, by the
  character detail page as `character.treasures`) now having `treasure_id` and `photo_path`
  alongside the existing `id`, `name`, `quantity`, `value` — and being filtered to
  `quantity > 0` server-side.
- `GET games/<slug>/treasures.json?max_value=<n>` for the Acquire tab's affordable browsing.
- `POST games/<slug>/pcs|npcs/<character_id>/treasures/acquire.json` and `.../sell.json`,
  body `{ treasure_id, quantity }`, response `{ quantity, money }` on success, `{ errors }`
  on 400.

Note: `character.treasures` is **not** capped at 6 server-side (the list endpoint uses the
default page size) — the frontend must keep doing its own client-side cap for the preview
section (see Step 1).

## Implementation Steps

### Step 1 — Card-style character-page preview section

`frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` currently renders
`<TreasurePreviewSection treasures={character.treasures ?? []} ... />` as a plain list
(name + quantity, no image, no value). Replace this with a card-grid section reusing the
existing `TreasureCard` (`frontend/assets/js/components/elements/TreasureCard.jsx`):

- Add a new element, e.g.
  `frontend/assets/js/components/elements/CharacterTreasuresPreview.jsx` +
  `helpers/CharacterTreasuresPreviewHelper.jsx`, that renders each of the first 6 entries of
  `character.treasures` using `TreasureCard`, passing a mapped
  `{ id: treasure_id, name, value, photo_path }` object so `TreasureCard`'s existing link
  (`#/treasures/<id>`) and value line (`formatTreasureValue`) work unchanged.
- Wraps each card in a small positioned overlay showing `x<quantity>` in the top-right
  corner, only when `quantity > 1` (omit entirely when `quantity === 1`).
- Keeps a "see all" link/heading to the full list page, same href pattern as today
  (`#/games/${game_slug}/${segment}/${id}/treasures`).
- Renders nothing (or an empty-state message) when `character.treasures` is empty.

Update `characterPreviewConstants.js`: `MAX_PREVIEW_TREASURES` should read `6` per the
issue (currently `12`); confirm no other consumer depends on `12` before changing it — it
is only used by the component being replaced here.

Retire (or repurpose) `TreasurePreviewSection`/`TreasurePreviewSectionHelper` once nothing
else uses them — check for other call sites first (there are none as of this plan).

### Step 2 — Card-grid full-list pages

Redesign `PcCharacterTreasures.jsx`/`NpcCharacterTreasures.jsx` and
`helpers/CharacterTreasuresHelper.jsx` from the current `Table`-based layout to the same
card-grid + quantity-overlay style as Step 1 (reuse the same card-rendering piece, not the
preview-specific "first 6" limiting — show every returned item across the existing
pagination). Keep the existing pagination-by-URL behavior (`Pagination` + `basePath`) for
this page, since it's the opposite of the modal browser (Step 3), which must NOT change the
URL.

Add an "Add treasure" button, visible only when `character.can_edit` is true (same flag
already used for the edit button elsewhere), that opens the new acquire/sell modal (Step
3). Check whether `PcCharacterTreasuresController`/`NpcCharacterTreasuresController` already
fetch enough character context (`can_edit`, `game_slug`, `money`, `id`, `is_pc`) for the
button's visibility and the modal's affordability checks; if not, add a fetch for the
character detail endpoint (reuse `CharacterClient#fetchPc`/`fetchNpc` and the existing
access endpoint, following the same pattern already used on the character detail page).

### Step 3 — Acquire/Sell modal

Add a new modal component, following the existing `PhotoUploadModal.jsx` /
`helpers/PhotoUploadModalHelper.jsx` component + render-helper pattern (add a controller
too if the interaction warrants one, mirroring other stateful modals in
`frontend/assets/js/components/elements/`):

- `frontend/assets/js/components/elements/TreasureExchangeModal.jsx`
- `frontend/assets/js/components/elements/helpers/TreasureExchangeModalHelper.jsx`
- A controller (e.g. `TreasureExchangeModalController.js`) if state/fetch logic grows large
  enough to warrant extraction, consistent with how other pages/elements in this codebase
  split controller vs. render-helper responsibilities.

Two tabs:
- **Acquire**: paginated browser over `GET games/<slug>/treasures.json?max_value=<character.money>`
  (via `GenericClient#fetchIndex` or `#post`, whichever fits — check `GenericClient.js` for
  the exact helper method to reuse), using local component state for the current page (NOT
  the URL — do not reuse the URL-driven `Pagination` component as-is; either add a
  callback-driven variant or build simple Prev/Next controls scoped to the modal). Selecting
  an item shows its photo, name, value, how many are already owned (cross-reference the
  character's current owned-treasures list, keyed by `treasure_id`), and a quantity input
  (default 1). On confirm, `GenericClient#post('/games/<slug>/pcs|npcs/<character_id>/treasures/acquire.json', { treasure_id, quantity })`.
- **Sell**: paginated browser over the existing
  `GET games/<slug>/pcs|npcs/<character_id>/treasures.json` endpoint (same local-pagination
  approach), limited to what it already returns (`quantity > 0`, per the backend change).
  Selecting an item shows the same detail view plus a quantity-to-sell input (default 1,
  capped client-side at the owned `quantity`). On confirm, POST to `.../treasures/sell.json`
  with the same body shape.

On success of either action: update the character's displayed `money` and the affected
treasure's `quantity` in local state (using the `{ quantity, money }` response) without a
full page refetch, and reflect the change in whichever list (full-list page or preview
section) triggered the modal. On a 400 error response, surface the server's error message
(e.g. "insufficient funds" / "not enough owned") inline in the modal, following the
existing `ErrorAlert`/inline-error convention used by other forms in this codebase.

Gate the "Add treasure" button and the modal's mutating actions on `character.can_edit`
only — anyone who can already view the list can view it, per the issue.

### Step 4 — Translations

Add new i18n keys to `frontend/assets/i18n/en.yaml` and `pt.yaml` for: the modal title, tab
labels, quantity input label, confirm/cancel buttons, "already owned" label, and the two
error messages ("insufficient funds" / "not enough owned"), following the existing
`photo_upload_modal`/`slain_confirm_modal`/`character_treasures_page` key-naming
conventions already in those files. This project's convention (see #296/#297/#311) is for
the frontend agent to add these keys directly rather than routing through the `translator`
agent for straightforward additions — run the repo's key-parity check script afterwards
(see `docs/agents/architecture.md`) to confirm `en.yaml` and `pt.yaml` stay in sync.

## Files to Change

- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — swap preview section
- `frontend/assets/js/components/elements/CharacterTreasuresPreview.jsx` (new)
- `frontend/assets/js/components/elements/helpers/CharacterTreasuresPreviewHelper.jsx` (new)
- `frontend/assets/js/components/elements/characterPreviewConstants.js` — `MAX_PREVIEW_TREASURES = 6`
- `frontend/assets/js/components/elements/TreasurePreviewSection.jsx` /
  `helpers/TreasurePreviewSectionHelper.jsx` — retire if unused elsewhere
- `frontend/assets/js/components/pages/PcCharacterTreasures.jsx`
- `frontend/assets/js/components/pages/NpcCharacterTreasures.jsx`
- `frontend/assets/js/components/pages/controllers/PcCharacterTreasuresController.js`
- `frontend/assets/js/components/pages/controllers/NpcCharacterTreasuresController.js`
- `frontend/assets/js/components/pages/helpers/CharacterTreasuresHelper.jsx` — card grid + add button
- `frontend/assets/js/components/elements/TreasureExchangeModal.jsx` (new)
- `frontend/assets/js/components/elements/helpers/TreasureExchangeModalHelper.jsx` (new)
- `frontend/assets/js/components/elements/controllers/TreasureExchangeModalController.js` (new, if warranted)
- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml` — new keys
- Matching Jasmine specs under `frontend/specs/` for every new/changed file above

## CI Checks

- `frontend`: `docker-compose run --rm frontend yarn test` (CI job: frontend tests)
- `frontend`: `docker-compose run --rm frontend yarn lint` (CI job: frontend lint)
- `frontend`: translation key-parity check script (see `docs/agents/architecture.md` for the
  exact command), if the project runs one in CI

## Notes

- Confirm whether the PC/NPC character detail fetch already used by
  `PcCharacter.jsx`/`NpcCharacter.jsx` can be reused/shared for the treasures full-list page
  instead of adding a second fetch, to avoid duplicate requests.
- The "paginated browser that doesn't change the page URL" requirement is the main new UI
  pattern in this issue — no existing component does this today; budget time to design a
  small reusable piece (or accept an internal-only component if it isn't needed elsewhere).
- Coordinate with the backend plan on exact 400 error message strings/keys so they map to
  the right translated inline message.
