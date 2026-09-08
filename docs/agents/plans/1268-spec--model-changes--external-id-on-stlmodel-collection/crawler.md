# Crawler Plan: Spec — Model changes (external_id on StlModel/Collection)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Write `docs/agents/specs/loot-crawling/model-changes.md`

Create the new spec page, following the structure/tone of the sibling pages
already under `docs/agents/specs/loot-crawling/` (`source-to-collections.md`,
`collection-to-stl-models.md`, `emission-endpoint.md`): short intro
paragraph, then sections. Content, sourced from the refined issue body
(`docs/agents/issues/1268-spec--model-changes--external-id-on-stlmodel-collection.md`):

- **Why**: `StlModel` upsert was originally going to key on `url` alone; a
  scraped `url` is fragile (can change if the source site restructures URLs
  without the underlying item changing). Lootstudios exposes a stable
  per-item id (`obj_inid`, e.g. `FN2608AC01`) — a materially better
  upsert/dedup key. Same reasoning for `Collection` vs. matching by `name`
  alone (a bundle's title can be edited upstream).
- **What**: `StlModel.external_id` and `Collection.external_id` — nullable,
  blank-allowed, unique `CharField` (MySQL allows multiple `NULL`s in a
  unique column). Upsert precedence: `external_id` first, falling back to
  `url` (`StlModel`) or `name` (`Collection`).
- **Important framing, do not overstate**: this field design was **settled
  in #1262's contract**, but #1262 itself is still open — the migration and
  endpoint are not yet implemented as of this writing. Cite #1262 as the
  contract/source-of-truth for the exact field definition, but do not say
  the migration "already exists" or "was added" — say it was "decided" /
  "settled" / "specified". (The original GitHub issue body claimed this was
  already resolved; that was inaccurate and was corrected during
  `discuss-issue` — see the issue file's Context section for the exact
  wording to mirror.)
- **Known limitation**: a bare unique `external_id` could collide across
  sources with different id schemes if a second, unrelated crawler source is
  ever added. Not solved now (Lootstudios is the only source) — flag it so
  it isn't forgotten.

Then link the new page from `docs/agents/specs/loot-crawling.md`'s
"Aspect pages" list, alongside the three existing entries.

### Step 2 — Fix stale "already added" wording in sibling spec pages

Two already-merged sibling pages state or imply #1262 already added the
`external_id` field, which is the same inaccuracy corrected in #1268's issue
body. Since this issue's whole point is establishing the accurate rationale
doc, bring these two references in line with the corrected framing
(minimal wording tweak only, no structural changes):

- `docs/agents/specs/loot-crawling/source-to-collections.md`, line ~27:
  `"obj_inid → external_id (the field #1262 already added — see #1262 and
  #1268 for the rationale)"` → reword to something like `"obj_inid →
  external_id (the field #1262's contract specifies — see #1262 and #1268
  for the rationale)"`.
- `docs/agents/specs/loot-crawling/collection-to-stl-models.md`, lines
  ~25-26: `"obj_inid → external_id (the field #1262 added — see #1262 and
  the sibling "Model changes" sub-issue, #1268, for the rationale)"` →
  reword the same way ("#1262's contract specifies" instead of "added").

## Files to Change

- `docs/agents/specs/loot-crawling/model-changes.md` — new spec page (create).
- `docs/agents/specs/loot-crawling.md` — add a link to the new page under
  "Aspect pages".
- `docs/agents/specs/loot-crawling/source-to-collections.md` — reword one
  "already added" reference to match the corrected framing.
- `docs/agents/specs/loot-crawling/collection-to-stl-models.md` — reword one
  "added" reference to match the corrected framing.

## Notes

- Purely documentation — no backend/frontend/crawler code changes, no
  migration. #1262 remains the owner of the actual model/migration/endpoint
  implementation.
- Do not redesign the `external_id` contract here — this page explains a
  decision already made in #1262, it doesn't revisit it.
