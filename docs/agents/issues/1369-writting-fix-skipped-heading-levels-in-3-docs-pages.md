# Writting: fix skipped heading levels in 3 docs pages

## Context

Codacy's markdownlint scan (`MD001`, BestPractice, Info severity) flags 3 headings that skip a level (e.g. jumping from h2 straight to h4), which breaks the document outline and can confuse screen readers that rely on sequential heading levels.

## What needs to be done

Docs: fix the heading level at each location so it increments by exactly one level from its parent heading:

- docs/agents/access-control/character.md:62 — expected h3, found h4
- docs/agents/access-control/collection.md:26 — expected h2, found h3
- docs/agents/architecture/proxy.md:20 — expected h2, found h3

## Acceptance criteria

- [ ] All 3 flagged headings use the expected, non-skipped heading level
- [ ] Codacy's markdownlint `MD001` finding clears for these files
