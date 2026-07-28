# Translator Plan: Add incognito for NPC

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent's components (see [frontend.md](frontend.md)) reference these translation
keys by name but do not add them — this agent adds them to every language file under
`frontend/assets/i18n/` (currently `en.yaml` and `pt.yaml`) and keeps them in sync.

## Implementation Steps

### Step 1 — Add the new keys

In `frontend/assets/i18n/en.yaml`:

- `npc_edit_page.incognito_label` — add directly under the existing `npc_edit_page.hidden_label:
  Hidden Character` (around line 229). Suggested value: `Incognito`.
- `game_npc_new_page.incognito_label` — add directly under the existing
  `game_npc_new_page.hidden_label: Hidden` entry (around line 658). Suggested value: `Incognito`.
- `character_status_badges.incognito` — add under the existing `character_status_badges.hidden:
  Hidden` entry (around line 174). Suggested value: `Incognito` (this is the badge tooltip text —
  the issue's suggested wording is "NPC is incognito"; use whichever reads naturally alongside
  the existing terse `hidden`/`private_slain`/... badge labels in that same block, e.g. "Not yet
  met" or "Incognito").

Add the equivalent three keys, translated, to `frontend/assets/i18n/pt.yaml` at the same
structural locations (same parent keys, same relative ordering).

### Step 2 — Verify sync

Run the project's translation-sync check (see `docs/agents/i18n.md`):

```bash
docker-compose run --rm majora_fe npm run check_i18n
```

This must pass with no missing/extra keys across `en.yaml`/`pt.yaml` before this agent's work is
done.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Do not invent additional keys beyond the three listed above — the frontend plan
  ([frontend.md](frontend.md)) references exactly these three names.
