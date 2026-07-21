# Issue: Fix layout on descriptions md parsing

## Description
`DescriptionBox` (used to render `game.description`, and `pc`/`npc` `public_description`/`private_description`) now renders description text through `ReactMarkdown` (introduced in #760). `ReactMarkdown` is the only Markdown renderer in the frontend, so this bug is scoped to that one component: `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx`.

## Problem
No CSS scopes or resizes the Markdown-generated headings inside `DescriptionBox`, so Bootstrap's default page-level heading sizes apply as-is (h1 2.5rem down to h6 1rem). Inside the small, bordered, collapsible description box, this makes headings look wrong relative to each other and to the body text — e.g. an `### ` (H3) heading renders about as large as an H1 is expected to look. The rest of the Markdown content (plain text, line breaks) renders at the correct size; only the headings are affected.

## Expected Behavior
Headings rendered inside `DescriptionBox` should be sized proportionally to the box's compact context (not full Bootstrap page-heading sizes), while still descending correctly from H1 (largest) to H6 (smallest).

## Solution
Add scoped custom CSS for the Markdown content rendered inside `DescriptionBox` (e.g. a wrapper class in `frontend/assets/css/main.scss`) that overrides `font-size`/`margin` for `h1`-`h6`, rather than mapping headings to Bootstrap's `fs-*` utility classes via the `components` prop. This keeps `DescriptionBoxHelper.jsx` free of per-tag mapping logic and puts all sizing in one place, easy to retune later.

Use a small, tight size range so headings stay clearly larger than body text but never dominate the compact box, e.g.:
- H1 ≈ 1.25rem
- H2 ≈ 1.15rem
- H3 ≈ 1.05rem
- H4 ≈ 0.95rem
- H5 ≈ 0.9rem
- H6 ≈ 0.85rem

Exact values are a starting point for implementation to fine-tune, as long as the descending order (H1 largest → H6 smallest) is preserved and none of them visually overwhelm the box.

## Benefits
Consistent, readable Markdown descriptions across every page that uses `DescriptionBox` (Game, Character, Item), matching the compact scale of the box instead of full-page heading sizes.
