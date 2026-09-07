# Crawler Plan: Spec: Collection → StlModels extraction (Lootstudios)

Main plan: [plan.md](plan.md)

## Overview

This issue is one page of the `docs/agents/specs/loot-crawling.md` spec
(#1261's split): documenting how to go from a Lootstudios collection (bundle)
to its list of STL models (miniatures), mapped onto Majora's `StlModel`
concept, including the primary extraction approach, two documented fallbacks,
edge cases, and a Navi extraction sketch for the future crawler-configuration
sub-issue to consume. Everything needed is already fully researched and
written into the issue body (#1266) — this plan is about placing it correctly
in the docs tree, not further research.

**Prerequisite note:** this issue depends on #1265 (Source → Collections
extraction), which in turn depends on #1261 having created the spec hub
(`docs/agents/specs.md` + `docs/agents/specs/loot-crawling.md`). If those
land first, Step 1 below just adds a link to the existing hub. If this issue
is implemented before they do, Step 1 creates minimal hub stubs instead of
blocking — #1261/#1265 fill them in properly (topology, auth/pagination
findings, `AGENTS.md`/`index.md`/`summary.md` wiring) without conflicting,
since this issue only ever adds one link line to each hub, never rewrites
their content.

## Implementation Steps

### Step 1 — Ensure the spec hub scaffolding exists, and link the new page

Check whether `docs/agents/specs.md` and `docs/agents/specs/loot-crawling.md`
already exist:

- **If they exist** (created by #1261/#1265): read them, and add a link to
  `loot-crawling/collection-to-stl-models.md` in `loot-crawling.md`'s list of
  aspect pages. Don't touch anything else in either file — their content is
  #1261's/#1265's responsibility.
- **If they don't exist yet**: create minimal stubs so this page has
  somewhere to live:
  - `docs/agents/specs.md` — a short hub: what a spec is (a persistent,
    high-level design doc for a feature area, written before/alongside the
    issues that implement it, guiding their creation, removed once the
    feature area is fully implemented — see #1261's own body for the full
    rationale if a fuller writeup is wanted later) + a link-only list with
    one entry, `[Loot Crawling](specs/loot-crawling.md)`.
  - `docs/agents/specs/loot-crawling.md` — a short hub: one/two sentences on
    what this spec covers (crawling Lootstudios into Majora's miniatures
    catalog) + a link-only list of aspect pages, starting with `[Collection →
    StlModels extraction](loot-crawling/collection-to-stl-models.md)`.
  - Leave the full topology/approach-comparison/open-questions content for
    the hub itself to #1261/#1265 — don't duplicate #1266's own page content
    into the hub.

### Step 2 — Write the collection → StlModels extraction page

Create `docs/agents/specs/loot-crawling/collection-to-stl-models.md`. Content
is already fully drafted in the "Solution" section of issue #1266 — copy it
in directly (adjust heading levels so the page's own `# <Title>` is top-level
and the existing `### Approach A` etc. become `##` sections):

- **Approach A — `GetMyLootsCache` miniature records (primary)**: the field
  table (`obj_post_id`, `obj_inid`, `bnd_inid`, `bnd_title`, `obj_title`),
  the `StlModel` mapping (`obj_title`→`name`, `obj_inid`→`external_id`), the
  4-step algorithm, and the verified `tidal-aberrations` example (28
  miniatures).
- **Approach B — `Load_ObjectExplorer` (fallback)**: the two-round-trip flow,
  the `postid-(\d+)` / `bndId` extraction, and the full header list
  (`Content-Type`, `X-Requested-With`, `Origin`, `Referer`, `Cookie`).
- **Approach C — image URL parsing (thinnest fallback)**: the
  `assets.loot-studios.com/app/<BundleName>/<INID>.png` pattern and its
  regex.
- **Comparison table** and the "recommended primary: Approach A" call.
- **Edge cases** — delisted/removed items, session expiry mid-crawl. Copy the
  issue's framing as-is (see "Notes" below on why these stay marked
  unresolved rather than being answered here).
- **Navi extraction sketch** — the `parser:` YAML block, with the note that
  field names are subject to reconciliation with #1267.

Follow `docs/agents/documentation.md`'s Markdown formatting rules throughout
(blank line before/after every heading and list — the issue body already
follows this, so a faithful copy should already comply).

## Files to Change

- `docs/agents/specs.md` — create if missing (Step 1); otherwise unchanged.
- `docs/agents/specs/loot-crawling.md` — create if missing (Step 1), or add
  one link line if it already exists.
- `docs/agents/specs/loot-crawling/collection-to-stl-models.md` — create
  (Step 2), full content per issue #1266.

## Notes

- **The two edge cases (delisted items, session expiry) cannot actually be
  verified live by this implementation** — that requires a real, logged-in
  Lootstudios account, which an autonomous agent doesn't have access to.
  Write the page with these two items explicitly marked as **open /
  unverified** (matching how #1265's auth question is already framed in this
  initiative), rather than fabricating an answer. A human with account
  access (or a future session with browser access to a logged-in session)
  needs to close them out later — don't block this issue on that.
- The auth/pagination open question belongs to #1265, not this issue — don't
  attempt to resolve it here even though Approach A's field table references
  it; just carry the cross-reference forward as the issue body already does.
- No CI job covers Markdown linting locally in this repo (Codacy's PR-time
  check is the only enforcement — see `docs/agents/documentation.md`); no
  `## CI Checks` section needed.
