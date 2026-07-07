# Translator Plan: Add max units treasure

Main plan: [plan.md](plan.md)

## Shared contracts

Frontend needs translated copy for:
1. A label/line on the game treasure management card (`GameTreasuresHelper.jsx` via
   `TreasureCard`/`TreasureCardHelper`) showing a limited treasure's available/max units.
2. A short "available" indicator badge in the treasure exchange modal's acquire browse list
   (`TreasureExchangeModalHelper.jsx`), always shown for limited treasures even at 0/1.
3. Optionally, a short note in the exchange modal when an acquire request was only partially
   fulfilled (frontend decides in its Step 3 whether to use this — add the key regardless so it's
   available if needed; an unused key does not break `check_i18n`, which only checks parity
   between `en.yaml`/`pt.yaml`, not usage).

## Implementation Steps

### Step 1 — Add keys to `en.yaml`

Under the existing `game_treasures_page:` block (`frontend/assets/i18n/en.yaml`, around line 200),
add:

```yaml
game_treasures_page:
  ...
  available_units_label: 'Available: {{available}} / {{max}}'
```

Under the existing `treasure_exchange_modal:` block (around line 185), add:

```yaml
treasure_exchange_modal:
  ...
  available_units_badge: '{{available}} left'
  partially_fulfilled: 'Only {{acquired}} of {{requested}} were available and were acquired.'
```

Use `{{placeholder}}` interpolation consistent with the existing `already_owned` key's style
(`'Already owned: {{quantity}}'`) — frontend does simple string `.replace()` on these tokens
(see `TreasureExchangeModalHelper.jsx`'s existing `.replace('{{quantity}}', owned)` usage), so
match that exact token format.

### Step 2 — Add matching keys to `pt.yaml`

Add the same three keys under the corresponding `game_treasures_page:`/`treasure_exchange_modal:`
blocks in `frontend/assets/i18n/pt.yaml`, translated to Portuguese, preserving the same
`{{placeholder}}` tokens.

### Step 3 — Verify key parity

Run the key-parity check to confirm `en.yaml`/`pt.yaml` stay in sync:

```bash
docker-compose run --rm majora_fe npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — new keys under `game_treasures_page` and `treasure_exchange_modal`
- `frontend/assets/i18n/pt.yaml` — matching Portuguese translations

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n`

## Notes

- Coordinate final key names with `frontend.md` if the frontend agent prefers different names
  while wiring `Translator.t()` calls — key names here are a proposal, not a hard requirement,
  as long as both files stay in sync and frontend references whatever was actually added.
- This work has no dependency on backend and can proceed independently once the badge/label
  copy is decided; if frontend ends up not using `partially_fulfilled`, leave the unused key in
  place rather than removing it speculatively (harmless, and avoids churn if frontend changes
  its mind).
