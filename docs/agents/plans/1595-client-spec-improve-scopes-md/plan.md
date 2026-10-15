# Plan: Client spec: improve scopes.md

Issue: [1595-client-spec-improve-scopes-md.md](../../issues/1595-client-spec-improve-scopes-md.md)

## Overview

Docs-only change. Rewrite `docs/agents/specs/client/scopes.md` so it records every decision
settled in #1595 and has no open questions left. Then align the rest of the client spec with the
two-action (`read`/`write`) model, and record the #1616 prerequisite and the #1603 reviews in the
hub.

## Context

Epic #1592 adds scoped API tokens. `scopes.md` was written in #1593 with its core design left
open: the catalogue, enforcement, the per-game lookup, errors, storage and exclusions. #1595
settled all of it (see the issue file's **Solution**). It also dropped the epic's `delete`
action, so HTTP `DELETE` now maps to `write`. #1616 (plain AllowAny routes must never serve hidden
content) was spun off and must land before #1603.

## Implementation Steps

### Step 1 — Rewrite `scopes.md`

Keep the aspect-page template (**Overview**, **Decisions**, **Open questions**, **Affected
code**) and the tone of the sibling `tokens.md`, which #1594 already finished.

- **Overview:** keep it as it is.
- **Decisions:** keep "Intersection with the owner's roles", "Per-game restriction", "Never
  reachable with a scoped token", "Uploads" and "Fail closed", and extend each with the issue's
  details. Then:
  - Replace "Resource × action scopes" with **Resource families** (the 16-family table, the
    PC/NPC split, photos and uploads following their parent, the rejected merges) and
    **Actions** (`read`/`write` only, `DELETE` maps to `write`, the two current `DELETE`
    endpoints, the accepted breaking-change consequence, the rejected alternatives).
  - Add **Read scopes** (no scope for public reads; restricted reads need every involved
    family's `read`; `permissions/*.json` and `access.json` are public; the #1616 prerequisite).
  - Add **Write scopes and link routes** (`write` on the owning family; `read` on any other
    family whose restricted data is touched; `remove`/`sell`/`buy` are `write`; the rejected
    alternatives).
  - Replace "Enforcement candidates" with **Enforcement mechanism**: the per-method
    `@token_scopes` decorator, the check inside `ApiTokenAuthentication` through
    `request.resolver_match.func`, the fail-closed rule, the single catalogue constant, and the
    rejected central URL map and `DEFAULT_PERMISSION_CLASSES`.
  - Extend "Per-game restriction" with the `game_slug` kwarg, the non-game-scoped families,
    `my-games.json` filtering, `games.json` not filtered, and no object lookups in the
    authentication class.
  - Extend "Uploads" with the finalize model-to-family map and the rejection of staff and copy
    origins.
  - Add **Error responses** (403 `scope_missing` / `game_not_allowed` / `token_not_allowed`,
    the existing `{"errors": {"detail": [...]}}` body, no 404 masking, the 401 `token_invalid`
    staying in `tokens.md`).
  - Add **Storage and validation** (`scopes` as a `JSONField` validated against the
    catalogue, `games` as an M2M to `Game` with a reachability check, unknown stored scopes
    ignored).
  - Extend "Never reachable with a scoped token" with the exact exclusion list and the
    `@authentication_classes([])` views that stay unchanged.
  - Add **Testing strategy** for #1603 (the URL coverage test plus the per-family cases) and the
    `security`/`data-access` reviews.
- **Open questions:** "None. Every open question was settled by #1595 and recorded under
  [Decisions](#decisions)."
- **Affected code:** add `backend/uploads/views.py` (finalize), `backend/games/decorators.py`
  (next to `@regular`/`@restricted`, where `@token_scopes` sits), `backend/accounts/` (the
  `ApiToken` `scopes`/`games` fields), and every `urls` module under `backend/*/urls*` (the
  coverage test). Keep the existing entries.

### Step 2 — Align the rest of the client spec

- `docs/agents/specs/client/token-ui.md`: in **Open questions**, change "with read/write/delete
  columns" to "with read/write columns". Keep the question itself open, since #1597 settles it.
- `docs/agents/specs/client.md` (hub):
  - in the **Scopes** aspect-page line, mention the `@token_scopes` declaration;
  - under **Sub-issues**, note that #1603 also gets `security` and `data-access` reviews;
  - under **Order**, note that #1616 must land before #1603.
- Grep the whole client spec for other mentions of a `delete` scope action (the `library.md`
  wrapper methods "list, get, create, update, delete" are client methods, not scopes, and stay).

## Files to Change

- `docs/agents/specs/client/scopes.md`: full rewrite of Decisions, Open questions and Affected
  code, as above.
- `docs/agents/specs/client/token-ui.md`: change "read/write/delete columns" to "read/write".
- `docs/agents/specs/client.md`: the Scopes line, the #1603 reviews, the #1616 ordering.

## CI Checks

- Markdown: `docker-compose run --rm <node service> yarn lint_md` (CI job: `markdownlint`).
  Check `AGENTS.md`'s Development section for the exact service or `make` target.

## Notes

- Docs only: no code, no tests. The `@token_scopes` name, the error codes and the field types
  are spec decisions for #1602/#1603 to implement, not code to write here.
- Write in the same plain, short-sentence style as `tokens.md`.
