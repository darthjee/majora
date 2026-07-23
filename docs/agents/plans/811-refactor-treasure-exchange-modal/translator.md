# Translator Plan: Refactor treasure exchange modal

Main plan: [plan.md](plan.md)

## Shared contracts

Frontend's refactored tab shell/components (see [frontend.md](frontend.md)) call these exact keys under the existing `treasure_exchange_modal:` namespace in every locale file — they must exist (or be renamed in place) before/alongside the frontend work lands:

- `buy_tab` — renamed from `acquire_tab`. Copy: `Buy` (was `Acquire`).
- `buy_tab_tooltip` — new. Copy: `Buys treasure using the character's money`.
- `sell_tab_tooltip` — new. Copy: `Sells treasure recovering the character's money`.
- `cancel_selection` — renamed from `back`. Copy: `Cancel` (was `Back`) — this is the button in the two-column detail view that returns to the listing; distinct from the existing `cancel` key (footer button that closes the whole modal), which is untouched.
- `insufficient_funds` — reworded to match the "buy" action: `Not enough money to buy this quantity.` (was `Not enough money to acquire this quantity.`).

All other keys in this namespace (`title`, `search_placeholder`, `your_money`, `sell_tab`, `quantity_label`, `already_owned`, `confirm`, `cancel`, `loading`, `empty`, `load_error`, `not_enough_owned`, `generic_error`, `available_units_badge`, `partially_fulfilled`) are unchanged — in particular, leave `partially_fulfilled`'s "were acquired" wording as-is, since it describes the `acquired_units` stock-consumption concept the issue explicitly keeps separate from the buy/sell action naming.

## Implementation Steps

### Step 1 — Update `frontend/assets/i18n/en.yaml`

In the `treasure_exchange_modal:` block:
- Rename `acquire_tab` → `buy_tab`, value `Buy`.
- Add `buy_tab_tooltip: "Buys treasure using the character's money"`.
- Add `sell_tab_tooltip: "Sells treasure recovering the character's money"`.
- Rename `back` → `cancel_selection`, value `Cancel`.
- Reword `insufficient_funds` to `Not enough money to buy this quantity.`.

### Step 2 — Mirror the same changes in every other locale file

Apply the equivalent rename/addition/rewording to `frontend/assets/i18n/pt.yaml` (translated copy, not a literal English copy), keeping the exact same key names across locales.

### Step 3 — Verify key parity

Run the i18n check and fix any reported mismatch:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — rename/add/reword the keys listed above.
- `frontend/assets/i18n/pt.yaml` — same keys, translated copy.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`) — fails on any key mismatch between locale files.

## Notes

- Coordinate key names/timing with the `frontend` agent (see [frontend.md](frontend.md)'s Shared contracts) — `Translator.t()` silently falls back to the raw key on a miss, so a landed rename that isn't mirrored here won't error, just show broken-looking text.
