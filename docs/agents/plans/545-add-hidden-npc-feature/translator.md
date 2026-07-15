# Translator Plan: Add hidden Npc feature

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent calls `Translator.t('<namespace>.<key>')` for every new/changed user-visible string introduced by this issue and does not hardcode English text. Add the corresponding keys to every locale file under `frontend/assets/i18n/` (currently `en.yaml` and `pt.yaml`; keep all locale files in sync, per the key-parity check run by `npm run check_i18n`).

## Implementation Steps

### Step 1 — Edit NPC form: add a `hidden_label` key to `npc_edit_page`

`npc_edit_page` (`en.yaml:148-164`) currently has no `hidden_label` key (unlike `game_npc_new_page`, which already has one). Add, near the other `*_label` keys:

```yaml
npc_edit_page:
  hidden_label: Hidden Character
```

### Step 2 — New NPC form: update the existing `hidden_label` key's text

`game_npc_new_page.hidden_label` (`en.yaml:384`) currently reads `Hidden`. Update it to match the Edit form's wording so both forms are consistent:

```yaml
game_npc_new_page:
  hidden_label: Hidden Character
```

### Step 3 — Tooltip badge text

Add a new key to the existing `character_status_badges` namespace (`en.yaml:102-113`), following the exact pattern of `slain`/`public_slain`:

```yaml
character_status_badges:
  hidden: Hidden
```

### Step 4 — "Hidden" filter on the NPC list page

Add keys to the existing `game_npcs_page` namespace (`en.yaml:363-377`), following the exact pattern of `filter_status_label`/`filter_status_alive`/`filter_status_slain`:

```yaml
game_npcs_page:
  filter_hidden_label: Hidden
  filter_hidden_shown: Shown
  filter_hidden_only: Hidden
```

Coordinate with the `frontend` agent on the exact key names it ends up referencing in `NpcFiltersHelper.jsx` — this list is a starting proposal; keep it in lockstep with the actual `Translator.t()` calls added there.

### Step 5 — Verify key parity

Run the key-parity check across every locale file after adding the keys above (and their Portuguese equivalents in `pt.yaml`).

## Files to Change

- `frontend/assets/i18n/en.yaml` — add/update the keys above
- `frontend/assets/i18n/pt.yaml` — add/update the equivalent Portuguese keys (and any other locale file present at implementation time)

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- This file's key names are a starting proposal for Steps 1-4 — the `frontend` agent's actual `Translator.t()` calls are the source of truth; update this list if it diverges during implementation.
