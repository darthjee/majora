# Plan: Refactor python views

Issue: [236-refactor-python-views.md](../../issues/236-refactor-python-views.md)

## Overview

Pure refactor of `source/games/views/` (and its mirrored tests under
`source/games/tests/`): split every module that currently groups multiple
view functions into a package with one file per view/route, extract the
duplicated auth/permission/validation/pagination patterns into shared
helpers, and shrink `source/games/permissions.py`'s triple-duplicated
classes into a single implementation. No behavior, URL, response shape, or
public import name changes — only file layout and internal structure.

## Context

`source/games/views/` currently has one module per *resource type*
(`characters.py`, `games.py`, `treasures.py`, `auth.py`, `game_masters.py`,
`password_reset.py`), each grouping several `@api_view` functions:

| Module | View functions | Lines |
|---|---|---|
| `characters.py` | `game_pcs`, `game_npcs`, `game_npc_detail`, `game_npcs_all`, `game_pc_detail`, `game_npc_full`, `game_pc_full`, `game_pc_access`, `game_npc_access` (+ private `_find_character`, `_update_character`) | 165 |
| `games.py` | `games_list`, `game_detail`, `game_access`, `game_treasures` (+ private `_create_game`, `_update_game`) | 103 |
| `treasures.py` | `treasures_list`, `treasure_detail`, `treasure_access` (+ private `_create_treasure`, `_update_treasure`) | 97 |
| `auth.py` | `login`, `register`, `logout`, `status`, `language`, `test_email` (+ private email/session helpers) | 198 |
| `game_masters.py` | `game_masters_list`, `game_master_detail` | 50 |
| `password_reset.py` | `recover`, `reset_password` (+ private email/token helpers) | 77 |
| `photo_upload.py` | `photo_upload` only | 51 |
| `upload_finalize.py` | `upload_finalize` only | 86 |
| `health.py` | `health` only | 14 |

`photo_upload.py`, `upload_finalize.py`, `health.py` already hold exactly
one view each — they are left as single files (no package needed), though
`photo_upload.py` still benefits from the new shared helpers.

The matching test files under `source/games/tests/views/` mirror the same
grouping (`characters_test.py` is 1337 lines across 13 test classes for 9
view functions). `auth.py` and `password_reset.py` are tested from
`source/games/tests/auth_test.py` and `source/games/tests/password_reset_test.py`
(top-level, not under `tests/views/`) — that existing location is preserved,
just split the same way.

