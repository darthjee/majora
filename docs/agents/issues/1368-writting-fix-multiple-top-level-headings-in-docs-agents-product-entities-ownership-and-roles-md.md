# Writting: fix multiple top-level headings in docs/agents/product/entities/ownership-and-roles.md

## Context

Codacy's markdownlint scan (`MD025`, BestPractice, Info severity) flags 4 headings in `docs/agents/product/entities/ownership-and-roles.md` (lines 21, 33, 77, 149) as additional top-level (`#`/h1) headings in a document that should have exactly one. Multiple h1s break the document's outline and make its structure ambiguous.

## What needs to be done

Docs: review `docs/agents/product/entities/ownership-and-roles.md` and demote the headings at lines 21, 33, 77, and 149 to an appropriate sub-level (`##`/h2 or lower) relative to the document's single intended top-level heading, adjusting the rest of the heading hierarchy if needed for consistency.

## Acceptance criteria

- [ ] docs/agents/product/entities/ownership-and-roles.md has exactly one top-level (`#`) heading
- [ ] The remaining heading hierarchy reads correctly (no orphaned or mis-nested sections)
- [ ] Codacy's markdownlint `MD025` finding clears for this file
