# Issue: Spec — Model changes (external_id on StlModel/Collection)

## Description

Sub-issue of #1261 (Explore & document the Lootstudios API), itself a
sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler). Part
of the `docs/agents/specs/loot-crawling.md` spec split. Independent of the
other three sub-issues — it documents a decision already made (in #1262's
contract), so it can be written any time, even in parallel with them.

## Context

`StlModel` upsert was originally going to key on `url` alone (#1262's first
draft). During #1261's exploration it became clear Lootstudios exposes a
genuinely stable per-item external id (`obj_inid`, e.g. `FN2608AC01`) — a
materially better upsert/dedup key than a scraped `url`, which can change if
the source site restructures its URLs without the underlying item changing.
The same reasoning applies to `Collection` (bundles also carry a stable
`obj_inid`) versus matching by `name` alone (a bundle's title could be edited
upstream).

**This was settled directly in #1262's contract, not deferred**: `StlModel`
and `Collection` are each to gain a new `external_id` field (`CharField`,
nullable, blank-allowed, unique — MySQL permits multiple `NULL`s in a unique
column, so items imported without one don't collide), with upsert precedence
`external_id` first, falling back to `url` (`StlModel`) or `name`
(`Collection`). #1262 itself is still open (spec/contract decided, backend
implementation and migration not yet written) — see #1262 for the exact
contract; this sub-issue does not redesign it, and does not claim the
migration already exists.

## Expected outcome

`docs/agents/specs/loot-crawling/model-changes.md`, linked from
`docs/agents/specs/loot-crawling.md`, documenting — as the durable spec-level
explanation, so this reasoning doesn't only live buried in an implementation
issue's history:

- **Why** `external_id` exists: the `url`/`name`-fragility problem above.
- **What** is changing: `StlModel.external_id` and `Collection.external_id`
  (nullable, unique `CharField`), with a pointer to #1262 as the contract
  source of truth for the exact field design (the migration itself lands
  when #1262 is implemented, not as part of this documentation issue).
- **Known limitation**, carried over from #1262: a bare unique `external_id`
  could collide across sources with different id schemes if a second,
  unrelated crawler source is ever added — not solved now, since Lootstudios
  is the only source, but flagged so it isn't forgotten.

## Explicitly out of scope

- Any backend changes — #1262 owns the actual model/migration/endpoint
  implementation; this sub-issue is purely explanatory documentation of the
  already-decided contract.
- The crawler-side mapping that populates these fields — the sibling
  "Emission endpoint & model contract" sub-issue (#1267,
  `docs/agents/specs/loot-crawling/emission-endpoint.md`).

## Acceptance criteria

- [ ] `docs/agents/specs/loot-crawling/model-changes.md` exists and is linked
      from `docs/agents/specs/loot-crawling.md`
- [ ] Explains the `url`/`name`-fragility rationale and cross-references
      #1262 as the contract source of truth (without implying the migration
      has already landed)
- [ ] Notes the cross-source collision limitation

Owned by: `crawler`.
