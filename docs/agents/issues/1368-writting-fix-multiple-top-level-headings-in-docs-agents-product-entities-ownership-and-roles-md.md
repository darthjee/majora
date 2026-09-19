# Issue: Writting: fix multiple top-level headings in docs/agents/product/entities/ownership-and-roles.md

## Description
Codacy's markdownlint scan (`MD025`, BestPractice, Info severity) flags 4 headings in `docs/agents/product/entities/ownership-and-roles.md` (lines 21, 33, 77, 149) as additional top-level (`#`/h1) headings in a document that should have exactly one. Multiple h1 headings break the document's outline and make its structure ambiguous.

## Problem
The file currently has five `#` (h1) headings: "Ownership Chain" (line 1), "GameMaster Role" (line 21), "Staff Role" (line 33), "Editing Rules" (line 77), and "Summary Table" (line 149) — all sibling sections at the same nesting level, with none of them acting as an overall document title. "Ownership Chain" happens to be first, but it only covers one of the five concerns (ownership, GameMaster, Staff, editing rules, and a summary table); using it as the sole top-level heading would misrepresent the document's actual scope, which matches the filename `ownership-and-roles.md` more broadly than any single existing section.

## Expected Behavior
- `docs/agents/product/entities/ownership-and-roles.md` has exactly one top-level (`#`) heading: "Ownership and Roles".
- "Ownership Chain", "GameMaster Role", "Staff Role", "Editing Rules", and "Summary Table" all appear as `##` sections under it.
- The remaining heading hierarchy reads correctly, with no orphaned or mis-nested sections.
- Codacy's markdownlint `MD025` finding clears for this file.

## Solution
Add a new top-level heading, "Ownership and Roles", to the top of the document, matching the filename's scope. Demote all five existing `#` headings — "Ownership Chain" (line 1), "GameMaster Role" (line 21), "Staff Role" (line 33), "Editing Rules" (line 77), and "Summary Table" (line 149) — to `##`, making them sibling sections under the new title. None of the five sections nest inside one another, so a flat set of `##` siblings preserves the current reading order and structure — no other content or renumbering changes are needed.
