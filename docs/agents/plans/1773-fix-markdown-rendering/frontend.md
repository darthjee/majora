# Frontend Plan: Fix Markdown rendering

Main plan: [plan.md](plan.md)

## Overview

GFM tables in Markdown fields render as literal pipe text because `ReactMarkdown` runs plain
CommonMark (+ `remark-breaks`) and `remark-gfm` is not installed. All Markdown in the app is
rendered by three helpers — `DescriptionBoxHelper` (show pages), `MarkdownEditorHelper`
(editor Preview tab) and `DocumentPagesBoxHelper` (document pages) — each calling
`ReactMarkdown` directly with `remarkPlugins={[remarkBreaks]}`.

This plan adds `remark-gfm`, creates one shared `MarkdownContent` component that owns the
plugin list and a styled, horizontally scrollable `table` override, and replaces the three
direct `ReactMarkdown` calls with it.

## Context

- Full GFM with default `remark-gfm` options was chosen (tables, autolinks, `~strike~`, task
  lists, footnotes). The owner confirmed no production content is affected by the extra syntax.
- `remark-breaks` is kept.
- Security constraints: no `rehype-raw` (raw HTML stays escaped), no `urlTransform` override.
  The `table` override only adds a wrapper and classes, passing children through.
- Stored content (recipe 1 of `dragon_heist`) is fixed manually by the owner after deploy — not
  part of this plan. The "insert table" toolbar action is #1778.

## Steps

- [01 — Add the remark-gfm dependency](frontend/01-add-remark-gfm.md)
- [02 — Create the MarkdownContent component](frontend/02-markdown-content-component.md)
- [03 — Switch the three renderers to MarkdownContent](frontend/03-switch-renderers.md)
- [04 — Document MarkdownContent](frontend/04-document-markdown-content.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`; CI runs
  `npm run coverage`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`, which also
  runs `npm run check_i18n` — no new translation keys are expected)
- Docs: markdownlint (CI job: `markdownlint`) for the doc touched in step 04.

## Notes

- Validate case 2.2 of the issue locally after step 03: the recipe `checks` text (paragraph,
  blank line, table) must render as a table with `remark-gfm` active. `remark-breaks` is an
  mdast transform after block parsing, so it is not expected to interfere; if it does not
  render, investigate within this issue.
- A table whose divider row has a different cell count from the header still renders as plain
  text — expected GFM behaviour, not something to fix in code.
- `DescriptionBox` collapse/overflow detection measures rendered height; no change is expected,
  but the existing `DescriptionBox`/`DescriptionBoxHelper` specs must keep passing.
