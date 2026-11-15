# Translator Plan: Add an "insert table" action to the MarkdownEditor toolbar

Main plan: [plan.md](plan.md)

## Shared contracts

- Add the key `markdown_editor.table`, used by the frontend toolbar button as its `aria-label`/`title`.

## Implementation Steps

### Step 1 — Add the `markdown_editor.table` label

In the `markdown_editor:` block of each language's `common.yaml`, add `table` right after `link`:

- `en`: `table: Table`
- `pt`: `table: Tabela`

## Files to Change

- `frontend/assets/i18n/en/common.yaml`: add `markdown_editor.table`.
- `frontend/assets/i18n/pt/common.yaml`: add `markdown_editor.table`.

## CI Checks

- `frontend/`: `npm run check_i18n` (CI job: `frontend-checks`).
