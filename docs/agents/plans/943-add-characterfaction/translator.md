# Translator Plan: Add CharacterFaction

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the key list frontend needs — see [plan.md](plan.md)'s "Frontend → Translator" section and [frontend.md](frontend.md) for which component drives each key. New keys go in both `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`; `npm run check_i18n` (CI job `frontend-checks`) fails the build if either locale is missing a key the other has.

## Implementation Steps

### Step 1 — `faction_exchange_modal` (new block in `common.yaml`)

Mirrors `document_exchange_modal`'s existing block (`common.yaml:253-261`) with "Enlist"/"Quit" wording per the issue instead of "Acquire"/"Remove":

**`en/common.yaml`**, appended near `document_exchange_modal`:
```yaml
faction_exchange_modal:
  title: Faction Exchange
  search_placeholder: Search factions...
  acquire_tab: Enlist
  acquire_tab_tooltip: Enlist in the faction
  remove_tab: Quit
  remove_tab_tooltip: Quit the faction
  confirm: Confirm
```

**`pt/common.yaml`**:
```yaml
faction_exchange_modal:
  title: Troca de Facção
  search_placeholder: Buscar facções...
  acquire_tab: Alistar
  acquire_tab_tooltip: Alistar-se na facção
  remove_tab: Sair
  remove_tab_tooltip: Sair da facção
  confirm: Confirmar
```

No `hidden_label` — unlike `document_exchange_modal`, the Acquire/"Enlist" tab drops the hidden toggle entirely (see [frontend.md](frontend.md) Step 3's note — `GameFaction` has no `hidden` concept to default from).

### Step 2 — `recruit_modal` (new block in `common.yaml`)

Mirrors `give_document_modal`'s existing block (`common.yaml:239-247`) with "Recruit" wording:

**`en/common.yaml`**:
```yaml
recruit_modal:
  title: Recruit
  pc_tab: PCs
  npc_tab: NPCs
  search_placeholder: Search characters...
  cancel: Cancel
  clear: Clear
  submit: Submit
  already_enlisted_tooltip: This character is already enlisted in this faction
```

**`pt/common.yaml`**:
```yaml
recruit_modal:
  title: Recrutar
  pc_tab: PJs
  npc_tab: PNJs
  search_placeholder: Buscar personagens...
  cancel: Cancelar
  clear: Limpar
  submit: Enviar
  already_enlisted_tooltip: Este personagem já está alistado nesta facção
```

### Step 3 — `character_factions_preview` (new file, mirrors `character_documents_preview.yaml`)

**`en/character_factions_preview.yaml`**:
```yaml
character_factions_preview:
  empty: No factions yet.
```

**`pt/character_factions_preview.yaml`**:
```yaml
character_factions_preview:
  empty: Nenhuma facção ainda.
```

Register both in `frontend/assets/i18n/en/index.js` and `frontend/assets/i18n/pt/index.js`, alongside the existing `character_documents_preview`/`character_possessions_preview` entries:

```js
character_factions_preview: () => import('./character_factions_preview.yaml?raw'),
```

### Step 4 — `faction_page` additions (existing file)

`faction_page.yaml` currently only has `loading: Loading faction...` (en) / its `pt` equivalent. Add:

**`en/faction_page.yaml`**:
```yaml
faction_page:
  loading: Loading faction...
  characters_panel_title: Characters
  characters_panel_empty: No characters in this faction yet.
  recruit_button: Recruit
```

**`pt/faction_page.yaml`** (preserve the existing `loading` line, add the Portuguese equivalents of the three new keys, matching this file's existing tone).

### Step 5 — Verify against frontend's final key list

[frontend.md](frontend.md) Steps 2-4 may surface additional small keys while building the components (e.g. a specific button/label/tooltip not anticipated here) — cross-check the frontend PR's actual `Translator.t(...)` calls against this file's key list before considering the work done, and add anything missing to both locales.

## Files to Change

- `frontend/assets/i18n/en/common.yaml`, `frontend/assets/i18n/pt/common.yaml` — `faction_exchange_modal`, `recruit_modal` blocks.
- `frontend/assets/i18n/en/character_factions_preview.yaml`, `frontend/assets/i18n/pt/character_factions_preview.yaml` — new.
- `frontend/assets/i18n/en/index.js`, `frontend/assets/i18n/pt/index.js` — register the new file.
- `frontend/assets/i18n/en/faction_page.yaml`, `frontend/assets/i18n/pt/faction_page.yaml` — new keys.

## CI Checks

- `npm run check_i18n` (CI job: `frontend-checks`) — verifies key parity between `en`/`pt`.

## Notes

- Do this step only after (or alongside) [frontend.md](frontend.md) is far enough along to know the final, exact key names each component calls — the key names above are best-effort predictions based on the existing `document`/`possession` precedent, not guaranteed final.
