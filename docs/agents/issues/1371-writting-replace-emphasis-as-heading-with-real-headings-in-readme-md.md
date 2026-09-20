# Issue: Writting: replace emphasis-as-heading with real headings in README.md

## Description

Codacy's markdownlint scan (`MD036`, BestPractice, Info severity) flags 3 lines in `README.md` (lines 23, 33, 41) that use bold emphasis instead of real Markdown headings: `**Backend**`, `**Frontend**`, and `**Infrastructure**`. These lines act as sub-groupings under the `## Technology Stack` section, but because emphasis isn't picked up as a heading by Markdown tooling, it breaks the document's outline/table of contents.

## Expected Behavior

The 3 flagged lines are real Markdown headings — `### Backend`, `### Frontend`, `### Infrastructure` — nested one level below the parent `## Technology Stack` heading, so they appear correctly in any rendered table of contents / document outline.

## Solution

Convert the flagged lines in `README.md`:

- Line 23: `**Backend**` → `### Backend`
- Line 33: `**Frontend**` → `### Frontend`
- Line 41: `**Infrastructure**` → `### Infrastructure`

No other content changes.

## Benefits

- Document outline/table of contents correctly reflects the Backend/Frontend/Infrastructure subsections
- Clears Codacy's markdownlint `MD036` finding for `README.md`
