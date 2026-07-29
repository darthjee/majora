# Issue: Reduce `access-control` docs to principles + deviations only

## Description
#900 condensed prose and removed issue-number citations across `docs/agents/access-control/`,
but every per-resource file still restates the same default CRUD/permission table and the same
hidden/private-field visibility boilerplate. This issue codifies those repeated shapes as named
defaults in `principles.md`, then rewrites every per-resource file to state only where it
*deviates* from them.

## Problem
- Nearly every resource file repeats a near-identical CRUD table (List/Detail `AllowAny`,
  Create/Update `<Resource>Edit`, Delete superuser-only via Django admin) even when nothing about
  that resource deviates from it.
- Six-plus sub-resource files (`character-item.md`, `game-item.md`, `character-document.md`,
  `game-document.md`, `character-treasure.md`, `game-treasure.md`, photo docs) each restate the
  same shape almost verbatim: a lean public `list.json`/`detail.json` that excludes hidden rows
  and omits the `hidden` field, paired with a restricted `all.json`/`full.json` that includes
  hidden rows and exposes `hidden`.
- `private_x`/`public_x` pairing, "ids are always readable and never client-writable," and the
  NPC `hidden`/`incognito` cascade onto nested sub-resources are each re-derived inline per file
  instead of defined once.

## Solution
1. Add to `principles.md`:
   - **Default resource CRUD pattern**: List/Detail → `AllowAny`; Create/Update → the resource's
     own `<Resource>Edit` permission; Delete → superuser-only, via Django admin, never an API
     route.
   - **Default hidden-gated collection pattern**: plain `list`/`detail` excludes hidden rows and
     omits `hidden`; `all`/`full` includes hidden rows and exposes `hidden`; Create/Update gated
     by the resource's own `*CreatePermission`.
   - **Field-naming conventions**: `private_x` (full/edit route only, both read and write, paired
     with `public_x`); `id`/`<related>_id` (always readable by anyone, never accepted in a
     create/update payload — always server-assigned); `hidden` (restricted-only field + row
     filter, per the collection pattern above); `incognito` (same restricted-visibility
     treatment, `Character`-specific, and cascades to gate that character's own nested
     sub-resources — cascade stated once, referenced wherever it applies).
2. Rewrite every per-resource file: where a resource matches a default with no deviation,
   replace its table with a one-line "follows the default `X` pattern
   (`principles.md#...`); no deviations" statement. Where it deviates, keep only the deviation
   (e.g. `character-item.md` keeps `available.json`/`acquire.json`/`remove.json` and the
   `GameItem`-fallback resolution, drops the restated plain/all/full table). "Exposed fields"/
   "Write fields" listings stay, but drop restating id-write-restriction and hidden/private
   visibility per endpoint — reference the new conventions instead.
3. No code changes — documentation only, same constraint as #900.

## What this issue is not about
- No further splitting/merging of files — same file set as today.
- No change to actual access-control behavior or code, only how it's described.
- Not reopening #900's scope (citations/prose) — that already landed; this targets the
  default-pattern/field-convention duplication that's left.

## Benefits
- Every resource file reads as "what's different here," not "everything, restated."
- The defaults become an enforceable contract — a new resource either matches them or documents
  why it doesn't.
- Should cut meaningfully below the current ~2500 lines/25 files, especially the six sub-resource
  files.
