# Plan: Reduce more the docs in `docs/agents/access-control/`

Issue: [904-reduce-more-the-docs-in--docs-agents-access-control-.md](../issues/904-reduce-more-the-docs-in--docs-agents-access-control-.md)

## Overview
This is a documentation-only pass over `docs/agents/access-control/` (27 files, ~2570 lines).
`principles.md` gains five new/expanded named conventions (resource categories, role/scope
grants, the universal `X-Skip-Cache` rule, the filter-visibility rule, and list/show field-set
defaults). Every other file in the folder is then rewritten to state only endpoints, roles, and
*deviations* from those conventions — dropping serializer class names, backend file paths, and
query/migration mechanics that duplicate what the code already documents. Any doc/code mismatch
noticed while rewriting a file is corrected in the same pass. No agent split: this issue never
touches `backend/`, `frontend/`, or `proxy/` — see the issue's "What this issue is not about".

## Context
#900 and #902 already pushed this doc set toward a principles-plus-deviations shape, but
resource files (especially `character.md` at 395 lines) still restate implementation detail —
e.g. exact serializer/permission class names, file paths, queryset/migration internals — that is
only useful when already reading the code, and drifts out of sync with it over time. This issue
trusts the code as the source of truth for that detail and leans harder on `principles.md` so
resource files only need to say what's specific to them.

## Implementation Steps

### Step 1 — Strengthen `principles.md`
Add, as new sections (alongside the existing "Source of truth & access levels", "Partial vs full
access pattern", "Default resource CRUD pattern", "Default hidden-gated collection pattern",
"Field-naming conventions"):

- **Resource categories** — modeled after `frontend/assets/js/utils/requests/resourceConfig.js`'s
  resource list: *Game resources* (`/games/<slug>/...` — DM/superuser get full/private access,
  players of that game get regular mutation access), *Staff resources* (`/staff/...` — admin/staff
  only, full access), *Account resources* (a user has full access to their own account, except no
  user may write `is_superadmin`/`is_staff` on themselves — note today's endpoints aren't all
  actually under `/account/...` yet; that gap is noted, not fixed), *Sensitive-information
  resources* (fields like email/avatar — never `AllowAny`, only players in the relevant context or
  staff/admin).
- **Endpoint/role scope** — explicit statement that superuser reaches all pages/endpoints; `dm`
  reaches all pages/endpoints scoped to the game they DM; `player` reaches every regular
  (`GET` + mutation) endpoint scoped to the game(s) they play in; only `admin`/`staff` reach
  `DELETE` endpoints.
- **`X-Skip-Cache` rule** — named once: any endpoint not open to `AllowAny` always sets
  `X-Skip-Cache: true`, and every staff/account endpoint does too (including staff-account edit
  endpoints), regardless of caller.
- **Filter-visibility rule** — a regular (non-restricted) endpoint never accepts a filter on a
  `hidden`, `incognito`, or `private_*` attribute; a restricted endpoint accepts every filter the
  regular one accepts, plus filters on the restricted-only attributes.
- **List/show serializer defaults** — unless a file states otherwise: list endpoints return a
  smaller field set than show endpoints, are paginated, and treat every filter as optional; a
  regular endpoint's exposed fields are always a subset of the equivalent restricted endpoint's.
  Also name the list-field convention explicitly: `id`, a name/identification field, the
  parent-connection field (e.g. `game_slug`), a photo URL field, and whatever badge fields a
  specific resource needs — a resource file only needs to state the badge-field exceptions.

Use `character.md`'s example rewrite in the issue as the calibration target for how much a
resource file should shrink once it can lean on these.

