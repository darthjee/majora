# Plan: Add an "insert table" action to the MarkdownEditor toolbar

Issue: [1778-add-an-insert-table-action-to-the-markdowneditor-toolbar.md](../../issues/1778-add-an-insert-table-action-to-the-markdowneditor-toolbar.md)

## Overview

Add a `table` action to `MarkdownSyntax` that inserts a fixed 2-column GFM table skeleton in its own
block and selects the `Header 1` placeholder. Then expose it as a new `MarkdownEditor` toolbar button
with a Bootstrap `bi-table` icon and a translated label. `remark-gfm` already landed in #1773, so the
preview renders the table.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- Translation key: `markdown_editor.table`, in `frontend/assets/i18n/{en,pt}/common.yaml`, under
  the existing `markdown_editor:` block (after `link`).
  - `en`: `Table`
  - `pt`: `Tabela`
- The toolbar entry in `MarkdownEditorHelper.jsx` uses `labelKey: 'markdown_editor.table'`.
- `npm run check_i18n` (CI `frontend-checks`) must pass, so both languages must have the key.
