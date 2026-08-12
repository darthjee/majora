# Translator Plan: Add Character Possession

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on the frontend plan's page structure to know exactly which UI strings need keys (list page title/loading/hidden-label/create-button/exchange-modal-button, at minimum — see [plan.md](plan.md)'s Shared contracts). Can start from `character_items_page.yaml`'s key shape as a safe upper bound, since Possession supports both create and exchange like Item does (unlike Document, which only needs a subset).

## Implementation Steps

### Step 1 — List page translations

Create `frontend/assets/i18n/en/character_possessions_page.yaml` and `frontend/assets/i18n/pt/character_possessions_page.yaml`, copying `character_items_page.yaml`'s key set:

```yaml
character_possessions_page:
  loading: Loading possessions...
  title: Possessions
  hidden_label: Hidden
  new_possession: Create Possession
  exchange_possessions: Exchange Possessions
```

(pt equivalent with translated values, matching the existing pt file's tone/register for `character_items_page.yaml`).

### Step 2 — Detail/new/edit page translations, if the frontend plan introduces distinct pages

Check whether `CharacterPossessionNew.jsx`/`CharacterPossessionEdit.jsx`/`CharacterPossession.jsx` (the detail page) introduce their own visible strings beyond what's already covered by the existing `possession_new_page.yaml`/`possession_edit_page.yaml`/`possession_page.yaml` (added in #1074 for the game-level pages) — if the character-scoped pages reuse the same copy (e.g. "Create Possession", form labels), no new files are needed; if they need character-context-specific copy (e.g. distinguishing "held by this character" from the game catalog), add character-scoped variants following the same naming convention (`character_possession_page.yaml`, etc.).

### Step 3 — Register in index

Add the new file(s) to both `frontend/assets/i18n/en/index.js` and `frontend/assets/i18n/pt/index.js`, alphabetically ordered alongside `character_items_page`/`character_documents_page`:

```js
character_possessions_page: () => import('./character_possessions_page.yaml?raw'),
```

### Step 4 — Verify sync

Run the translation-key sync-check script (per [docs/agents/i18n.md](../../i18n.md)) to confirm `en` and `pt` stay in lockstep after these additions.

## Files to Change

- `frontend/assets/i18n/en/character_possessions_page.yaml` — new
- `frontend/assets/i18n/pt/character_possessions_page.yaml` — new
- `frontend/assets/i18n/en/index.js` — register new file
- `frontend/assets/i18n/pt/index.js` — register new file
- Possibly `frontend/assets/i18n/{en,pt}/character_possession_page.yaml` (detail-page-specific keys), if Step 2 determines they're needed

## Notes

- Coordinate with the frontend plan's actual final page copy (button labels, headings) before finalizing keys — this plan's Step 1 YAML is a starting point based on Item's precedent, not a guarantee of the exact final strings.
