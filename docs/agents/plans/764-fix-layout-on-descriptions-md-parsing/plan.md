# Plan: Fix layout on descriptions md parsing

Issue: [764-fix-layout-on-descriptions-md-parsing.md](../issues/764-fix-layout-on-descriptions-md-parsing.md)

## Overview
`DescriptionBox` renders description text through `ReactMarkdown` (the only `ReactMarkdown` usage in the frontend), but no CSS scopes the resulting `h1`-`h6` tags, so they render at Bootstrap's full page-heading sizes — far too large for the compact, bordered description box. Add scoped CSS that shrinks the Markdown headings to a small, tight range while preserving the H1 (largest) → H6 (smallest) hierarchy.

## Context
`DescriptionBoxHelper.jsx` (`frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx`) wraps the description text in a `<div>` with class `p-3 border rounded bg-light` and renders `<ReactMarkdown remarkPlugins={[remarkBreaks]}>{description}</ReactMarkdown>` directly inside it — no wrapper class or heading-specific styling is applied. `bootstrap/dist/css/bootstrap.min.css` is imported globally in `frontend/assets/js/main.jsx`, so Bootstrap's reboot heading sizes (h1 2.5rem down to h6 1rem) apply unscoped. `frontend/assets/css/main.scss` only has one heading-related rule (`.app h1 { color: ... }`), nothing that scopes description-box headings.

## Implementation Steps

### Step 1 — Add a wrapper class to the Markdown container
In `DescriptionBoxHelper.jsx`, add a dedicated class (e.g. `description-box-content`) to the `<div>` that currently holds `ref={handlers.boxRef}` and wraps the `ReactMarkdown` output, alongside the existing `p-3 border rounded bg-light` classes. This gives CSS a scoped hook without touching the box's existing sizing/overflow behavior.

### Step 2 — Add scoped heading CSS
In `frontend/assets/css/main.scss`, add a rule scoped to `.description-box-content` that overrides `font-size` (and `margin` as needed for spacing) for `h1`-`h6`, using a small, tight range so headings stay clearly larger than body text but never dominate the box:
- h1 ≈ 1.25rem
- h2 ≈ 1.15rem
- h3 ≈ 1.05rem
- h4 ≈ 0.95rem
- h5 ≈ 0.9rem
- h6 ≈ 0.85rem

Exact values may be tuned during implementation as long as the descending order (h1 largest → h6 smallest) is preserved. Also reduce/normalize heading `margin-top`/`margin-bottom` (e.g. a small consistent margin) so headings don't blow out the box's compact vertical rhythm.

### Step 3 — Verify visually
Run the frontend dev server and view a Game/Character/Item description containing Markdown headings (`#`, `##`, `###`, etc.) to confirm the new sizes look proportioned to the box and still descend correctly from H1 to H6.

## Files to Change
- `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx` — add a `description-box-content` class to the Markdown wrapper `<div>`.
- `frontend/assets/css/main.scss` — add the scoped `h1`-`h6` font-size/margin overrides under `.description-box-content`.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm test` (CI job: `jasmine`)

## Notes
- No existing spec asserts on heading font sizes, so no spec changes are strictly required; `DescriptionBoxHelperSpec.js` already asserts the wrapper contains `border`/`bg-light` — adding a class alongside those does not break it.
- `ReactMarkdown` is the only Markdown renderer in the frontend, so this CSS is safely scoped to `DescriptionBox` alone without affecting any other component.
