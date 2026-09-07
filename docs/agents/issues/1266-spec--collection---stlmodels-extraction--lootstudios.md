# Issue: Spec: Collection → StlModels extraction (Lootstudios)

## Description

Sub-issue of #1261 (Explore & document the Lootstudios API), itself a
sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler). Part
of the `docs/agents/specs/loot-crawling.md` spec split. **Depends on the
sibling "Source → Collections extraction" sub-issue (#1265)** — its resolved
pagination answer determines whether per-bundle miniature extraction here
also needs to handle pagination. Feeds "Emission endpoint & model contract"
(#1267), which depends on both this issue and #1265.

## Problem

There is no documented, verified reference for how to go from a Lootstudios
collection (bundle) to the list of STL models (miniatures) it contains,
mapped onto Majora's `StlModel` concept. #1265 covers extracting the
collections themselves; this issue covers the next step down. Three
extraction approaches exist for this, with different auth requirements and
reliability trade-offs, and none has a finalized field mapping onto
`StlModel` — including the new `external_id` field #1262 already added —
written down anywhere durable yet.

## Expected Behavior

`docs/agents/specs/loot-crawling/collection-to-stl-models.md` exists, linked
from the `docs/agents/specs/loot-crawling.md` hub, and documents:

- The finalized miniature-record → `StlModel` field mapping, including the
  `bnd_inid` join back to `Collection` (from #1265).
- Approaches B and C (below), fully documented as fallbacks — auth, headers,
  request/response flow — with enough detail to implement from directly.
- The delisted-item and session-expiry edge cases (below), investigated
  against the live site and documented with their actual observed behavior,
  not left as open questions.
- A Navi extraction sketch (parser type, `match`, `filter`, `fields`)
  precise enough for the future Navi-configuration sub-issue (under #1260,
  not #1261) to turn directly into a working config, without redoing this
  research.

## Solution

### Approach A — `GetMyLootsCache` miniature records (primary)

The same `GET /wp-admin/admin-ajax.php?action=GetMyLootsCache` call covered
by #1265 (which documents the bundle/`Collection` side and the open
auth/pagination questions) also returns miniature records in the same flat
`bundleObjs[]` array, distinguished by `obj_type: "miniature"`:

| Field | Description |
| --- | --- |
| `obj_post_id` | Numeric WordPress post id. |
| `obj_inid` | Stable per-model external id (e.g. `FN2608AC01`). |
| `bnd_inid` | The parent bundle's `obj_inid` — the join key back to #1265's `Collection` records. |
| `bnd_title` | Parent bundle's title (denormalized; use the joined `Collection` from #1265 as the source of truth, not this). |
| `obj_title` | The miniature's name. |

Maps onto Majora's `StlModel` (`docs/guides/majora/miniatures.md`):
`obj_title` → `name`, `obj_inid` → `external_id` (the field #1262 added — see
#1262 and the sibling "Model changes" sub-issue, #1268, for the rationale).

**Algorithm** (verified working, given a bundle's URL slug):

1. Fetch `GetMyLootsCache` once — no separate request per bundle.
2. Find the `obj_type == "bundle"` record whose `obj_slug` matches the target
   slug (e.g. `tidal-aberrations`) → read its `obj_inid` (e.g.
   `F2608S14E02`).
3. Filter all `obj_type == "miniature"` records where `bnd_inid` equals that
   bundle's `obj_inid`.
4. Each match's `obj_inid`/`obj_title`/`obj_post_id` is one `StlModel` to
   import, associated with that bundle's `Collection`.

**Verified example** — bundle `tidal-aberrations` (`obj_inid`
`F2608S14E02`), 28 miniatures, first/last few:

```
FN2608AC01 — Maggio, Chainstrike Turtle       (post_id: 880438)
FN2608AC02 — Captain Edward "Bones"           (post_id: 880439)
FN2608AC03 — Siraphin, Hammer of Storms       (post_id: 880440)
...
FN2608AO10 — Rusty Lamp – FDM                 (post_id: 880465)
```

There is **no separate per-collection request** — every owned bundle's
miniatures come back in the one `GetMyLootsCache` call; "collection →
StlModels" is a filter over that response, not a second HTTP round trip.

### Approach B — `Load_ObjectExplorer` (fallback)

The request the browser actually makes when loading a bundle page directly.
Requires an authenticated session and two round trips:

1. `GET https://app.lootstudios.com/bundle/<slug>/?logged-in` with the
   session cookie — scrape the bundle's numeric WordPress post id (`bndId`)
   out of the page HTML. It appears in the `<body class="... postid-<id>
   ...">` attribute; a `postid-(\d+)` regex extracts it (fall back to a
   `bndId["\s:=]+["']?(\d{5,})` regex if the body-class form isn't present).
2. `POST https://app.lootstudios.com/wp-admin/admin-ajax.php` with body
   `action=Load_ObjectExplorer&bndId=<id>&mntId=0&objType=bundle` and
   headers:
   ```
   Content-Type: application/x-www-form-urlencoded; charset=UTF-8
   X-Requested-With: XMLHttpRequest
   Origin: https://app.lootstudios.com
   Referer: https://app.lootstudios.com/bundle/<slug>/?logged-in
   Cookie: PHPSESSID=<session_id>
   ```
   Returns an HTML fragment containing one `<div inid="FN2608AC01"
   type="miniature">` element per StlModel in that bundle — parse out every
   `inid` attribute.

Richer to implement (HTML parsing, two requests, per-bundle, needs a live
session) than Approach A — use only if A turns out to be insufficient (e.g.
#1265's auth check finds `GetMyLootsCache` doesn't actually work
unauthenticated, or it stops returning full data).

### Approach C — image URL parsing (thinnest fallback)

A bundle page's `<img>` tags reference asset URLs of the form:

```
https://assets.loot-studios.com/app/<BundleName>/<INID>.png
```

Regex `assets\.loot-studios\.com/app/[^/]+/([A-Z0-9]+)\.png` against every
`<img src>` on `GET /bundle/<slug>/?logged-in` extracts the set of
`obj_inid`s directly. Simplest (one request, no POST, no HTML-fragment
parsing), but yields only the id — no title, no post id, no other metadata.
Last resort if both A and B are unavailable.

### Comparison

| Approach | Auth needed | Data returned | Requests | Reliability |
| --- | --- | --- | --- | --- |
| A — `GetMyLootsCache` | none observed (open question, #1265) | rich JSON, full catalog (all bundles + miniatures) | 1 | high |
| B — `Load_ObjectExplorer` | session cookie (`PHPSESSID`) | HTML fragment, one bundle's miniatures | 2 | medium |
| C — image URLs | partial (page load) | id only, no metadata | 1 | medium |

**Recommended primary: Approach A.** B is the documented fallback if A's
scope turns out to be more limited than it appears; C is the last resort.

### Edge cases

- **Delisted/removed items**: investigate and document what a bundle or
  miniature the account no longer owns (or that Lootstudios has removed
  entirely) actually looks like in `GetMyLootsCache`'s response — absent
  from `bundleObjs[]` entirely, present with a different `obj_type`/flag, or
  something else. Determines whether the crawler needs explicit
  "no-longer-present" handling on re-crawl (e.g. leaving the existing
  Majora `StlModel` alone vs. flagging it) — call this out for #1267
  (emission contract) if it has import-time implications.
- **Session expiry mid-crawl**: Approaches B and C both depend on a
  `PHPSESSID` session that can expire during a run. Document the observed
  response (status code / body shape) when the session has expired, so a
  future crawler implementation can detect it distinctly from a genuine
  "not found."

### Navi extraction sketch

For the future Navi-configuration sub-issue (under #1260) to consume
directly — not implemented here, just specified precisely enough to copy:

```yaml
parser:
  type: json_path
  match: bundleObjs
  filter:
    - field: obj_type
      equals: miniature
  fields:
    obj_inid: external_id
    obj_title: name
    obj_post_id: post_id
    bnd_inid: collection_external_id
```

(Final field names to reconcile with whatever #1267 settles as the exact
emission payload shape — this sketch uses the names implied by #1262's
contract.)

## Benefits

- Removes duplicated research for whoever eventually writes the Navi crawler
  config (#1260's own "Navi configuration" sub-issue) — the extraction
  shape, field mapping, and fallback paths are already worked out and
  verified here.
- Gives `StlModel` a finalized, durable mapping for the new `external_id`
  field (#1262), so imports are correctly deduplicated from day one instead
  of needing a later fix-up.
- Documents two fallback extraction paths (B, C) up front, so a future
  break in the primary approach (A) doesn't block the whole crawler effort
  while someone re-derives an alternative from scratch.
