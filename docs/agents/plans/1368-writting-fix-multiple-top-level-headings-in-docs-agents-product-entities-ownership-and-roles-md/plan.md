# Plan: Writting: fix multiple top-level headings in docs/agents/product/entities/ownership-and-roles.md

Issue: [1368-writting-fix-multiple-top-level-headings-in-docs-agents-product-entities-ownership-and-roles-md.md](../../issues/1368-writting-fix-multiple-top-level-headings-in-docs-agents-product-entities-ownership-and-roles-md.md)

## Overview

`docs/agents/product/entities/ownership-and-roles.md` currently has five `#` (h1) headings, which trips Codacy's markdownlint `MD025` rule (a document should have exactly one top-level heading). Add a new top-level title that matches the file's actual scope and demote the five existing `#` headings to `##` siblings beneath it.

## Context

The file documents five related but distinct concerns — the ownership chain, the GameMaster role, the Staff role, character editing rules, and a summary table — each currently under its own `#` heading (lines 1, 21, 33, 77, 149). None of the five nest inside one another, and none alone represents the whole document, which is broader in scope than any single section and matches the filename `ownership-and-roles.md`.

## Implementation Steps

### Step 1 — Add a title heading and demote existing sections

In `docs/agents/product/entities/ownership-and-roles.md`:
- Insert a new top-level heading `# Ownership and Roles` at the very top of the file, above the current first heading.
- Change the five existing `#` headings — "Ownership Chain" (line 1), "GameMaster Role" (line 21), "Staff Role" (line 33), "Editing Rules" (line 77), and "Summary Table" (line 149) — to `##`, keeping their text, order, and the surrounding `---` separators unchanged.
- Leave all other content (body text, tables, code blocks) untouched — this is a pure heading-level fix.

## Files to Change

- `docs/agents/product/entities/ownership-and-roles.md` — add `# Ownership and Roles` title; demote the 5 existing `#` headings to `##`.

## CI Checks

- root: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- No cross-links elsewhere in the repo are expected to reference these headings by anchor (e.g. `#ownership-chain`); if any are found during implementation, update them to match the new `##`-level anchors (anchor slugs are unaffected by heading level, so this should not require changes in practice).