### Step 2 — Rewrite the core game/character resource files
Reduce these to endpoint tables + roles + deviations, dropping restated serializer/permission
class names, file paths, and query mechanics (still verifiable by reading the code):
- `game.md`, `character.md` (flagship rewrite — match the issue's example shape), `treasure.md`,
  `game-session.md`, `game-session-message.md`, `poll.md`, `task.md`, `player.md`, `conversation.md`.

### Step 3 — Rewrite the sub-resource (item/document/treasure) family
These six files repeat the [default hidden-gated collection
pattern](../access-control/principles.md#default-hidden-gated-collection-pattern) almost
verbatim; keep only what's specific to each (fallback resolution, acquire/remove, stock-cap,
incognito cascade, etc.), collapsing the restated plain/all/full shape to a one-line reference:
- `game-item.md`, `character-item.md`, `game-document.md`, `character-document.md`,
  `game-treasure.md`, `character-treasure.md`.

### Step 4 — Rewrite the photo/upload/link family
- `game-photo.md`, `character-photo.md`, `character-link.md`, `link.md`, `upload.md` — keep the
  endpoint/role tables and any resource-specific upload-flow deviation (e.g. `GameDocumentFile`'s
  chained photo upload), drop restated storage-path/class-name detail available in code.

### Step 5 — Rewrite the remaining standalone files
- `user.md`, `user-roles.md`, `common-rules.md`, `endpoints.md`, `staff-cache.md`,
  `versioning.md` — apply the same trim; `common-rules.md`/`user-roles.md`/`endpoints.md` may
  shrink the least since they're already mostly tables of named rules, but still drop any
  restated file-path/mechanics prose that principles.md's new sections now cover.

### Step 6 — Fix any doc/code mismatch found along the way
While rewriting each file (Steps 2–5), if the current doc text contradicts what the code actually
does, correct it in the same pass — still documentation-only, no behavior change.

### Step 7 — Sanity pass
Re-read every rewritten file against `principles.md`, confirming each resource states only its
deviations and that no rewritten file accidentally drops an access rule that has no principle to
fall back on. Recompute total line count across `docs/agents/access-control/` and confirm it is
meaningfully below the current ~2570.

## Files to Change
- `docs/agents/access-control/principles.md` — add the five new/expanded conventions (Step 1)
- `docs/agents/access-control/game.md` — trim to deviations from Step 1 conventions
- `docs/agents/access-control/character.md` — flagship rewrite per the issue's example
- `docs/agents/access-control/treasure.md` — trim to deviations
- `docs/agents/access-control/game-session.md` — trim to deviations
- `docs/agents/access-control/game-session-message.md` — trim to deviations
- `docs/agents/access-control/poll.md` — trim to deviations
- `docs/agents/access-control/task.md` — trim to deviations
- `docs/agents/access-control/player.md` — trim to deviations
- `docs/agents/access-control/conversation.md` — trim to deviations
- `docs/agents/access-control/game-item.md` — collapse restated collection-pattern table
- `docs/agents/access-control/character-item.md` — collapse restated collection-pattern table
- `docs/agents/access-control/game-document.md` — collapse restated collection-pattern table
- `docs/agents/access-control/character-document.md` — collapse restated collection-pattern table
- `docs/agents/access-control/game-treasure.md` — collapse restated collection-pattern table
- `docs/agents/access-control/character-treasure.md` — collapse restated collection-pattern table
- `docs/agents/access-control/game-photo.md` — trim to deviations
- `docs/agents/access-control/character-photo.md` — trim to deviations
- `docs/agents/access-control/character-link.md` — trim to deviations
- `docs/agents/access-control/link.md` — trim to deviations
- `docs/agents/access-control/upload.md` — trim to deviations
- `docs/agents/access-control/user.md` — trim to deviations
- `docs/agents/access-control/user-roles.md` — trim to deviations
- `docs/agents/access-control/common-rules.md` — trim to deviations
- `docs/agents/access-control/endpoints.md` — trim to deviations
- `docs/agents/access-control/staff-cache.md` — trim to deviations
- `docs/agents/access-control/versioning.md` — trim to deviations

## Notes
- No CI job targets `docs/` specifically (checked `.circleci/config.yml`) — no `## CI Checks`
  section needed; this is a pure documentation review, no automated check to run locally.
- Given the size (27 files), this can land as one PR or be split across several commits by
  step/group above — reviewer's call, not a hard requirement.
- Keep every fact currently documented somewhere unless it's now redundant with a named
  principle — the goal is trimming duplication, not dropping access-control facts. When in
  doubt, keep the fact and only drop the restated mechanics/class-name prose around it.
- `endpoints.md`/`common-rules.md`/`user-roles.md` are already fairly lean/tabular; expect a
  smaller cut there than the item/document/treasure family in Step 3.
