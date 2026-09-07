# Issue: Spec: Source → Collections extraction (Lootstudios)

## Description

Sub-issue of #1261 (Explore & document the Lootstudios API), itself a
sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler). Part
of the `docs/agents/specs/loot-crawling.md` spec split.

**Note on the hub's actual state:** #1261 is a parent/tracking issue — per
`arcanum-split-issue` convention it stays open to track its own split rather
than being implemented itself, so it never produced the "full topology/three
approaches/comparison" hub content originally envisioned. What exists today
is a **minimal stub** (`docs/agents/specs.md` + `docs/agents/specs/loot-
crawling.md`), created defensively when the sibling "Collection → StlModels
extraction" issue (#1266) landed first. That page already documents the full
three-approach comparison (it's naturally a collection→stlmodels concern —
see Problem below), so this issue's page stands alongside it rather than the
hub being backfilled with duplicate content.

**Note on sequencing:** this issue was originally meant to unblock #1266
(its resolved pagination answer was supposed to determine whether per-bundle
miniature extraction also needs to handle pagination) — but #1266 already
landed first, without that answer. If this issue's findings turn out to
require changes to how per-bundle extraction works, #1266's page may need a
short follow-up; noted here rather than opening a new issue for a
which-may-not-be-needed contingency.

## Problem

There is no documented, verified reference for how to go from the
Lootstudios source (the maintainer's owned-loot catalog) to its list of
collections (bundles), mapped onto Majora's `Collection` concept. Unlike the
collection → StlModels direction (#1266), there is no alternate extraction
approach here to compare — `GetMyLootsCache`'s bundle-type records are the
only documented way to enumerate bundles. So this issue is about fully
specifying and verifying that one approach (including its two open
questions), not comparing several.

## Expected Behavior

`docs/agents/specs/loot-crawling/source-to-collections.md` exists, linked
from the (already-existing, intentionally lean) `docs/agents/specs/loot-
crawling.md` hub, and documents:

- The finalized bundle-record → `Collection` field mapping.
- The auth and pagination open questions below, each either genuinely
  resolved (if verifiable without a live account) or explicitly marked
  **open — needs live verification**, with the exact test to run, so whoever
  has real Lootstudios access can close it quickly — never silently assumed
  or fabricated.
- A Navi extraction sketch (parser type, `match`, `filter`, `fields`)
  precise enough for the future Navi-configuration sub-issue (under #1260)
  to use directly.

## Solution

### Approach A — `GetMyLootsCache` bundle records (only documented approach)

`GET /wp-admin/admin-ajax.php?action=GetMyLootsCache` returns
`{"bundleObjs": [...]}`, a flat JSON array mixing bundle and miniature
records (distinguished by `obj_type`). This issue covers the **bundle**
side — `obj_type: "bundle"` records:

| Field | Description |
| --- | --- |
| `obj_inid` | Internal id (e.g. `F2608S14E02`) — the join key miniature records reference via `bnd_inid` (see #1266). |
| `obj_title` | Bundle/collection name. |
| `obj_slug` | URL slug (e.g. `tidal-aberrations`), giving `https://app.lootstudios.com/bundle/tidal-aberrations/`. |
| `obj_date`, `obj_rating`, `obj_voters` | Metadata, no direct Majora equivalent — not mapped. |
| `obj_image` | Candidate photo source. |

Maps onto Majora's `Collection` (`docs/guides/majora/miniatures.md`):
`obj_title` → `name`, the bundle URL (built from `obj_slug`) → `url`,
`obj_image` → a candidate photo, `obj_inid` → `external_id` (the field
#1262 already added — see #1262 and #1268 for the rationale).

**No fallback approach exists for this direction.** #1266's Approaches B/C
are both about listing a *known* bundle's miniatures, not about discovering
the bundle list itself — there is no documented HTML-scraping alternative to
`GetMyLootsCache` for enumerating collections. This is a real gap: if
`GetMyLootsCache` ever becomes unavailable or its auth model changes, there
is currently no fallback. Flagged here as a known limitation rather than
solved — a plausible future fallback would be scraping bundle links directly
out of `/my-loots/`'s rendered HTML, but that's unexplored and out of scope
for this issue.

### Open question 1 — does `GetMyLootsCache` actually need no auth?

The endpoint name ("**My** Loots") implies account-scoped, owned-items-only
data, but it was observed to respond with no auth header/cookie passed
explicitly. Either the endpoint is genuinely unscoped/public, or the
original finding carried an ambient session cookie without it being
obvious.

**Status: open — needs live verification.** This cannot be resolved by an
autonomous agent without a real, logged-in Lootstudios account. **Exact test
to run**: `curl -s 'https://app.lootstudios.com/wp-admin/admin-ajax.php?action=GetMyLootsCache'`
from a genuinely clean environment (no cookie jar, no prior session —
incognito or a fresh container) and check whether the response still
contains the tester's owned bundles/miniatures, or comes back empty/
generic/errors. Document the actual observed result here once run.

### Open question 2 — pagination

Scrolling `/my-loots/` triggers additional network activity (including a
request to `z.clarity.ms` — likely Microsoft Clarity analytics noise, not
itself a data call, but evidence *something* happens on scroll).

**Status: open — needs live verification.** Cannot be resolved without a
real account with enough owned bundles to trigger pagination (if it exists).
**Exact test to run**: on an account with many owned bundles, compare the
`bundleObjs[]` count returned by a single `GetMyLootsCache` call against the
count visible after fully scrolling `/my-loots/` in a browser. If they
match, the endpoint returns everything in one shot and the scroll behavior
is just front-end virtualization. If the page shows more after scrolling
than the single call returned, pagination exists — capture the exact
request it triggers (page param? cursor? a different endpoint?) via browser
devtools' network tab.

### Navi extraction sketch

For the future Navi-configuration sub-issue (under #1260) to consume
directly:

```yaml
parser:
  type: json_path
  match: bundleObjs
  filter:
    - field: obj_type
      equals: bundle
  fields:
    obj_inid: external_id
    obj_title: name
    obj_slug: slug
    obj_image: photo_candidate
```

(Final field names to reconcile with whatever #1267 settles as the exact
emission payload shape — this sketch uses the names implied by #1262's
contract, mirroring #1266's equivalent sketch for miniature records.)

## Benefits

- Completes the source-side half of the extraction spec, pairing with
  #1266's already-merged collection-side half.
- Surfaces the auth/pagination risk explicitly (with the exact verification
  test to run) rather than leaving it silently assumed, so whoever
  implements the real Navi crawler config knows precisely what to double
  check first.
- Documents the field mapping needed for `Collection.external_id`, matching
  #1262's already-implemented upsert contract.
