# Issue: Reduce more the docs in `docs/agents/access-control/`

## Description
#900 and #902 already reduced `docs/agents/access-control/` to a principles-plus-deviations
shape, but the set is still too large (~2570 lines across 26 files as of this writing) — token
cost for any agent that reads this doc set for context is still high. This issue is a further
pass: strengthen `principles.md` with more named conventions, and trust the code more as the
source of truth for implementation detail, so resource-specific files can shrink further.

## Problem
- Resource-specific files still restate implementation detail that's only useful when reading
  the code anyway — serializer class names, backend file paths, queryset/migration mechanics —
  duplicating what the code itself already documents, and drifting out of sync with it over time.
- Several access rules that hold uniformly across (almost) every resource are still re-derived
  per file instead of being named once in `principles.md`: which roles can reach which endpoints
  and under what game scope, the `X-Skip-Cache` requirement for non-public endpoints, list vs.
  show serializer field-set differences, pagination/filter defaults, and the "regular fields are
  a subset of restricted fields" guarantee.
- `principles.md` has no notion of *resource categories* (game resources, staff resources,
  account resources, sensitive-information resources) even though every resource file belongs to
  one, and the category alone predicts most of that file's access shape.

## Solution
1. **Improve `principles.md`** with:
   - A **resource categories** section, modeled after `frontend/assets/js/utils/requests/resourceConfig.js`'s resource list, describing the shared access shape for each category:
     - **Game resources** (paths under `/games/<slug>/...`, e.g. PC, NPC): private/full endpoints for the DM (+ superuser), regular mutation endpoints for players of that game.
     - **Staff resources** (paths under `/staff/...`): admin and staff only, full access.
     - **Account resources** (paths that should live under `/account/...` — noting today's layout doesn't yet fully match, tracked as a known gap, not fixed by this issue): a user has full access over their own account, except no user (regardless of role) can write `is_superadmin`/`is_staff` on themselves (privilege-escalation guard).
     - **Sensitive-information resources** (e.g. fields like email or avatar): never exposed to `AllowAny` — only to players (e.g. in chats/polls) or staff/admin.
   - Endpoint/role clarifications: superuser → all pages and endpoints; `dm` → all pages/endpoints scoped to the game they DM; `player` → all regular (`GET` + mutation) endpoints scoped to the game(s) they play in; only `admin`/`staff` reach `DELETE` endpoints.
   - `X-Skip-Cache: true` as a named, universal rule for (a) any endpoint not open to `AllowAny`, and (b) every staff/account endpoint including staff-account edit endpoints — rather than restating the header per resource file.
   - Filter-visibility rule: a regular (non-restricted) endpoint never accepts a filter on a `hidden`, `incognito`, or `private_*` attribute, even tolerantly/silently — restricted endpoints accept every filter the regular endpoint accepts, plus filters on the restricted-only attributes.
   - List/show serializer defaults: unless a file states otherwise, list endpoints (a) return a smaller field set than show endpoints, (b) are paginated, and (c) treat every accepted filter as optional. And whatever is exposed on a regular endpoint's field set is always a subset of what the equivalent restricted endpoint exposes (never a field regular-only).
   - The list vs. show field-set convention itself: list endpoints return only `id`, a name/identification field, the parent-connection field (e.g. `game_slug`, `game_item_id`), a photo URL field, and whatever extra fields a specific resource needs for its cards/badges (e.g. `public_slain`/`public_allegiance` for Character) — a resource file states only the badge-field exceptions, not the whole list again.
2. **Rewrite every resource-specific file** (all files under `docs/agents/access-control/` other
   than `principles.md` itself) to state only endpoints, roles, and field/filter *deviations*
   from the strengthened principles above — trusting the code (not the doc) for
   serializer/permission-class names, file paths, and query/migration mechanics. `character.md`
   is the flagship example (see below); apply the same treatment to every other file.
3. **Fix inaccuracies found along the way**: if rewriting a file surfaces a mismatch between what
   the doc says and what the code actually does, correct the doc to match the code as part of
   this same pass (still documentation-only — no behavior change).
4. No code changes — documentation only, same constraint as #900/#902.

### Example rewrite (`character.md`)
```md
# Characters (PC and NPC)

Characters are scoped to a game. Access is symmetric for PCs and NPCs unless noted.
As per [principles](docs/agents/access-control/principles.md), endpoints have regular and restricted versions

## Regular access for `GET`
everyone can access

## Regular access for mutation (`POST`, `PUT` and `PATCH`)
`admin`, `staff`, `dm` and `players` can access

## Restricted access for PCs (`GET` and mutations)
`admin`, `dm` and `owners` can access

## Restricted access for NPCs (`GET` and mutations)
`admin` and `dm` can access

## Regular endpoints that also have the restricted counterpart
### Full `GET` , and mutation set
- `/games/<slug>/npcs.json`
- `/games/<slug>/pcs/:id.json`
- `/games/<slug>/npcs/:id.json`

## Regular endpoints that are missing the restricted counterpart
these will have the restricted counterpart in the future, for full API compatibility / symmetry

### Full `GET` , and mutation set
- `/games/<slug>/pcs.json`

### Filters
####  `GET /games/<slug>/npcs.json`
 accepts filters:
- `public_allegiance=`(`ally`/`enemy`/`neutral`)
- `public_slain=` (`true`/`false`))
- `name=` (character name)

####  `GET /games/<slug>/npcs/all.json`
 accepts filters:
- `private_allegiance=`(`ally`/`enemy`/`neutral`)
- `private_allegiance=` (`true`/`false`))

### Serializers
#### Public list endpoints
Besides the regular index exposed fields, expose also
- `game_slug`
- `public_slain`
- `public_allegiance`
#### Public show endpoints
Besides the regular index exposed fields, expose also
- `hidden`
- `incognito`
- `private_slain`
- `private_allegiance`
```

## What this issue is not about
- Creating a new agent, or changing any existing agent.
- Fixing endpoints, permissions, or creating the missing regular/restricted endpoint pairs noted
  in some files (e.g. `pcs.json` lacking an `all.json` counterpart) — documentation only, even
  when a doc/code mismatch is corrected per the Solution's point 3 above.
- Any change in the backend, frontend, or proxy.
- Moving account-scoped resources under an actual `/account/...` path — the gap is noted in
  `principles.md`, not fixed, by this issue.

## Benefits
- Meaningfully smaller `docs/agents/access-control/` — lower token cost for every agent that
  reads it for context.
- One source of truth (the code) for implementation detail, instead of two that can drift.
- New/rewritten resource files become easier to audit for correctness: a file either matches a
  named principle or documents exactly how/why it deviates.
