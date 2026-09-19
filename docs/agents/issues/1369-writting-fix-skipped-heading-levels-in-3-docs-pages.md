# Issue: Writting: fix skipped heading levels in 3 docs pages

## Description
Codacy's markdownlint scan (`MD001`, BestPractice, Info severity) flags 3 headings across docs pages that skip a heading level (e.g. jumping from h2 straight to h4). Skipped heading levels break the document outline and can confuse screen readers that rely on sequential heading levels.

## Problem
- `docs/agents/access-control/character.md:62` — the `GET /games/<slug>/pcs.json` heading is h4, nested directly under `## Filters` (h2); expected h3. Two sibling h4 headings follow (lines 66, 74) but need no separate change — they become valid h4-under-h3 once line 62 is fixed.
- `docs/agents/access-control/collection.md:26` — the "Indirect mutation via StlModel import" heading is h3, nested directly under `# Collection` (h1); expected h2.
- `docs/agents/architecture/proxy.md:20` — the "Routing modes" heading is h3, nested directly under `# Tent Proxy (majora_proxy)` (h1); expected h2.

## Acceptance Criteria
- [ ] All 3 flagged headings use the expected, non-skipped heading level
- [ ] Codacy's markdownlint `MD001` finding clears for these files

## Solution
Bump each flagged heading up by one level (h4→h3, h3→h2) so it increments by exactly one from its parent, without changing heading text, content, or any other document structure. No cascading changes are needed beyond the 3 flagged lines — verified by inspecting each file's full heading outline.
