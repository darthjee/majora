# Issue: Improve miniature/stl_model

## Description

Expand `miniatures.StlModel` with two new attributes (`url`, `size`), grow the `race` constant list, and convert both `race` and `role` from single-value fields into arrays — mirroring the existing `tags`/`sources`/`collections` multi-value pattern already used on `StlModel`. The creation/edit form and the show/detail page are updated to match.

## Problem

- `StlModel` has no `url` (link to the model's external listing, e.g. MyMiniFactory/Thingiverse/Patreon) and no `size` attribute, even though `Collection` already has an equivalent `url` field.
- The `race` constant list only covers 11 classic fantasy races (human, elf, dwarf, …), missing broader categories relevant to a wider range of miniatures (Turtlefolk, Construct, Undead, Dragon, Cyborg, …).
- `race` and `role` are both single-value fields, so a miniature that genuinely fits more than one race or role (e.g. a dragonborn barbarian who is also arguably a beast-type model, or a model usable as both a rogue and an archer) can't be tagged accurately.

## Expected Behavior

- `StlModel` has a `url` field (like `Collection.url`) and a `size` field (`tiny`, `small`, `medium`, `huge`, `gargantuan`, `life`), both optional.
- The `race` constant list grows from 11 to 29 values: the existing 11 plus Turtlefolk, Cthulhufolk, Humanoid, Construct, Monstrosity, Undead, Aberration, Beast, Alien, Fiend, Fey, Giant, Dragon, Celestial, Elemental, Cyborg, Plant, Ooze.
- `race` and `role` become arrays: a single `StlModel` can be tagged with multiple races and multiple roles.
- The stl_model creation/edit form lets users pick multiple races and roles via a search-style picker (not a plain single-select dropdown), constrained to the known constant values (no free-text creation, unlike tags).
- The `StlModel` show/detail page displays `url`, `size`, and the race/role arrays.

## Solution

**`url` field**
- Mirrors `Collection.url` exactly: `CharField(max_length=200, unique=True, null=True, blank=True, default=None)` (the `default=None` avoids empty-string collisions under `unique=True`, same reasoning as `Collection`).
- Unlike `Collection.url`, this new field also gets format validation (Django `URLField`/`URLValidator`, restricted to `http`/`https`) to prevent a stored `javascript:` URI from being rendered as a clickable link (stored XSS) on the show page. Retrofitting the same validation onto `Collection.url`/`Source.url` is tracked as a separate follow-up issue.

**`size` field**
- Plain `CharField` with fixed choices, same style as `type`/`race`/`role` — not an orderable/integer field, since nothing here requires range filtering ("at least medium"), and `life` (life-sized) doesn't cleanly fit a linear tiny→gargantuan scale anyway.
- Optional (`null=True, blank=True`), matching `race`/`role`'s current nullability, not required like `type`.

**Race list**
- Additive, not a replacement: the 18 new values are added to the existing 11, for 29 total. Existing `StlModel.race` data migrates cleanly with no loss or remapping.

**`race`/`role` become arrays**
- Implemented as dedicated join tables — `StlModelRace(id, stl_model FK, creature: CharField(choices=RACE_CHOICES))` and `StlModelRole(id, stl_model FK, role: CharField(choices=ROLE_CHOICES))` — each with a `unique_together` constraint on `(stl_model, creature)` / `(stl_model, role)` to reject duplicate entries.
- No separate `Race`/`Role` lookup table is created, unlike the `Tag` M2M pattern: race/role values are a fixed constant set validated at the app layer, not a user-manageable/free-typed set like tags, so a real lookup table would be unnecessary overhead.
- A data migration copies existing `StlModel.race`/`role` scalar values into the new join tables before the old columns are dropped. `HistoricalStlModel` records for `race`/`role` are wiped rather than carefully migrated (acceptable, deliberate data loss).
- API fields rename from singular `race`/`role` to plural `races`/`roles` across the create/update/detail serializers, making the shape change explicit. No external consumers of this API exist beyond the bundled frontend (single monorepo, deployed in lockstep), so this breaking rename needs no transition/dual-write period.

**Creation/edit form**
- Currently uses `EnumSelectField` (plain single-select) for race/role — must become a multi-select/search-style picker for both.
- Reuse and generalize the existing `MultiResourcePickerField`/`ResourcePickerSearch` component (already used for picking `source`, an API-backed resource) to also support a local-constant-array source — race/role values are static and already known client-side via `RACE_VALUES`/`ROLE_VALUES` in `stlModelEnums.js`, so no backend search call is needed for these, just client-side filtering. In this "constant" mode, the picker rejects any value not already in the constant list (no "create new" affordance, unlike the tags picker).

**Show/detail page**
- Update to display the new `url`, `size`, and race/role arrays, not just expose them via the backend and create form.

**Out of scope (tracked as separate follow-up issues)**
- Filters on `/#/miniatures/stl_models` (name/type/race/roles/source/collection/tags/size).
- Retrofitting URL format validation onto other existing URL fields (`Collection.url`, `Source.url`, etc.).

**Performance note for later**: race/role are only exposed on the detail (single-record) serializer here, not the list serializer, so N+1 query risk from the new join tables is negligible at this scope. If a future filters issue exposes race/role/tags on the *list* serializer, `prefetch_related` will matter then.

## Benefits

- More accurate cataloging: miniatures can be tagged with every race/role they genuinely fit, instead of being forced into one.
- Broader, more useful race taxonomy covering non-classic-fantasy miniature types (constructs, undead, aliens, cyborgs, etc.).
- Direct links back to the source listing for each miniature, matching what's already available for collections.
- Size classification supports future organization/planning use cases (e.g. print bed sizing, storage).
- Lays the groundwork (generalized picker component, richer detail data) for the follow-up filters issue.
