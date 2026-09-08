# Emission endpoint & model contract (Lootstudios crawler)

How the fields extracted by the two sibling pages — bundle records
(`source-to-collections.md`, #1265) and miniature records
(`collection-to-stl-models.md`, #1266) — get joined and turned into the
exact request body sent to Majora's crawler-import endpoint (#1262). This
page also settles the field names both sibling sketches flagged as
"subject to reconciliation with #1267."

## The emission target

`POST /miniatures/stl_models/import.json` (#1262 — contract decided, not
yet implemented) is the **only** emission target for this crawler. Its
request body accepts:

| Field | Required | Description |
| --- | --- | --- |
| `name` | yes | The `StlModel`'s name. |
| `external_id` | yes | Stable per-model id used for upsert matching. |
| `url` | no | The model's own page URL, if any. |
| `source_name` | yes | The `Source` this model was crawled from. |
| `collection_name` | no | The `Collection` (bundle) this model belongs to. |
| `collection_external_id` | no | Stable per-bundle id, propagated to the `Collection` row created/matched as a side effect. |
| `tags` | no | Optional tag list. |
| `links` | no | A list of link entries (`url`, `link_type`, ...) attached to the `StlModel`. |

Upsert order: match by `external_id` first, then by `url`. There is **no
standalone Collection-creation call** — a `Collection` only ever comes into
existence as a side effect of an `StlModel` import that carries
`collection_name`/`collection_external_id`. This contract is authoritative
and out of scope to redesign here.

## Example payload

Joining a sample `GetMyLootsCache` miniature record with its parent bundle
record (per #1265's join logic — miniature `bnd_inid` matches bundle
`obj_inid`):

Miniature record (`obj_type: "miniature"`):

```json
{
  "obj_title": "Maggio, Chainstrike Turtle",
  "obj_inid": "FN2608AC01",
  "bnd_inid": "F2608S14E02"
}
```

Parent bundle record (`obj_type: "bundle"`, matched via
`bnd_inid == obj_inid`):

```json
{
  "obj_title": "Tidal Aberrations",
  "obj_inid": "F2608S14E02",
  "obj_slug": "tidal-aberrations"
}
```

Exact JSON body sent to `stl_models/import.json`:

```json
{
  "name": "Maggio, Chainstrike Turtle",
  "external_id": "FN2608AC01",
  "source_name": "Lootstudios",
  "collection_name": "Tidal Aberrations",
  "collection_external_id": "F2608S14E02",
  "links": [
    {
      "url": "https://app.lootstudios.com/bundle/tidal-aberrations/",
      "link_type": "lootstudio"
    }
  ]
}
```

Field derivation:

- `name` ← miniature `obj_title`.
- `external_id` ← miniature `obj_inid`.
- `source_name` ← always the literal `"Lootstudios"`.
- `collection_name` ← bundle `obj_title`.
- `collection_external_id` ← bundle `obj_inid`.
- `links` ← a single-entry array: `{ "url": "<bundle/miniature page URL>",
  "link_type": "lootstudio" }`. The bundle URL is built from the bundle's
  `obj_slug` (`https://app.lootstudios.com/bundle/<obj_slug>/`), per
  #1265's mapping — there is no per-miniature page URL surfaced by
  `GetMyLootsCache`, so the bundle page is the best available link target.

`url` and `tags` are omitted from this example: `GetMyLootsCache`'s
miniature records don't surface a per-miniature page URL, and no tag
source has been identified yet.

## Known gap — zero-miniature bundles produce no Collection

A bundle with zero currently-owned miniatures produces no `StlModel`
emission, and therefore no `Collection` row in Majora, since #1262 has no
standalone Collection-only creation call. This is a documented **limitation
of the current design**, not a decision made by this spec. It is explicitly
**out of scope** to fix here — closing it would mean redesigning #1262's
contract (e.g. adding a standalone Collection-import endpoint), which is a
separate concern.

## No-op note — delisted/removed items

#1262's contract has no delete/deactivate semantics. An item absent from a
future `GetMyLootsCache` response is simply not re-emitted on the next
crawl; its existing Majora row (if one was previously created) is left
untouched. There is no deletion or flagging behavior today — this mirrors
the "delisted/removed items" edge case #1266 flagged as open/unverified
and has no import-time implications beyond "don't emit it."

## Navi `emit.body_template` sketch

Per `docs/agents/external/navi/emit-configuration.md`'s `{:key}`/`{:.}`
token syntax, turning an extracted miniature item (already joined with its
parent bundle's `Collection` fields, per #1265/#1266's extraction sketches)
directly into the body shown above:

```yaml
emit:
  client: majora_api
  method: POST
  url: /miniatures/stl_models/import.json
  status: 200
  body_template:
    name: "{:name}"
    external_id: "{:external_id}"
    source_name: Lootstudios
    collection_name: "{:collection_name}"
    collection_external_id: "{:collection_external_id}"
    links:
      - url: "{:bundle_url}"
        link_type: lootstudio
```

This settles the field names both sibling sketches flagged as "subject to
reconciliation with #1267": the extracted item feeding this template is
expected to expose `name`, `external_id`, `collection_name`,
`collection_external_id`, and `bundle_url` — reconciling #1265's
`obj_title`/`obj_inid`/`obj_slug` → `name`/`slug`/`photo_candidate` sketch
and #1266's `obj_title`/`obj_inid`/`obj_post_id`/`bnd_inid` →
`name`/`external_id`/`post_id`/`collection_external_id` sketch onto this
single set of names. In particular:

- #1265's bundle-side `name` becomes this template's `collection_name`
  when the bundle is joined onto its miniatures (the bundle's own `name` is
  only used directly by a hypothetical future standalone Collection call,
  which doesn't exist per the "known gap" above).
- #1266's `collection_external_id` (renamed from `bnd_inid`) is reused
  as-is here.
- `bundle_url` is a value produced by the join step from the bundle's
  `slug` (#1265), not a field present on either raw record — the future
  Navi-configuration sub-issue needs to compute it (e.g. via a
  transform/template step ahead of this `emit`) rather than expect it
  verbatim on the miniature record.

## Request pacing/headers — extraction side only

This note concerns the **GET/extraction** requests against
`app.lootstudios.com` (e.g. `GetMyLootsCache`, `Load_ObjectExplorer`, bundle
page fetches) — **not** the POST/emission requests against Majora's own
backend described above, which have no such restriction.

Direct fetch attempts against `app.lootstudios.com` without browser-like
headers were observed to return a flat `403`, likely bot protection.
Recommendation for the future run-plan sub-issue of #1260: send
realistic browser-like headers (`User-Agent`, `Accept`, `Accept-Language`,
etc. matching a real browser session) on every extraction request, and
avoid hammering the site (space out requests, cache `GetMyLootsCache`'s
single response across a whole crawl run rather than re-fetching it per
bundle — per #1266's Approach A, one call already covers every owned
bundle and miniature). Cross-reference this note from that sub-issue when
it defines the crawler's actual Navi client/retry/cooldown configuration.
