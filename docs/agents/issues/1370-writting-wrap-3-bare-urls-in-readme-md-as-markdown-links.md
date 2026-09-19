# Issue: Writting: wrap 3 bare URLs in README.md as Markdown links

## Description
Codacy's markdownlint scan (`MD034`, BestPractice, Info severity) flags 3 bare URLs in `README.md` at lines 90-92 — the local dev addresses for the full stack (proxy), backend API, and frontend dev server shown under "Running the Application". Bare URLs render inconsistently across Markdown viewers.

## Solution
Wrap each of the 3 bare URLs in `README.md:90-92` using Markdown autolink syntax (`<url>`), which satisfies `MD034` with a minimal diff while keeping the existing bold labels (`**Full stack (proxy):**`, `**Backend API:**`, `**Frontend dev server:**`) and the visible URL text unchanged:

```md
- **Full stack (proxy):** <http://localhost:3000>
- **Backend API:** <http://localhost:3030>
- **Frontend dev server:** <http://localhost:3010>
```

## Benefits
- Clears the Codacy markdownlint `MD034` finding for `README.md`
- URLs render as clickable links consistently across Markdown viewers
