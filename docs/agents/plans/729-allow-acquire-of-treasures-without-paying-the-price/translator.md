# Translator Plan: Allow acquire of treasures without paying the price

Main plan: [plan.md](plan.md)

## Shared contracts

Produces four new keys under the existing `treasure_exchange_modal:` namespace that the
`frontend` agent will reference via `Translator.t()`: `acquire_tab`, `acquire_tab_tooltip`,
`remove_tab`, `remove_tab_tooltip`.

## Implementation Steps

### Step 1 — Add the new keys to `en.yaml`

In `frontend/assets/i18n/en.yaml`, in the `treasure_exchange_modal:` block (currently lines
320-341), add after `sell_tab_tooltip` (line 327), matching the existing `buy_tab`/
`sell_tab` style:

```yaml
  acquire_tab: Acquire
  acquire_tab_tooltip: Acquires treasure without changing character's money
  remove_tab: Remove
  remove_tab_tooltip: Removes treasure without changing character's money
```

(Exact tooltip wording per the issue file's Solution section.)

### Step 2 — Add the same keys to `pt.yaml`

In `frontend/assets/i18n/pt.yaml`, same block (lines 320-341), same position, translated:

```yaml
  acquire_tab: Adquirir
  acquire_tab_tooltip: Adquire tesouro sem alterar o dinheiro do personagem
  remove_tab: Remover
  remove_tab_tooltip: Remove tesouro sem alterar o dinheiro do personagem
```

### Step 3 — Run the key-sync check

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

Fix any reported mismatch before considering this done.

## Files to Change

- `frontend/assets/i18n/en.yaml` — 4 new keys under `treasure_exchange_modal:`
- `frontend/assets/i18n/pt.yaml` — 4 new keys under `treasure_exchange_modal:`

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (part of CI job: `frontend-checks`)

## Notes

- No new error-message keys needed — Acquire has no failure mode beyond the existing
  `generic_error`/`load_error`; Remove reuses `not_enough_owned` (identical condition to
  Sell's "not enough owned").
