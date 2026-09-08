# Model changes (`external_id` on `StlModel`/`Collection`)

Why the crawler-facing sibling pages (`source-to-collections.md`,
`collection-to-stl-models.md`, `emission-endpoint.md`) all key off an
`external_id` field instead of matching by `url`/`name` alone, and what that
field actually is. This page documents a decision **settled in #1262's
contract**, not a new one made here.

## Why — `url`/`name` are fragile upsert keys

`StlModel` upsert was originally going to key on `url` alone (#1262's first
draft). During #1261's exploration of the Lootstudios API it became clear
Lootstudios exposes a genuinely stable per-item id, `obj_inid` (e.g.
`FN2608AC01`) — a materially better upsert/dedup key than a scraped `url`,
which can change if the source site restructures its URLs without the
underlying item changing.

The same reasoning applies to `Collection`: bundles also carry a stable
`obj_inid`, which is a better match key than `name` alone, since a bundle's
title can be edited upstream without the bundle itself being a different
thing.

## What — the `external_id` field

`StlModel.external_id` and `Collection.external_id`: nullable,
blank-allowed, unique `CharField`s (MySQL allows multiple `NULL`s in a
unique column, so items imported without an external id don't collide with
each other). Upsert precedence is `external_id` first, falling back to
`url` (`StlModel`) or `name` (`Collection`).

This exact field design was **settled directly in #1262's contract** —
#1262 is the authoritative source of truth for the field definition and
upsert precedence. #1262 itself is still open as of this writing: the
contract/spec is decided, but the migration and the `stl_models/import.json`
endpoint it backs are not yet implemented. This page does not claim the
migration already exists or has already been added — only that the field's
design has been decided.

The crawler-side mapping that populates `external_id` (Lootstudios'
`obj_inid` → `external_id`) is covered by the sibling pages
(`source-to-collections.md`, `collection-to-stl-models.md`,
`emission-endpoint.md`), not here.

## Known limitation — cross-source collisions

A bare unique `external_id` (unique across all rows, not scoped per
`Source`) could collide if a second, unrelated crawler source with its own
id scheme is ever added — two different sources could plausibly mint the
same `external_id` string for unrelated items. This is not solved now,
since Lootstudios is the only source in scope, but it's flagged here so it
isn't forgotten if/when a second source is added.
