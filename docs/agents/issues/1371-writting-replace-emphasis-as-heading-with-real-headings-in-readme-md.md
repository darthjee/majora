# Writting: replace emphasis-as-heading with real headings in README.md

## Context

Codacy's markdownlint scan (`MD036`, BestPractice, Info severity) flags 3 lines in `README.md` (lines 23, 33, 41) that use bold/italic emphasis to visually resemble a heading instead of an actual `#`-style heading. This breaks the document's outline/table of contents, since emphasis isn't picked up as a heading by Markdown tooling.

## What needs to be done

Docs: convert the flagged emphasis-styled lines at README.md:23, :33, :41 into proper Markdown headings at the appropriate level for their place in the document's structure.

## Acceptance criteria

- [ ] The 3 flagged lines are real Markdown headings, not emphasis text
- [ ] README.md's rendered table of contents includes these sections
- [ ] Codacy's markdownlint `MD036` finding clears for this file
