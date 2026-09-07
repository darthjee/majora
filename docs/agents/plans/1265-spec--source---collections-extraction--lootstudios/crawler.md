# Crawler Plan: Spec: Source → Collections extraction (Lootstudios)

Main plan: [plan.md](plan.md)

## Overview

Write the one remaining piece of the `docs/agents/specs/loot-crawling.md`
spec that documents extraction (the emission-contract and model-changes
pages are separate sub-issues): how to go from the Lootstudios source to its
list of collections (bundles), mapped onto Majora's `Collection`. The hub
(`docs/agents/specs.md` + `docs/agents/specs/loot-crawling.md`) and the
sibling `docs/agents/specs/loot-crawling/collection-to-stl-models.md` page
already exist (merged for #1266) — this plan only adds the new page and
links it in, matching that page's established structure/tone.

## Implementation Steps

### Step 1 — Write the source → collections extraction page

Create `docs/agents/specs/loot-crawling/source-to-collections.md`. Content
is already fully drafted in the "Solution" section of issue #1265 — copy it
in directly (top-level `# <Title>`, existing `###` sections become `##`,
matching `collection-to-stl-models.md`'s heading depth):

- **Approach A — `GetMyLootsCache` bundle records**: the field table
  (`obj_inid`, `obj_title`, `obj_slug`, `obj_date`/`obj_rating`/`obj_voters`
  unmapped, `obj_image`), the `Collection` mapping (`obj_title`→`name`,
  slug-built URL→`url`, `obj_image`→photo candidate, `obj_inid`→
  `external_id`), and the "no fallback approach exists" callout (with the
  unexplored `/my-loots/` HTML-scraping idea noted as a future possibility,
  not pursued here).
- **Open question 1 (auth)** and **Open question 2 (pagination)** — copy
  both exactly as marked in the issue: **open — needs live verification**,
  each with its exact test to run. Do not attempt to resolve either — no
  live Lootstudios credentials are available to this implementation (same
  constraint as #1266's edge cases).
- **Navi extraction sketch** — the `parser:` YAML block, with the note that
  field names are subject to reconciliation with #1267.

Follow `docs/agents/documentation.md`'s Markdown formatting rules (blank
line before/after every heading and list) — a faithful copy of the issue
body should already comply.

### Step 2 — Link the new page from the hub

Edit `docs/agents/specs/loot-crawling.md`'s "Aspect pages" list to add:

```markdown
- [Source → Collections extraction](loot-crawling/source-to-collections.md)
```

Leave everything else in the hub unchanged — it stays the lean index it
already is; the full topology/approach-comparison content lives on the
per-aspect pages, not the hub (see issue #1265's "Description" for why).

## Files to Change

- `docs/agents/specs/loot-crawling/source-to-collections.md` — create (Step
  1), full content per issue #1265.
- `docs/agents/specs/loot-crawling.md` — add one link line (Step 2).

## Notes

- **Both open questions (auth, pagination) cannot be verified live by this
  implementation** — no real Lootstudios account access. Write the page with
  them explicitly marked open/unverified, each with its exact test, exactly
  as issue #1265 specifies. Don't fabricate an answer.
- **Possible follow-up to #1266** (already merged): #1266 originally
  depended on this issue's pagination answer but landed first anyway. If
  this issue's eventual live verification (once someone with account access
  runs the tests above) finds pagination *does* exist, #1266's page may need
  a short amendment to note that per-bundle miniature extraction should
  handle it too. Not actionable now — just flagged so it isn't forgotten
  once the open question is closed.
- No CI job covers Markdown linting locally in this repo (Codacy's PR-time
  check is the only enforcement); no `## CI Checks` section needed.
