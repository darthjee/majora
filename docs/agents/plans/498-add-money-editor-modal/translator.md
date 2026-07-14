# Translator Plan: Add money editor modal

Main plan: [plan.md](plan.md)

## Shared contracts

Produce exactly these keys, in both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`, for the `frontend` agent to consume via `Translator.t()`:

- New `money_edit_modal:` namespace (place it near the existing `links_edit_modal:`
  namespace, e.g. right after it, before `game_treasures_page:`):
  - `title`
  - `confirm`
  - `cancel`
- New key `edit_money_button` added to the existing `pc_edit_page:` namespace and the
  existing `npc_edit_page:` namespace, in both locale files, alongside each namespace's
  existing `edit_links_button` key.

Do not touch the existing `money:` namespace's `copper_piece` / `silver_piece` /
`gold_piece` / `platinum_piece` / `gp_in_gems` keys — they already exist, are already
translated in both locales, and the frontend agent reuses them as-is for the modal's row
labels.

## Context

`frontend/assets/i18n/en.yaml` and `pt.yaml` already follow a per-component namespace
convention (e.g. `links_edit_modal:` at line 242 of each file). `pc_edit_page:` (line 126
of `en.yaml`) and `npc_edit_page:` (line 137 of `en.yaml`) each already have an
`edit_links_button` key — mirror that pattern with `edit_money_button`.

## Implementation Steps

### Step 1 — Add `edit_money_button` to both edit-page namespaces

In `frontend/assets/i18n/en.yaml`:
- Under `pc_edit_page:`, add `edit_money_button: Edit money` alongside
  `edit_links_button: Edit links`.
- Under `npc_edit_page:`, add the same key/value.

In `frontend/assets/i18n/pt.yaml`:
- Under `pc_edit_page:`, add `edit_money_button: Editar dinheiro` alongside
  `edit_links_button: Editar links`.
- Under `npc_edit_page:`, add the same key/value.

### Step 2 — Add the `money_edit_modal` namespace

In `frontend/assets/i18n/en.yaml`, add (near `links_edit_modal:`):

```yaml
money_edit_modal:
  title: Edit money
  confirm: Confirm
  cancel: Cancel
```

In `frontend/assets/i18n/pt.yaml`, add the matching Portuguese block:

```yaml
money_edit_modal:
  title: Editar dinheiro
  confirm: Confirmar
  cancel: Cancelar
```

### Step 3 — Verify key parity

Run:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

Fix any reported mismatch before considering the task done.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `edit_money_button` (both edit-page namespaces) and `money_edit_modal:` namespace
- `frontend/assets/i18n/pt.yaml` — same additions, translated

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- This is purely additive — no existing keys change value or move.
