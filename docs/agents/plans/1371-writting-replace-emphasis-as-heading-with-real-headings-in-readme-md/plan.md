# Plan: Writting: replace emphasis-as-heading with real headings in README.md

Issue: [1371-writting-replace-emphasis-as-heading-with-real-headings-in-readme-md.md](../issues/1371-writting-replace-emphasis-as-heading-with-real-headings-in-readme-md.md)

## Overview

Replace the three bold-emphasis lines under `## Technology Stack` in `README.md` (`**Backend**`, `**Frontend**`, `**Infrastructure**`) with real `### `-level Markdown headings, so they show up in the document outline/table of contents and clear Codacy's markdownlint `MD036` finding.

## Context

`README.md`'s `## Technology Stack` section (line 21) groups its bullet lists under three bold lines that visually look like sub-headings but aren't real Markdown headings:

- Line 23: `**Backend**`
- Line 33: `**Frontend**`
- Line 41: `**Infrastructure**`

Because these are emphasis, not headings, they're invisible to any tool that builds a document outline/TOC from heading tags, and Codacy's markdownlint flags them as `MD036` (BestPractice, Info).

## Implementation Steps

### Step 1 — Convert the three lines to real headings

In `README.md`, replace each flagged line with a `###` heading (one level below the parent `## Technology Stack`), keeping the bullet lists under each unchanged:

- `**Backend**` → `### Backend`
- `**Frontend**` → `### Frontend`
- `**Infrastructure**` → `### Infrastructure`

No other content in the file changes.

## Files to Change

- `README.md` — convert the 3 flagged emphasis lines (lines 23, 33, 41) into `###` headings under `## Technology Stack`

## CI Checks

- root: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- This is a root-level docs-only change; no specialist agent (backend/frontend/infra/etc.) owns `README.md`, so this plan is unsplit and owned by the architect.
