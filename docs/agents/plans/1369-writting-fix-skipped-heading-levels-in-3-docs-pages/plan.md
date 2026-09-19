# Plan: Writting: fix skipped heading levels in 3 docs pages

Issue: [1369-writting-fix-skipped-heading-levels-in-3-docs-pages.md](../../issues/1369-writting-fix-skipped-heading-levels-in-3-docs-pages.md)

## Overview
Fix 3 headings flagged by Codacy's markdownlint `MD001` rule for skipping a level. Each fix is an isolated single-line heading-level bump — no other content or structure changes.

## Context
Codacy's markdownlint scan flags headings that jump more than one level from their parent (e.g. h2 straight to h4), which breaks the document outline and can confuse screen readers. Three locations are affected, each in a different docs page, each independent of the others.

## Implementation Steps

### Step 1 — Bump `character.md:62` from h4 to h3
In `docs/agents/access-control/character.md`, the heading at line 62 (`#### `GET /games/<slug>/pcs.json``) sits directly under `## Filters` (h2) and must be h3. Change it to `### `GET /games/<slug>/pcs.json``. The two sibling h4 headings that follow (lines 66 and 74, `GET /games/<slug>/npcs.json` and `GET /games/<slug>/npcs/all.json`) stay at h4 — once line 62 becomes h3, they are valid h4-under-h3 children and need no change.

### Step 2 — Bump `collection.md:26` and `proxy.md:20` from h3 to h2
- In `docs/agents/access-control/collection.md`, the heading at line 26 (`### Indirect mutation via StlModel import`) sits directly under `# Collection` (h1) and must be h2. Change it to `## Indirect mutation via StlModel import`.
- In `docs/agents/architecture/proxy.md`, the heading at line 20 (`### Routing modes`) sits directly under `# Tent Proxy (majora_proxy)` (h1) and must be h2. Change it to `## Routing modes`.

Both files have only one flagged heading each with no siblings at that level, so each is a self-contained single-line change.

## Files to Change
- `docs/agents/access-control/character.md` — bump line 62 heading from h4 (`####`) to h3 (`###`)
- `docs/agents/access-control/collection.md` — bump line 26 heading from h3 (`###`) to h2 (`##`)
- `docs/agents/architecture/proxy.md` — bump line 20 heading from h3 (`###`) to h2 (`##`)

## CI Checks
- root: `yarn lint_md` (CI job: `markdownlint`)

## Notes
- No sibling or descendant headings need adjustment beyond the 3 flagged lines — verified against each file's full heading outline during discussion.
- Heading text itself must not change, only the `#` level.
