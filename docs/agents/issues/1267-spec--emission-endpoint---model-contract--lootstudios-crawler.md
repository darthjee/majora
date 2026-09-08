# Issue: Spec — Emission endpoint & model contract (Lootstudios crawler)

## Description

Sub-issue of #1261 (Explore & document the Lootstudios API), itself a
sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler). Part
of the `docs/agents/specs/loot-crawling.md` spec split. **Depends on both
sibling sub-issues** — "Source → Collections extraction" (#1265, merged) and
"Collection → StlModels extraction" (#1266, merged) — since it maps their
finalized field mappings onto the concrete request shape the crawler will
emit.

## Context

#1262 (backend crawler-import endpoint) already defines and implements the
Majora-side contract: `POST /miniatures/stl_models/import.json` (or similar),
accepting `name`, `external_id`, `url`, `source_name`, `collection_name`,
`collection_external_id`, plus optional fields like `tags` — with upsert
semantics keyed on `external_id` first, falling back to `url`/`name`. See
#1262 for the full, authoritative endpoint contract; this sub-issue does not
redesign it.

What's still missing is the **crawler-side mapping**: given a raw
`GetMyLootsCache` bundle or miniature record (per the sibling sub-issues'
finalized field mappings — `docs/agents/specs/loot-crawling/source-to-collections.md`
and `.../collection-to-stl-models.md`), what exactly does the emitted request
body look like?

**Important scope note surfaced during this discussion**: #1262's endpoint
only ever creates/updates an `StlModel`. It has no standalone "create this
Collection" call — a `Collection` is only ever created/matched as a
side-effect of importing an `StlModel` that carries `collection_name`/
`collection_external_id`. This means the crawler has exactly **one** emission
target, not two. A bundle with zero currently-owned miniatures would never
produce any emission at all (there being no `StlModel` to attach it to), so
it would never get a `Collection` row created in Majora. This is a known gap
in the overall design — flagged in the new spec doc as a limitation, not
solved here, consistent with this sub-issue's explicit non-goal of
redesigning #1262's contract.

## Expected outcome

`docs/agents/specs/loot-crawling/emission-endpoint.md`, linked from
`docs/agents/specs/loot-crawling.md`, covering:

- **Concrete example payload** for a miniature record: given a
  `GetMyLootsCache` miniature item (`obj_title`, `obj_inid`, `bnd_inid`,
  `bnd_title`, ...) and its resolved parent bundle (from #1265), the exact
  JSON body sent to #1262's `stl_models/import.json` endpoint — `name`,
  `external_id`, `source_name` (always `"Lootstudios"`), `collection_name`,
  `collection_external_id`, and a `links` entry (`link_type: "lootstudio"`)
  pointing back at the bundle/miniature page. This is the **only** emission
  target — see the Context section's gap note on why there is no separate
  Collection-only payload.
- An explicit **"known gap" callout**: since #1262 has no standalone
  Collection-creation call, a bundle that currently owns zero miniatures
  produces no emission and therefore no `Collection` row in Majora. Document
  this plainly as a limitation of the current design (not a new decision made
  by this spec), rather than silently omitting it.
- A **no-op note on delisted/removed items**: per
  `collection-to-stl-models.md`'s flagged edge case, since #1262's contract
  has no delete/deactivate semantics, a re-crawl is purely additive/
  reconciling for items it currently sees. An item that disappears from a
  future `GetMyLootsCache` response (delisted or removed upstream) is simply
  not re-emitted; its existing Majora `StlModel`/`Collection` row is left
  untouched — no deletion, no flagging. This is a direct consequence of
  #1262's contract, not a new decision.
- A Navi `emit.body_template` sketch (per
  `docs/agents/external/navi/emit-configuration.md`'s `{:key}`/`{:.}` token
  syntax) turning the extracted miniature item directly into that body —
  precise enough for the future Navi-configuration sub-issue (under #1260,
  not #1261) to use as-is.
- A note on request pacing/headers: this session's own direct fetch attempts
  against `app.lootstudios.com` returned flat `403`s (likely Cloudflare or
  similar bot protection) — whatever crawler config eventually implements the
  extraction side of this should use realistic browser-like headers and avoid
  hammering the site. Worth cross-referencing from the run-plan sub-issue of
  #1260 too. (This note is about the extraction/GET side against Lootstudios,
  not the emission/POST side against Majora's own backend.)

## Explicitly out of scope

- Redesigning #1262's endpoint contract — already decided there. This
  includes *not* proposing a new standalone Collection-creation
  endpoint/call to close the "zero-miniature bundle" gap noted above; that
  gap is documented, not solved, by this sub-issue.
- Writing the actual Navi config — a separate sub-issue of #1260 (this
  sub-issue produces the sketch it consumes, not the config itself).
- The `external_id` field's rationale — the sibling "Model changes"
  sub-issue owns explaining *why* it exists; this sub-issue just uses it.
- Resolving the still-open/unverified "delisted item" `GetMyLootsCache`
  response shape (#1266's own open edge case) — this spec only documents the
  *import-time consequence* (no-op) given #1262's current contract, not the
  underlying extraction-side unknown.

## Acceptance criteria

- [ ] `docs/agents/specs/loot-crawling/emission-endpoint.md` exists and is
      linked from `docs/agents/specs/loot-crawling.md`
- [ ] A concrete example payload exists for the StlModel emission (the one
      and only emission target under #1262's actual contract), matching
      #1262's field names exactly
- [ ] The "zero-miniature bundle" gap (no standalone Collection-only
      emission target) is explicitly documented as a known limitation
- [ ] The delisted/removed-item behavior is explicitly documented as a no-op
      (existing rows untouched, nothing re-emitted) given #1262's current
      contract
- [ ] A Navi `body_template` sketch is included

Owned by: `crawler`.
