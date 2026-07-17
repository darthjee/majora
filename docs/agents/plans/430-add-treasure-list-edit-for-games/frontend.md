# Frontend Plan: Add treasure list edit for games

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full endpoint shapes this depends
on. In short: `GET /games/:game_slug/treasures/missing.json` (paginated, DM/superuser-only,
same envelope as the existing `treasures.json`/`treasures/all.json`, items shaped like
`TreasureListSerializer` with `value` pre-filled from the catalog treasure and
`available_units`/`max_units`/`game_slug` all `null`); `POST
/games/:game_slug/treasures/link.json` (`{treasure_id, value, hidden?, max_units?}` →
`TreasureDetailSerializer` detail, `201`). Both are DM/superuser-only server-side — gate the
UI on the page's existing `canEdit` the same way the "New Treasure" button already is.

## Implementation Steps

### Step 1 — `TreasureClient` additions

`frontend/assets/js/client/TreasureClient.js`:
- `fetchMissingGameTreasuresPage(gameSlug, token, { page, perPage } = {})` — mirror
  `fetchGameTreasuresAllPage`'s pagination-only param handling (no `maxValue`/`search`/
  `ordering` — the new endpoint doesn't support them), hitting
  `/games/${gameSlug}/treasures/missing.json`.
- `linkGameTreasure(gameSlug, token, fields)` — `postJson(`/games/${gameSlug}/treasures/link.json`,
  token, fields)`, mirroring `createGameTreasure`'s shape. `fields` is
  `{treasure_id, value, hidden, max_units}`.

### Step 2 — `AddGameTreasureModal` component/controller/helper

Add under `frontend/assets/js/components/resources/treasure/pages/elements/` (new
`elements/` subfolder for this page, mirroring the character page's own
`pages/elements/` split):

- `controllers/AddGameTreasureModalController.js` — thin wrapper around
  `TreasureClient.fetchMissingGameTreasuresPage`/`linkGameTreasure`, parsing the same
  `page`/`pages`/`per_page` pagination headers `GameTreasuresController` already parses, and
  translating a non-2xx link response into `{ok: false, errorKey}` (mirror
  `TreasureExchangeModalController`'s success/error parsing).
- `AddGameTreasureModal.jsx` — component holding `browse` (`items`/`page`/`pages`/`loading`/
  `error`, no search — the issue doesn't ask for one, unlike `TreasureExchangeModal`),
  `selected` (clicked treasure), `formState` (`value`, `hidden`, `hasMaxUnits`, `maxUnits`),
  `submitting`/`actionError`. On `show` becoming `true`, reset all of the above and load page
  1 (mirror `TreasureExchangeModal`'s `useEffect` on `show`). `handleSelect(item)` seeds
  `formState.value` from `item.value` (the catalog value, per the issue's "already filled but
  editable"), `hidden: false`, `hasMaxUnits: false`. On submit, build the payload as
  `{treasure_id: selected.id, value: Number(formState.value), hidden: formState.hidden,
  max_units: formState.hasMaxUnits ? Number(formState.maxUnits) : null}` — this is the new
  switch-gated pattern the issue asks for (distinct from `GameTreasureEditController`'s
  existing empty-string-means-null convention; see `plan.md`'s Notes). On success, call
  `onSuccess()` and let the parent page close the modal + reload.
- `helpers/AddGameTreasureModalHelper.jsx` — pure rendering, `react-bootstrap` `Modal`
  (`Modal.Header`/`Modal.Body`/`Modal.Footer`), same list → back-link → detail/form shape as
  `TreasureExchangeModalHelper`:
  - List state: paginated `list-group` of clickable treasure names/values (reuse
    `Pagination` or the same prev/next buttons `TreasureExchangeModalHelper` uses for its
    browse pager — check which is a better fit; `TreasureExchangeModalHelper`'s inline
    prev/next avoids re-deriving a hash-based `basePath` inside a modal, so prefer that).
  - Detail/form state: `CardTreasureImage` + name + `TreasureMoney` (both from
    `frontend/assets/js/components/common/`, same components `TreasureExchangeModalHelper`
    uses) for the photo/info header: an editable `value` number input; a `hidden` switch
    reusing the exact `form-check form-switch` markup from
    `GameNpcNewHelper.jsx:49-58` (checkbox `role="switch"`, label text via
    `Translator.t('game_treasures_page.hidden_label')` — already defined in both
    `en.yaml`/`pt.yaml`, no new key needed for this label); a second switch gating a
    `max_units` number input's visibility (new key, see Step 4).
  - Footer: Save button (disabled while `submitting`), matching
    `TreasureExchangeModalHelper`'s confirm-button/error-message layout.

### Step 3 — Wire into `GameTreasures.jsx` / `GameTreasuresHelper.jsx`

- `GameTreasuresHelper.jsx`'s `PageActions` block (currently only the conditional
  `NewButton`) gets a second button, `Add Treasure`, shown under the same `canEdit` check,
  calling a new `onAddClick` prop (add it alongside the existing `onUploadClick` param).
- `GameTreasures.jsx` adds `showAddModal` state (mirroring `showUploadModal`) and an
  `<AddGameTreasureModal show={showAddModal} gameSlug={gameSlug} onClose={...}
  onSuccess={...} />` alongside the existing `<PhotoUploadModal>`. `onSuccess` closes the
  modal and calls `controller.buildEffect()()` to reload the page's treasure list — same
  pattern `handleUploadSuccess` already uses.

### Step 4 — i18n keys

Add to both `frontend/assets/i18n/en.yaml` and `pt.yaml`, near the existing
`game_treasures_page` block:
- `game_treasures_page.add_treasure` — the new button's label.
- A new `add_game_treasure_modal:` block — `title`, `value_label`, `max_units_label`,
  `save`, `load_error`, `save_error`, `empty` (no treasures left to add), following the
  naming convention `treasure_exchange_modal:`'s own keys already use. Reuses
  `game_treasures_page.hidden_label` for the `hidden` switch (no new key there). This is a
  handful of keys — no need to hand off to a separate translator pass, but run
  `node frontend/scripts/check-i18n-keys.js` (or whatever this repo's translation-sync
  script is invoked as — check `package.json`) before committing to confirm both locale
  files stay in sync.

### Step 5 — Specs

Add Jasmine specs under `frontend/specs/` (mirrored tree) for: the two new `TreasureClient`
methods, `AddGameTreasureModalController`, and `AddGameTreasureModal`/its helper's rendering
and interaction (list → select → toggle `hasMaxUnits` → submit → success/error paths) —
follow this project's existing spec conventions for `TreasureExchangeModal`'s own spec file
as the closest template.

## Files to Change

- `frontend/assets/js/client/TreasureClient.js`
- `frontend/assets/js/components/resources/treasure/pages/elements/AddGameTreasureModal.jsx`
  (new)
- `frontend/assets/js/components/resources/treasure/pages/elements/controllers/AddGameTreasureModalController.js`
  (new)
- `frontend/assets/js/components/resources/treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx`
  (new)
- `frontend/assets/js/components/resources/treasure/pages/GameTreasures.jsx`
- `frontend/assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx`
- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml`
- Corresponding specs under `frontend/specs/` mirroring every new/changed file above

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Run inside the project containers per `AGENTS.md` (e.g. `docker-compose run --rm
  majora_fe yarn ...`), never directly on the host.
- The "Add treasure" flow becoming a modal, while the existing "add exclusive treasure" flow
  (`#/games/:game_slug/treasures/new`) stays a full page, is an intentional divergence per
  the issue's explicit ask — not something to reconcile in this issue.
