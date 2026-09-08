# Crawler Plan: Spec — Emission endpoint & model contract (Lootstudios crawler)

Main plan: [plan.md](plan.md)

## Context

- `docs/agents/specs/loot-crawling/source-to-collections.md` (#1265) and
  `.../collection-to-stl-models.md` (#1266) already finalized the
  `GetMyLootsCache` field mappings for bundles (`Collection`) and miniatures
  (`StlModel`) respectively.
- #1262 (backend crawler-import endpoint, not yet implemented but its
  contract is fully decided) defines `POST /miniatures/stl_models/import.json`
  accepting `name`, `external_id`, `url`, `source_name`, `collection_name`,
  `collection_external_id`, optional `tags`, and a `links` entry — upsert by
  `external_id` then `url`. This is authoritative; do not redesign it.
- This is the **only** emission target — #1262 has no standalone
  Collection-creation call. A `Collection` is only ever created as a
  side-effect of an `StlModel` import that carries `collection_name`/
  `collection_external_id`.

## Implementation Steps

### Step 1 — Draft `docs/agents/specs/loot-crawling/emission-endpoint.md`

Write the new spec page covering:

- A concrete example payload for a miniature record: take a sample
  `GetMyLootsCache` miniature (`obj_title`, `obj_inid`, `bnd_inid`) joined
  with its parent bundle record (`obj_title`, `obj_inid`, `obj_slug`) per
  #1265's join logic, and show the exact JSON body sent to
  `stl_models/import.json`:
  - `name` ← miniature `obj_title`
  - `external_id` ← miniature `obj_inid`
  - `source_name` ← always `"Lootstudios"`
  - `collection_name` ← bundle `obj_title`
  - `collection_external_id` ← bundle `obj_inid`
  - `links` ← `[{ "url": "<bundle/miniature page URL>", "link_type": "lootstudio" }]`
- A "known gap" callout: a bundle with zero currently-owned miniatures
  produces no emission and therefore no `Collection` row in Majora, since
  #1262 has no standalone Collection-only creation call. State this as a
  documented limitation of the current design, not a decision made by this
  spec, and explicitly note it is out of scope to fix (that would mean
  redesigning #1262).
- A no-op note on delisted/removed items: since #1262's contract has no
  delete/deactivate semantics, an item absent from a future
  `GetMyLootsCache` response is simply not re-emitted; its existing Majora
  row is left untouched. No deletion or flagging behavior exists today.
- A Navi `emit.body_template` sketch (per
  `docs/agents/external/navi/emit-configuration.md`'s `{:key}`/`{:.}` token
  syntax) turning the extracted miniature item directly into the body above
  — precise enough for the future Navi-configuration sub-issue to copy
  as-is. Reconcile field names with the sketches already in
  `source-to-collections.md` and `collection-to-stl-models.md` (both flagged
  their own sketches as "subject to reconciliation with #1267").
- A note on request pacing/headers for the *extraction* side against
  `app.lootstudios.com` (flat `403`s were observed on direct fetch attempts,
  likely bot protection) — recommend realistic browser-like headers and
  avoiding hammering the site. Cross-reference from the future run-plan
  sub-issue of #1260. Make clear this is about the GET/extraction side, not
  the POST/emission side against Majora's own backend.

### Step 2 — Link the new page from the spec index

Add an entry for `emission-endpoint.md` under `docs/agents/specs/loot-crawling.md`'s
"Aspect pages" list, alongside the two existing sibling pages.

## Files to Change

- `docs/agents/specs/loot-crawling/emission-endpoint.md` — new file (Step 1)
- `docs/agents/specs/loot-crawling.md` — add a link to the new page (Step 2)

## CI Checks

- repo root: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- Reconcile the Navi sketch's field names against the two sibling pages'
  own sketches (`source-to-collections.md`, `collection-to-stl-models.md`)
  — both explicitly deferred final naming to this spec.
- Do not attempt to close the "zero-miniature bundle" gap or redesign
  #1262's contract — both are explicitly out of scope per the issue.
