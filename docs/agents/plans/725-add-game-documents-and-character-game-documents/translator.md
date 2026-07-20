# Translator Plan: Add game documents and character game documents

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section — the frontend agent calls
`Translator.t(...)` with the exact keys below; this plan's only job is to add them (and their
translations) to both locale files.

## Implementation Steps

### Step 1 — Add new keys to `frontend/assets/i18n/en.yaml`

Mirror the existing `game_page.items` / `character_page.items_title` /
`character_items_preview.empty` / `game_items_page.*` / `character_items_page.*` blocks
(dropping the create-related keys, since document creation is out of scope):

```yaml
game_page:
  documents: Documents
character_page:
  documents_title: Documents
character_documents_preview:
  empty: No documents yet.
game_documents_page:
  loading: Loading documents...
  title: Documents
  hidden_label: Hidden
character_documents_page:
  loading: Loading documents...
  title: Documents
  hidden_label: Hidden
```

Insert each key under its existing parent block (`game_page`, `character_page`) at the same
position as the analogous item key, and add the new top-level blocks
(`character_documents_preview`, `game_documents_page`, `character_documents_page`) near their
item-page counterparts (`character_items_preview`, `game_items_page`, `character_items_page`).

### Step 2 — Add the same keys to `frontend/assets/i18n/pt.yaml`

Same structure, Portuguese values:

```yaml
game_page:
  documents: Documentos
character_page:
  documents_title: Documentos
character_documents_preview:
  empty: Nenhum documento ainda.
game_documents_page:
  loading: Carregando documentos...
  title: Documentos
  hidden_label: Oculto
character_documents_page:
  loading: Carregando documentos...
  title: Documentos
  hidden_label: Oculto
```

### Step 3 — Verify sync

Run `docker-compose run --rm majora_fe yarn check_i18n` (`frontend/scripts/check_i18n.js`) to
confirm `en.yaml` and `pt.yaml` stay key-for-key in sync after this change.

## Files to Change

- `frontend/assets/i18n/en.yaml` — new keys (Step 1)
- `frontend/assets/i18n/pt.yaml` — new keys (Step 2)

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks` →
  "Check translations")

## Notes

- `character_preview_section.see_all` is already generic (`See all {{title}}`) and reused across
  treasures/items/photos previews — no new key needed there for documents.
- No `document_page.*` (detail page) keys are needed in this issue — there's no show-document
  page yet.
