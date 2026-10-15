# Writting: add missing trailing pipes to Markdown tables in docs/agents/

## Context

Codacy's markdownlint scan (`MD055`, CodeStyle, Info severity) flags 3 table rows missing a trailing `|` (leading-only pipe style instead of the project's leading-and-trailing convention), which can cause the table to render incorrectly in strict Markdown renderers.

## What needs to be done

Docs: add the missing trailing pipe to each flagged table row:

- docs/agents/product/entities/ownership-and-roles.md:164
- docs/agents/frontend/pages-elements.md:6, :7

## Acceptance criteria

- [ ] The 3 flagged table rows have both leading and trailing pipes
- [ ] Both tables still render correctly
- [ ] Codacy's markdownlint `MD055` finding clears for these files
