# Source → Collections extraction (Lootstudios)

How to go from the Lootstudios source (the maintainer's owned-loot catalog)
to its list of collections (bundles), mapped onto Majora's `Collection`
concept. The sibling "Collection → StlModels extraction" page
(`collection-to-stl-models.md`, #1266) covers the next step down and reuses
the same `GetMyLootsCache` call.

## Approach A — `GetMyLootsCache` bundle records (only documented approach)

`GET /wp-admin/admin-ajax.php?action=GetMyLootsCache` returns
`{"bundleObjs": [...]}`, a flat JSON array mixing bundle and miniature
records (distinguished by `obj_type`). This page covers the **bundle**
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
#1262's contract specifies — see #1262 and #1268 for the rationale).

**No fallback approach exists for this direction.** #1266's Approaches B/C
are both about listing a *known* bundle's miniatures, not about discovering
the bundle list itself — there is no documented HTML-scraping alternative to
`GetMyLootsCache` for enumerating collections. This is a real gap: if
`GetMyLootsCache` ever becomes unavailable or its auth model changes, there
is currently no fallback. Flagged here as a known limitation rather than
solved — a plausible future fallback would be scraping bundle links directly
out of `/my-loots/`'s rendered HTML, but that's unexplored and out of scope
for this page.

## Open question 1 — does `GetMyLootsCache` actually need no auth?

The endpoint name ("**My** Loots") implies account-scoped, owned-items-only
data, but it was observed to respond with no auth header/cookie passed
explicitly. Either the endpoint is genuinely unscoped/public, or the
original finding carried an ambient session cookie without it being
obvious.

**Status: resolved — no auth required.** Verified with a clean, cookie-less
request (`curl -s 'https://app.lootstudios.com/wp-admin/admin-ajax.php?action=GetMyLootsCache'`)
sent with no cookie jar or prior session. The response came back `HTTP 200`
with a full catalog payload — 398 `bundleObjs` entries and 4967
`miniatureObjs` entries. Every returned bundle's `ft_ownership` field was
`"false"`, confirming this is the general public catalog rather than
account-scoped "my loots" data — the endpoint's name is misleading.

## Open question 2 — pagination

Scrolling `/my-loots/` triggers additional network activity (including a
request to `z.clarity.ms` — likely Microsoft Clarity analytics noise, not
itself a data call, but evidence *something* happens on scroll).

**Status: resolved — no pagination.** The clean `GetMyLootsCache` response
verified above has exactly two top-level keys — `bundleObjs` and
`miniatureObjs` — with no `page`/`cursor`/`total` metadata anywhere, and it
already contained the full catalog (398 bundles) in that single call. The
scroll behavior on `/my-loots/` is therefore front-end virtualization over
one complete response, not evidence of a paginated endpoint.

## Navi extraction sketch

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
