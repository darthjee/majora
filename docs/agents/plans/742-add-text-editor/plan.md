# Plan: Add text editor

Issue: [742-add-text-editor.md](../../issues/742-add-text-editor.md)

## Overview

Replace the plain `<textarea>` used for every description-like field (game description,
item description, character public description, character DM notes) with a new shared
`MarkdownEditor` component. The component keeps the exact prop contract of the current
`TextareaField` (`id`/`label`/`value`/`onChange`/`errors`), so it's a drop-in replacement in
the four wrapper components that currently render `TextareaField`. It adds a small toolbar
(bold/italic/heading/list/link) that inserts Markdown syntax into the textarea, plus a
"Write"/"Preview" tab pair — Preview reuses the existing `ReactMarkdown` + `remark-breaks`
rendering already used on show pages, so what's previewed matches exactly what the show page
will later render. No new npm dependency is introduced.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

The frontend adds calls to `Translator.t('markdown_editor.<key>')` for every toolbar button
label/tooltip and the two tab labels. The translator agent must add a matching
`markdown_editor:` block to **both** `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml` (checked for parity by `npm run check_i18n`), with exactly
these keys (English reference text on the right — pt.yaml gets the Portuguese translation,
not this English text):

```yaml
markdown_editor:
  write_tab: Write
  preview_tab: Preview
  bold: Bold
  italic: Italic
  heading: Heading
  bulleted_list: Bulleted list
  numbered_list: Numbered list
  link: Link
  preview_empty: Nothing to preview yet
```

Frontend work does not block on translator work (missing keys just render literally via
`Translator.t`, they don't throw), but both must land in the same PR since `check_i18n` runs
in CI (`frontend-checks` job) and will fail if the two locale files' key sets diverge.
