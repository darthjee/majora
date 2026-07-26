# Translator Plan: Refactor public slain and allegiance

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent is renaming the `slain`/`allegiance` attributes throughout the NPC UI (buttons, allegiance selects, list filters) to match the backend's `private_slain`/`private_allegiance` rename, and will decide the definitive old-key → new-key i18n mapping as it touches each component (see [frontend.md](frontend.md)'s Step 6). Known candidates, to be confirmed against what the frontend agent actually lands on:

- `npc_edit_page`/`game_npc_new_page` namespaces: `allegiance_label` → `private_allegiance_label` (or similar), `public_allegiance_label` unchanged.
- `character_page` namespace: `slain`/`public_slain` labels and `slain_button`/`revive_button`/`public_slain_button`/`public_revive_button` — confirm with the frontend agent whether these need renaming at all (they may already be unambiguous) or need a `private_` prefix to match the model rename.
- NPC filter keys (currently `filter_status_slain`, `filter_allegiance_label`, `filter_allegiance_ally/enemy/neutral`): two new dropdowns are being added (private status, private allegiance) needing their own keys.

## Implementation Steps

### Step 1 — Get the final key mapping from the frontend agent's changes

Once the frontend agent's changes land, grep `frontend/assets/js/` for the translator keys actually referenced (`Translator.t('...')` calls) touching `slain`/`allegiance`/`private_`/`public_` and diff against the current `frontend/assets/i18n/en.yaml` keys to find what's renamed, added, or removed. Do not guess ahead of the frontend agent's actual key choices.

### Step 2 — Apply the same renames/additions to every locale file

For every renamed or newly-added key, update all locale files under `frontend/assets/i18n/` (`en.yaml`, `pt.yaml`, and any others present) so every language defines the same key set. The **English text itself does not change** for renamed keys — only the key name. New keys need real translated text in every locale, not placeholders.

### Step 3 — Verify sync

Run the project's translation-sync check (`npm run check_i18n`, per `frontend-checks` in CI) locally and fix any reported mismatch before finishing.

## Files to Change

- `frontend/assets/i18n/en.yaml`
- `frontend/assets/i18n/pt.yaml`
- Any other locale file present under `frontend/assets/i18n/`

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`, translations step)

## Notes

- This agent's work is blocked on the frontend agent's key decisions (Step 1) — coordinate/re-run after the frontend changes are available rather than guessing key names upfront.
