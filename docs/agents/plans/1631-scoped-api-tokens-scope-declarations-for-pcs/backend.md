# Backend Plan: Scoped API tokens: scope declarations for PCs

Main plan: [plan.md](plan.md)

## Overview
Every PC view is still on `PENDING_TOKEN_SCOPES`, so scoped tokens get 403 `token_not_allowed`.
Declare `@token_scopes` on each one, following
[`docs/agents/access-control/token-scopes.md`](../../access-control/token-scopes.md), then take
them off the pending list and test the family.

## Context
- The core from #1603 is merged: `backend/accounts/scopes.py` (catalogue),
  `games.decorators.token_scopes` / `get_token_scopes`, `TokenScopeCheck` in
  `backend/accounts/authentication.py`, and `backend/accounts/tests/token_scopes_coverage_test.py`.
  No production view declares scopes yet, so this may be the first family to land.
- `@token_scopes` must sit **above** `@api_view` (it checks `view_func.cls` and raises
  `ValueError` otherwise). It validates methods against the view, so every method the view
  serves must have an entry (the coverage test enforces it).
- Most PC views are one-line modules that call a factory shared with NPCs, e.g.
  `game_pc_item_detail_full = build_item_detail_full_view(npc=False, …)`. Each factory call
  returns a fresh DRF view, so wrapping it in the PC module does not leak onto the NPC view.
  Decided in the issue: declare in the per-kind PC module, never inside the shared factory:

  ```python
  game_pc_item_detail_full = token_scopes(GET=['pcs:read', 'items:read'])(
      build_item_detail_full_view(npc=False, serializer_class=CharacterItemDetailFullSerializer),
  )
  ```

  Views written with decorators (`game_pcs`, `game_pc_detail`, the 8 summary views) take
  `@token_scopes(...)` as the top decorator, above `@restricted` / `@regular` / `@skip_cache`
  / `@api_view`.

## Declaration table

Rules: a plain read is `[]`; restricted reads (`all`, `full`, `available/all`, `files/all`,
`photos/all`, `summary/all`, and other permission-gated reads) need `pcs:read` plus `read` on
the linked family; writes need `pcs:write`, plus the linked family's `read` when the `/all`
variant can touch hidden records.

| URL name | Module | Declaration |
|---|---|---|
| `game-pcs` | `pcs/game_pcs.py` | `GET=[]` |
| `game-pc-detail` | `pcs/game_pc_detail.py` | `GET=[]`, `PATCH=['pcs:write']` |
| `game-pc-full` | `pcs/detail/game_pc_full.py` | `GET=['pcs:read']`, `PATCH=['pcs:write']` |
| `game-pc-access` | `pcs/detail/game_pc_access.py` | `GET=[]` |
| `game-pc-photos` | `pcs/detail/photos/game_pc_photos.py` | `GET=[]` |
| `game-pc-photo-upload` | `pcs/detail/game_pc_photo_upload.py` | `POST=['pcs:write']` |
| `game-pc-photo-set` | `pcs/detail/photos/detail/game_pc_photo_set.py` | `PATCH=['pcs:write']` |
| `game-pc-photo-detail` | `pcs/detail/photos/detail/game_pc_photo_detail.py` | `PATCH=['pcs:write']`, `DELETE=['pcs:write']` |
| `game-pc-photo-deletable` | `pcs/detail/photos/detail/game_pc_photo_deletable.py` | `GET=['pcs:read']` (`IsAuthenticated`, permission-gated) |

For each linked family `F` in `documents`, `factions`, `items`, `possessions`, `recipes`
(`<f>` = singular URL segment):

| URL name pattern | Declaration |
|---|---|
| `game-pc-<F>` (list) | `GET=[]`; `items` and `possessions` also serve `POST=['pcs:write']` |
| `game-pc-<F>-all` | `GET=['pcs:read', 'F:read']` |
| `game-pc-<f>-detail` | `GET=[]`; `items` adds `PATCH=['pcs:write']`; `recipes` adds `PATCH=['pcs:write', 'recipes:read']` (it responds with the `full.json` shape) |
| `game-pc-<f>-detail-full` | `GET=['pcs:read', 'F:read']` |
| `game-pc-<F>-available` | `GET=[]` |
| `game-pc-<F>-available-all` | `GET=['pcs:read', 'F:read']` |
| `game-pc-<f>-acquire`, `game-pc-<f>-remove` | `POST=['pcs:write']` |
| `game-pc-<f>-acquire-all`, `game-pc-<f>-remove-all` | `POST=['pcs:write', 'F:read']` |

Plus:

| URL name | Declaration |
|---|---|
| `game-pc-document-files`, `game-pc-document-photos` | `GET=[]` |
| `game-pc-document-files-all`, `game-pc-document-photos-all` | `GET=['pcs:read', 'documents:read']` |
| `game-pc-item-photo-upload` | `POST=['pcs:write', 'items:write']` (decided in the issue: finalize maps `GameItemPhoto` to `items:write`) |
| `game-pc-treasures` | `GET=[]` |
| `game-pc-treasure-acquire`, `-buy`, `-sell`, `-remove` | `POST=['pcs:write']` |
| `game-pc-treasure-acquire-all`, `-buy-all` | `POST=['pcs:write', 'treasures:read']` |
| `game-<F>-pc-summary` (`F` in document, faction, item, treasure) | `GET=[]` |
| `game-<F>-pc-summary-all` | `GET=['pcs:read', '<families>:read']` (`documents`, `factions`, `items`, `treasures`) |

Before declaring, check each factory's actual `_build_api_view([...])` methods (in
`games/views/game/_character/**/_*_shared.py` and `_character/__init__.py`) and adjust the entry
to match. For example, check whether recipe `acquire`/`remove` are `POST` or another method
(`_build_gated_view(method, …)`). The decorator raises at import time on a mismatch.

## Steps

- [01 — Declare PC core and photo views](backend/01-declare-core-and-photos.md)
- [02 — Declare PC sub-collection views](backend/02-declare-sub-collections.md)
- [03 — Declare PC summary views](backend/03-declare-summaries.md)
- [04 — Remove PC views from the pending list](backend/04-pending-list.md)
- [05 — Per-family token-scope tests](backend/05-tests.md)

## CI Checks
- `backend`: run inside the tests container (`make tests`, then
  `poetry run pytest accounts/tests/token_scopes_coverage_test.py games/tests/views/game/pcs/ games/tests/views/game/`)
  (CI jobs: `pytest_views_game`, `pytest_views_rest`, `pytest_all`), plus the backend lint jobs
  (flake8 / pylint) from `.circleci/config.yml`.

## Notes
- `permissions-game-pc` (`permissions/game/pc.json`) is **not** under the `pcs` URL root. It
  stays pending for the `games`/top-level sub-issues (#1630 / #1636).
- The NPC sibling #1632 mirrors this pattern with `npcs:*`. Do not touch NPC modules here.
- If a sibling sub-issue (e.g. #1630) lands first with a shared scoped-token test helper,
  reuse it instead of adding a second one.
- If this turns out to be the last #1603 sub-issue to land, delete `PENDING_TOKEN_SCOPES` and its
  use in the coverage test.
- After merge, the architect updates the **Status** paragraph of
  `docs/agents/access-control/token-scopes.md` ("no production view declares scopes yet") to
  list the families that are declared.
- Request `security` and `data-access` reviews on the PR.
