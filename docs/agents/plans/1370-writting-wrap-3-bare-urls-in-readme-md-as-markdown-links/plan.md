# Plan: Writting: wrap 3 bare URLs in README.md as Markdown links

Issue: [1370-writting-wrap-3-bare-urls-in-readme-md-as-markdown-links.md](../../issues/1370-writting-wrap-3-bare-urls-in-readme-md-as-markdown-links.md)

## Overview
`README.md:90-92` lists three local dev-server URLs as bare text, which trips Codacy's markdownlint `MD034` rule. Wrap each URL in Markdown autolink syntax (`<url>`) so it renders as a proper link while keeping the existing bold labels and visible URL text unchanged.

## Context
The three lines under "Running the Application" read:

```md
- **Full stack (proxy):** http://localhost:3000
- **Backend API:** http://localhost:3030
- **Frontend dev server:** http://localhost:3010
```

## Implementation Steps

### Step 1 — Wrap the bare URLs in autolink syntax
In `README.md`, change lines 90-92 so each URL is wrapped in `<...>`:

```md
- **Full stack (proxy):** <http://localhost:3000>
- **Backend API:** <http://localhost:3030>
- **Frontend dev server:** <http://localhost:3010>
```

## Files to Change
- `README.md` — wrap the 3 bare URLs at lines 90-92 in Markdown autolink syntax (`<url>`)

## CI Checks
- root: `yarn lint_md` (CI job: `markdownlint`)

## Notes
- No new top-level folder or agent ownership is introduced — this is a root-level `README.md` edit, handled directly rather than via a specialist agent.
