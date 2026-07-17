# Translator Plan: Header Overhauling

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's `HeaderHelper.jsx` changes call `Translator.t('header.nav_admin')`, `Translator.t('header.nav_pc')`, and `Translator.t('header.nav_npc')` for the titles of the three new dropdowns. These three keys must exist in both locale files before the frontend changes are considered complete (the frontend spec assertions will render these titles).

## Implementation Steps

### Step 1 — Add the three new keys to `en.yaml`
File: `frontend/assets/i18n/en.yaml`

Inside the existing `header:` block (after `nav_game_show`, alongside the other `nav_*` entries), add:

```yaml
  nav_admin: Admin
  nav_pc: PC
  nav_npc: NPC
```

### Step 2 — Add the same keys to `pt.yaml`
File: `frontend/assets/i18n/pt.yaml`

Inside the existing `header:` block, add:

```yaml
  nav_admin: Admin
  nav_pc: PC
  nav_npc: NPC
```

(`Admin`, `PC`, and `NPC` are used as-is in Portuguese too — these are already the terms used elsewhere in the app's PT copy for these concepts.)

### Step 3 — Verify key sync
Run the project's i18n sync check to confirm no locale is missing a key.

## Files to Change
- `frontend/assets/i18n/en.yaml` — add `header.nav_admin`, `header.nav_pc`, `header.nav_npc`.
- `frontend/assets/i18n/pt.yaml` — add `header.nav_admin`, `header.nav_pc`, `header.nav_npc`.

## CI Checks
- `frontend`: `npm run check_i18n` (keeps locale files in sync; run locally before pushing)

## Notes
- Do not add keys for the dropdown's Overview/Photos/Treasures items — those reuse existing keys (`header.nav_game_show`, `character_page.see_all_photos`, `character_page.treasures_title`), per `plan.md`'s "Shared contracts".
- Do not remove `game_page.treasures` — it stays in use by the existing "Game" dropdown even though the frontend agent removes the standalone button that also used it on the game show page.
