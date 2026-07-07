# Frontend Plan: Add max units treasure

Main plan: [plan.md](plan.md)

## Shared contracts

- Treasure objects returned by `GET /games/<slug>/treasures.json` (via
  `TreasureClient.fetchGameTreasuresPage`, used by both `TreasureExchangeModal`'s acquire browse
  list and `GameTreasuresController`) now include `available_units` (`int|null`) and `max_units`
  (`int|null`), both `null` when unlimited. Treat `null` as "no cap — don't show a badge/label".
- The acquire endpoint response (`CharacterClient.acquireTreasure` →
  `TreasureExchangeModalController#acquire`) gains an `acquired` field alongside the existing
  `quantity`/`money`. `acquired` may be less than the requested quantity when the treasure was
  capped — do not assume they always match.
- New translation keys (added by `translator`, do not hardcode strings) — see the exact key list
  in `translator.md`; reference them via `Translator.t(...)` as usual, e.g.
  `game_treasures_page.available_units_label` / `game_treasures_page.max_units_label` and
  `treasure_exchange_modal.available_units_badge` (or whatever final names are agreed with
  translator — coordinate key names with `translator.md` before wiring `Translator.t` calls, or
  use the ones proposed there since they were derived from this same plan).

## Implementation Steps

### Step 1 — Game treasure list page: show `available_units` / `max_units`

`GameTreasuresHelper.jsx` renders each treasure via `TreasureCard` (`TreasureCard.jsx` /
`TreasureCardHelper.jsx`). `TreasureCardHelper` currently only supports a `quantity` prop
(owned-quantity badge, hidden at 1 or fewer). Extend `TreasureCard`/`TreasureCardHelper` with a
way to additionally show `available_units`/`max_units` when present on `treasure` (they arrive
directly on the `treasure` object from the API, no new prop needed — read
`treasure.available_units`/`treasure.max_units` directly) — e.g. a small text line or badge in
the card body, shown only when `treasure.max_units` is not `null`/`undefined` (unlimited
treasures show nothing extra, per the issue). This affects both `GameTreasuresHelper` (game
management list) and any other `TreasureCard` consumers (`TreasuresHelper.jsx`,
`CharacterTreasuresHelper.jsx`, `CharacterTreasuresPreviewHelper.jsx`) — those other call sites
either won't have `available_units`/`max_units` on their data (global treasures list, character
inventories) or the field will simply be `null`/absent, so no extra rendering happens there;
double check this holds once the badge condition is implemented.

### Step 2 — Acquire modal: always-visible `available_units` badge

`TreasureExchangeModalHelper.jsx`'s `#renderBrowseList` currently renders the acquire/sell browse
list as plain `list-group-item` buttons (name + value), **not** `TreasureCard` — there is no
existing "card" or badge in this list today (the "already owned" count is only shown as text in
the detail pane, `#renderDetail`, once a treasure is selected). Add the badge for limited
treasures directly to `#renderBrowseList`'s acquire-tab rendering, positioned/styled consistently
with `TreasureCardHelper`'s `#renderQuantityBadge` badge convention (`badge bg-secondary`), but
**always shown when `item.available_units` is not `null`/`undefined`**, including at `0` or `1`
(unlike the owned-quantity badge elsewhere, which hides at ≤1). Scope this to the acquire tab
only — the sell tab lists owned `CharacterTreasure` entries, which don't carry
`available_units`/`max_units` (per the backend contract, only the acquire/game-list serializer
does).

### Step 3 — Acquire confirmation: handle partial fulfillment (`acquired` field)

In `TreasureExchangeModal.jsx`'s `handleConfirm`, `result.quantity`/`result.money` are already
consumed on success. `result.acquired` is now also available from the controller's
`#parseActionResponse` (update `TreasureExchangeModalController.js` to pass it through, mirroring
`quantity`/`money`). Decide whether to surface a distinct message when `acquired` is less than
the requested `quantity` (e.g. reusing the existing `actionError`-style alert area with an info
variant, or a lightweight inline note) — the issue only requires that the underlying data be
correct, not a specific UI treatment, so keep this minimal (e.g. a short translated note when
partial) rather than introducing new UI patterns.

### Step 4 — Game-scoped treasure edit form: `max_units` field

Once backend's `game_treasure_detail.py` accepts `max_units` for M2M-linked treasures (see
`backend.md` Step 6), extend `GameTreasureEditHelper.jsx`/`GameTreasureEditController.js` (or
their new-treasure counterparts, if applicable) with a `max_units` form field, following the
existing `FormField` pattern already used for `name`/`value`. This field should be optional
(empty = unlimited/`null`). Confirm with backend's actual endpoint shape (whether it's the same
`PATCH /games/<slug>/treasures/<id>.json` or a distinct one) before wiring the client call in
`TreasureClient.js`.

## Files to Change

- `frontend/assets/js/components/elements/TreasureCard.jsx` — prop/JSDoc updates for
  available/max units display
- `frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx` — render
  available/max units line when present
- `frontend/assets/js/components/pages/helpers/GameTreasuresHelper.jsx` — no structural change
  expected beyond what `TreasureCard` already handles; verify JSDoc stays accurate
- `frontend/assets/js/components/elements/helpers/TreasureExchangeModalHelper.jsx` — always-visible
  availability badge in the acquire browse list
- `frontend/assets/js/components/elements/controllers/TreasureExchangeModalController.js` — pass
  through `acquired` in `#parseActionResponse`
- `frontend/assets/js/components/elements/TreasureExchangeModal.jsx` — handle `acquired` in
  `handleConfirm`/`onSuccess` (decide on partial-fulfillment messaging)
- `frontend/assets/js/components/pages/helpers/GameTreasureEditHelper.jsx` and
  `frontend/assets/js/components/pages/controllers/GameTreasureEditController.js` — `max_units`
  form field (Step 4, once backend's endpoint is ready)
- `frontend/assets/js/client/TreasureClient.js` — include `max_units` in the update payload if
  the field is added to the existing update call
- Matching specs under `frontend/specs/assets/js/...` mirroring each changed file (see
  `docs/agents/contributing.md` — specs mirror `frontend/assets/js/` 1:1 with `_spec.js` suffix)

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run coverage`
- `frontend/`: `docker-compose run --rm majora_fe npm run lint`
- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (after translator's keys land)

## Notes

- Step 4 (edit form) depends on backend's Step 6 (`game_treasure_detail.py` PATCH support for
  M2M-linked treasures) being implemented first, or at least the exact contract being finalized —
  coordinate before writing the client call.
- Do not hardcode any new UI copy — all strings must go through `Translator.t()` with keys added
  by `translator` (see `translator.md`).