Recurring duplicated patterns identified in the codebase (matches the
issue's Problem list):
- Auth check: `if not request.user or not request.user.is_authenticated: return Response({'errors': {'detail': ['authentication required']}}, status=401)` — appears verbatim in `games.py::_create_game`, `treasures.py::_create_treasure`, `game_masters.py` (both views), and is *also* reimplemented (correctly, via `can_be_edited_by`) inside every `*EditPermission` class in `permissions.py`.
- `permissions.py` defines `GameEditPermission`, `CharacterEditPermission`, `TreasureEditPermission` with byte-for-byte identical bodies (`check`, `_unauthenticated_response`, `_forbidden_response`) — only the docstrings differ.
- Detail GET + PATCH-update pattern: `games.py::game_detail`/`_update_game`, `characters.py::game_pc_detail`/`game_npc_detail`/`_update_character`, `treasures.py::treasure_detail`/`_update_treasure` all follow: fetch object → if PATCH, permission-check → validate serializer (`{'errors': serializer.errors}`, 400) → save → re-serialize with the detail serializer.
- "Access" pattern: `games.py::game_access`, `treasures.py::treasure_access`, `characters.py::game_pc_access`/`game_npc_access` all: look up the object with `.filter(...).first()`, serialize with an `*AccessSerializer` (context includes `request`), and set `response['X-Skip-Cache'] = 'true'`.
- Create pattern: `games.py::_create_game`, `treasures.py::_create_treasure` both: inline auth check → validate create-serializer → save → re-serialize with detail serializer → `201`. Only difference is `treasures.py` adds a superuser check.
- Pagination: `Paginator(request, queryset).paginate()` followed by a list-serializer call — already reasonably concise via the existing `Paginator` class, but repeated boilerplate (`page_x, headers = Paginator(...).paginate(); serializer = XListSerializer(page_x, many=True); return Response(serializer.data, headers=headers)`) recurs 5+ times.

## Implementation Steps

### Step 1 — Add shared view helpers module

Create `source/games/views/common.py` with small, generic helpers used
across the split packages (exact signatures may be adjusted during
implementation if a cleaner shape emerges — this is a starting point, not
a contract):

- `require_authenticated(request)` — returns the existing 401 `Response`
  shape (`{'errors': {'detail': ['authentication required']}}`) if
  `request.user` is falsy/unauthenticated, else `None`.
- `validated_or_error(serializer)` — calls `serializer.is_valid()`; returns
  `Response({'errors': serializer.errors}, status=400)` on failure, else
  `None`.
- `detail_or_update(request, obj, permission_cls, update_serializer_cls, detail_serializer_cls, detail_context=None)`
  — implements the GET/PATCH detail+update pattern described above,
  reusing `validated_or_error`.
- `paginated_list_response(request, queryset, list_serializer_cls)` —
  wraps `Paginator(request, queryset).paginate()` + serialize + `Response(..., headers=headers)`.
- `access_response(serializer_cls, obj, request, context_extra=None)` —
  builds the serializer (context always includes `request`, merged with
  `context_extra`), sets `response['X-Skip-Cache'] = 'true'`, returns it.

Add `source/games/tests/views/common_test.py` covering each helper in
isolation.

### Step 2 — De-duplicate `permissions.py`

Collapse the three identical class bodies in `source/games/permissions.py`
into a single private base (e.g. `_EditPermission`) implementing `check`,
`_unauthenticated_response`, `_forbidden_response`; keep
`GameEditPermission`, `CharacterEditPermission`, `TreasureEditPermission`
as the same three public, importable names (thin subclasses of the base,
docstring only) so every existing import (`from ..permissions import
GameEditPermission`, etc.) and `source/games/tests/permissions_test.py`
keep working unchanged.

### Step 3 — Split `characters.py` into a `characters/` package

Create `source/games/views/characters/` with:
- `__init__.py` — re-exports the same 9 names currently exported by
  `characters.py` (`game_pcs`, `game_npcs`, `game_npc_detail`,
  `game_npcs_all`, `game_pc_detail`, `game_npc_full`, `game_pc_full`,
  `game_pc_access`, `game_npc_access`).
- One file per view function (`game_pcs.py`, `game_npcs.py`,
  `game_npc_detail.py`, `game_npcs_all.py`, `game_pc_detail.py`,
  `game_npc_full.py`, `game_pc_full.py`, `game_pc_access.py`,
  `game_npc_access.py`), each importing `common.py`/`permissions.py`
  helpers instead of repeating the detail/update/access boilerplate.
- `_shared.py` — the private `_find_character` helper, used by
  `game_pc_access.py` and `game_npc_access.py`.
- Delete the old `characters.py`.

### Step 4 — Split `games.py` into a `games/` package

Same approach: `games/__init__.py` re-exporting `games_list`,
`game_detail`, `game_access`, `game_treasures`; one file per view
(`games_list.py` folds in the create-branch using the Step 1 helpers,
`game_detail.py` uses `detail_or_update`, `game_access.py` uses
`access_response`, `game_treasures.py` uses `paginated_list_response`).
Delete the old `games.py`.

### Step 5 — Split `treasures.py` into a `treasures/` package

Mirror Step 4: `treasures/__init__.py` re-exporting `treasures_list`,
`treasure_detail`, `treasure_access`; one file per view, reusing the same
shared helpers (`treasures_list.py` keeps its extra superuser check on
create).

### Step 6 — Split `game_masters.py` into a `game_masters/` package

`game_masters/__init__.py` re-exporting `game_masters_list`,
`game_master_detail`; one file per view, using `require_authenticated`
from Step 1 for the inline auth checks in both.

### Step 7 — Split `auth.py` into an `auth/` package

`auth/__init__.py` re-exporting `login`, `register`, `logout`, `status`,
`language`, `test_email`; one file per view; `auth/_shared.py` holding
`REGISTER_REQUIRED_FIELDS`, `send_test_email`, `send_welcome_email`,
`_validate_register_payload`, `_create_registered_user`,
`_authenticate_from_session`. Delete the old `auth.py`.

### Step 8 — Split `password_reset.py` into a `password_reset/` package

`password_reset/__init__.py` re-exporting `recover`, `reset_password`;
`password_reset/_shared.py` holding `INVALID_OR_EXPIRED_TOKEN_ERROR`,
`_build_recovery_url`, `send_password_reset_email`,
`_create_and_send_reset_token`. Delete the old `password_reset.py`.

### Step 9 — Tidy the remaining single-view files

`photo_upload.py`, `upload_finalize.py`, `health.py` already satisfy "one
view per file" — leave them as standalone modules (no package). Update
`photo_upload.py` to reuse `validated_or_error` from Step 1 where it
removes duplication; leave `upload_finalize.py` as-is unless a helper from
Step 1 cleanly applies (its permission-check chain is already
single-purpose and well factored).

### Step 10 — Verify `source/games/views/__init__.py` and `urls.py` need no changes

`views/__init__.py` already imports by name from each submodule
(`from .characters import (...)`, `from .games import (...)`, etc.) —
since every new subpackage's `__init__.py` re-exports the same names,
`views/__init__.py` and `source/games/urls.py` (which only references
`views.<name>`) require **no changes**. Confirm this after each package
split by running the app's URL checks / a quick `python manage.py check`.

### Step 11 — Mirror the test splits

- `source/games/tests/views/characters_test.py` → `source/games/tests/views/characters/` package, one file per view (e.g. `game_pcs_test.py`, `game_npc_detail_test.py` folding in both the `TestGameNpcDetailView` and `TestGameNpcUpdateView`/hidden-filter classes that target the same view).
- `source/games/tests/views/games_test.py` → `source/games/tests/views/games/` (`games_list_test.py`, `game_detail_test.py`, `game_access_test.py`); `game_treasures_test.py` moves in as `games/game_treasures_test.py` (already isolated).
- `source/games/tests/views/treasures_test.py` → `source/games/tests/views/treasures/` (`treasures_list_test.py`, `treasure_detail_test.py`, `treasure_access_test.py`).
- `source/games/tests/views/game_masters_test.py` → `source/games/tests/views/game_masters/` (`game_masters_list_test.py`, `game_master_detail_test.py`).
- `source/games/tests/views/photo_upload_test.py`, `upload_finalize_test.py`, `health_test.py` stay as single files (already 1:1 with their view).
- `source/games/tests/auth_test.py` → `source/games/tests/auth/` package, one file per view (`login_test.py`, `register_test.py`, `logout_test.py`, `status_test.py` folding in `TestStatusView` + `TestStatusViewCacheControl`, `language_test.py`, `test_email_test.py`).
- `source/games/tests/password_reset_test.py` → `source/games/tests/password_reset/` package (`recover_test.py`, `reset_password_test.py`).
- Add `__init__.py` to every new test package (pytest doesn't require it, but the existing `tests/views/__init__.py` convention is kept for consistency).
- No test assertions change — this is a pure file move/split; every existing test function/class keeps its body and its `pytest.mark.django_db` markers.

### Step 12 — Local verification

Run the full backend suite and quality gates locally via
`docker-compose run` (per `AGENTS.md`) before opening the PR:
- `docker-compose run --rm majora_tests pytest games/tests/views/`
- `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/`
- `docker-compose run --rm majora_tests ruff check .`
- `docker-compose run --rm majora_tests bash bin/reports.sh ci` (xenon complexity gate — `--max-absolute B --max-modules B --max-average A`; this is the objective bar for "break down oversized functions" from the issue).

## Files to Change

- `source/games/views/common.py` — new shared helper module (Step 1).
- `source/games/tests/views/common_test.py` — new tests for the helpers.
- `source/games/permissions.py` — de-duplicated via a private base class (Step 2); `source/games/tests/permissions_test.py` unchanged.
- `source/games/views/characters.py` → `source/games/views/characters/*.py` (9 view files + `_shared.py` + `__init__.py`); `source/games/tests/views/characters_test.py` → `source/games/tests/views/characters/*.py`.
- `source/games/views/games.py` → `source/games/views/games/*.py` (4 view files + `__init__.py`); `source/games/tests/views/games_test.py` + `game_treasures_test.py` → `source/games/tests/views/games/*.py`.
- `source/games/views/treasures.py` → `source/games/views/treasures/*.py` (3 view files + `__init__.py`); `source/games/tests/views/treasures_test.py` → `source/games/tests/views/treasures/*.py`.
- `source/games/views/game_masters.py` → `source/games/views/game_masters/*.py` (2 view files + `__init__.py`); `source/games/tests/views/game_masters_test.py` → `source/games/tests/views/game_masters/*.py`.
- `source/games/views/auth.py` → `source/games/views/auth/*.py` (6 view files + `_shared.py` + `__init__.py`); `source/games/tests/auth_test.py` → `source/games/tests/auth/*.py`.
- `source/games/views/password_reset.py` → `source/games/views/password_reset/*.py` (2 view files + `_shared.py` + `__init__.py`); `source/games/tests/password_reset_test.py` → `source/games/tests/password_reset/*.py`.
- `source/games/views/photo_upload.py` — reuse `common.py` helper where applicable, no relocation.
- `source/games/views/__init__.py`, `source/games/urls.py` — verified unchanged (Step 10).

## CI Checks

- `source/games/`: `poetry run pytest games/tests/views/ --cov` (CI job: `pytest_views`) — locally `docker-compose run --rm majora_tests pytest games/tests/views/`.
- `source/games/`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) — covers the relocated `auth`/`password_reset` tests.
- `source/`: `poetry run ruff check .` (CI job: `checks`) — locally `docker-compose run --rm majora_tests ruff check .`.
- `source/`: `bin/reports.sh ci` → `poetry run xenon --max-absolute B --max-modules B --max-average A .` (CI job: `checks`) — enforces the "break oversized functions into smaller methods" requirement objectively.

## Notes

- This is a pure refactor: no route, payload, status code, or header shape changes anywhere. Every existing test must keep passing after being moved/split, with unchanged assertions.
- `permissions_test.py` currently has no dedicated test class for `TreasureEditPermission` — that pre-existing gap is out of scope for this issue (no behavior/coverage changes requested) and is not introduced or fixed here.
- The exact shape of the shared helpers in `common.py` (Step 1) is a starting proposal; the implementing agent may adjust signatures if a cleaner abstraction emerges while doing the split, as explicitly allowed by the issue.
- Keep `docs/agents/architecture.md`'s one-line description of `views/` (`Function-based API views using @api_view (games.py, characters.py)`) in sync if the examples it names change shape — update it to reference the new package layout in the same PR.
