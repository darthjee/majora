# Plan: Remove duplications in source/games/tests

Issue: [356-remove-duplications-in-source-games-tests.md](../../issues/356-remove-duplications-in-source-games-tests.md)

## Overview

`source/games/tests` has three overlapping sources of duplication: hand-rolled model
creation in nearly every `setup_method`, a copy-pasted `_get(self, client, token=None)`
auth-header helper across 11+ files, and 11 near-identical pc/npc test-file pairs under
`views/characters/`. This plan introduces `factory_boy`-based factories and shared pytest
test mixins ("behaviors"), then applies both to collapse the pc/npc duplication. This is a
single-agent (backend) change — no other specialist agent's code is touched.

## Context

There is no existing factory or shared-behavior infrastructure today. The only precedent
for shared test support is `source/games/tests/views/support.py`
(`assert_json_response`), which lives under `views/` and is scoped to view tests. Model
creation is currently done ad hoc, e.g.:

```python
self.game = Game.objects.create(name='Test Game', game_slug='test-game')
self.player = Player.objects.create(name='Bob')
self.npc = Character.objects.create(name='Gandalf', game=self.game, npc=True, ...)
```

and the duplicated auth helper looks like:

```python
def _get(self, client, token=None):
    extra = {}
    if token is not None:
        extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
    return client.get(self.url, **extra)
```

(shape varies slightly file to file — some build a GET, some a PATCH; the plan below
normalizes on a mixin that supports both).

Production-code de-duplication in `source/games` (non-test) was already handled
separately in #355 and is out of scope here.

## Implementation Steps

### Step 1 — Add `factory_boy` as a dev dependency

Add `factory-boy` to `[tool.poetry.group.dev.dependencies]` in `source/pyproject.toml` and
update `source/poetry.lock` (via `docker-compose run --rm majora_tests poetry lock` /
`poetry install`, never running `poetry` on the host directly).

### Step 2 — Introduce model factories

Create `source/games/tests/factories.py` (or a `source/games/tests/factories/` package if
one file grows unwieldy — one factory class per model is fine either way) with
`factory_boy` `DjangoModelFactory` classes for the core models used across the test suite:

- `UserFactory` (wraps `User.objects.create_user`, since factory_boy's default `create()`
  calls `Model.objects.create()` and would bypass password hashing — use a
  `@factory.django.mute_signals`-free custom `_create` classmethod, or `factory.helpers`
  as appropriate, mirroring `create_user(username=..., password=...)`).
- `GameFactory` (`name`, `game_slug` — use `factory.Sequence` for uniqueness where tests
  rely on distinct slugs, but keep default values close to today's common fixtures like
  `'Test Game'` / `'test-game'` for readability, overridable per test).
- `CharacterFactory` (`name`, `game`, `player`, `npc`, plus a `PcFactory`/`NpcFactory`
  pair, or a single factory with `npc` defaulting appropriately, whichever produces the
  cleanest call sites in the pc/npc merge in Step 4).
- `TreasureFactory`, `GameMasterFactory`, `PlayerFactory`.

Keep default field values sensible and overridable via keyword arguments at call sites, so
existing test intent (specific names like `'Gandalf'`, `'Saruman'`) is preserved by passing
overrides rather than baking fixture-specific data into the factories.

Replace the hand-rolled `Model.objects.create(...)` calls identified in the issue
(`User.objects.create_user` — 190 occurrences, `Game.objects.create` — 135,
`Character.objects.create` — 119, `Treasure.objects.create` — 92,
`GameMaster.objects.create` — 58, `Player.objects.create` — 29) with the new factories
throughout `source/games/tests`, file by file. Do this as a mechanical pass — behavior
must not change, only construction.

### Step 3 — Extract shared test mixins ("behaviors")

Create `source/games/tests/behaviors.py` (or a `source/games/tests/behaviors/` package,
matching whichever granularity Step 2's factories module ends up using) with pytest-style
mixin classes for recurring patterns:

- An auth-header mixin (e.g. `TokenAuthRequestMixin` or similar) replacing the duplicated
  `_get(self, client, token=None)` helper across `auth/account_test.py`,
  `views/treasures/treasure_access_test.py`, `views/staff/staff_users_list_test.py`,
  `views/characters/game_pc_full_test.py`, `views/characters/game_npc_access_test.py`,
  `views/characters/game_npc_full_test.py`, `views/characters/game_npcs_all_test.py`,
  `views/characters/game_pc_access_test.py`, `views/games/game_access_test.py`, and any
  other file matching this shape found during implementation. The mixin should support
  building the `HTTP_AUTHORIZATION` extra-kwargs dict for GET and PATCH alike (the
  existing per-file helpers differ slightly between "just GET" and "GET or PATCH" usages
  — normalize to one flexible helper method, e.g. `auth_kwargs(token)` plus thin
  `get`/`patch` wrappers, so call sites stay concise).
- A "returns detail / returns 404" mixin for the repeated shape seen in
  `views/games/game_detail_test.py`, `views/games/game_treasure_detail_test.py`, and
  `views/treasures/treasure_detail_test.py` (each: 200 with expected fields for a valid
  id, 404 for an unknown id, 404 for cross-resource ids).

Keep `views/support.py`'s `assert_json_response` as-is (it is not duplicated, just
reused) — only add new shared code for patterns that are copy-pasted today.

### Step 4 — De-duplicate the 11 pc/npc test-file pairs

Using the factories and mixins from Steps 2–3, merge each of the 11 pc/npc pairs under
`source/games/tests/views/characters/` into a single parametrized test module (or a shared
base test class parametrized by `npc=True`/`npc=False` and the pc/npc-specific URL
segment), e.g.:

- `game_npc_detail_test.py` / `game_pc_detail_test.py`
- `game_npc_full_test.py` / `game_pc_full_test.py`
- `game_npc_access_test.py` / `game_pc_access_test.py`
- `game_npc_photo_set_test.py` / `game_pc_photo_set_test.py`
- `game_npc_photo_upload_test.py` / `game_pc_photo_upload_test.py`
- `game_npc_photos_test.py` / `game_pc_photos_test.py`
- `game_npc_treasure_acquire_test.py` / `game_pc_treasure_acquire_test.py`
- `game_npc_treasure_sell_test.py` / `game_pc_treasure_sell_test.py`
- `game_npc_treasures_test.py` / `game_pc_treasures_test.py`
- `game_npcs_all_test.py` / `game_pcs_test.py` (and `game_npcs_test.py`, the third
  "list" file — confirm during implementation whether it pairs with one of the above or
  stands alone)
- `game_npc_slain_set_test.py` (NPC-only — no PC counterpart; leave untouched)

Preserve every test method and its assertions (including the access-control /
hidden-NPC-gate tests called out in `game_npc_detail_test.py`'s
`TestGameNpcDetailHidden`, which security-guidelines.md section 8 requires to stay
intact) — only the fixture/URL construction and duplicated boilerplate should collapse,
not test coverage. Where PC and NPC genuinely diverge (e.g. NPC-only hidden-visibility
gating, since PCs have no `hidden` concept), keep those tests unmerged/NPC-only rather
than forcing a shared parametrization that doesn't fit.

Do not touch `source/games/tests/serializers/test_treasure_create.py` /
`test_treasure_update.py` — the issue explicitly calls these out as genuinely different
validation logic, not duplication.

### Step 5 — Run the full backend test suite locally

Confirm no regressions and no coverage loss:

```bash
docker-compose run --rm majora_tests pytest
```

## Files to Change

- `source/pyproject.toml` — add `factory-boy` dev dependency.
- `source/poetry.lock` — regenerated lockfile.
- `source/games/tests/factories.py` (new) — `UserFactory`, `GameFactory`,
  `CharacterFactory` (and/or `PcFactory`/`NpcFactory`), `TreasureFactory`,
  `GameMasterFactory`, `PlayerFactory`.
- `source/games/tests/behaviors.py` (new) — auth-header mixin, detail/404 mixin.
- `source/games/tests/views/characters/*.py` — pc/npc pairs merged (11 pairs collapsed;
  `game_npc_slain_set_test.py` left as-is).
- `source/games/tests/auth/account_test.py`,
  `source/games/tests/views/treasures/treasure_access_test.py`,
  `source/games/tests/views/staff/staff_users_list_test.py`,
  `source/games/tests/views/games/game_access_test.py`,
  `source/games/tests/views/games/game_detail_test.py`,
  `source/games/tests/views/games/game_treasure_detail_test.py`,
  `source/games/tests/views/treasures/treasure_detail_test.py` — adopt the new mixins.
- All other files under `source/games/tests/` with hand-rolled
  `Model.objects.create(...)`/`create_user(...)` calls — adopt the new factories.

## CI Checks

- `source/games/tests/views/characters/`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `source/games/tests/views/` (excluding `characters/`): `poetry run pytest games/tests/views/ --ignore=games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`)
- `source/`: `poetry run pytest --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- Local equivalent for all of the above: `docker-compose run --rm majora_tests pytest`

## Notes

- Do not run `poetry`, `pytest`, or any other Python tooling directly on the host — always
  go through `docker-compose run --rm majora_tests ...` (or `majora_backend`, per
  whichever service `docker-compose.yml` designates for tests).
- Watch for `pytest-django`'s per-test DB transaction rollback: factories that create
  `User` objects via `create_user` must still go through Django's password hashing, not a
  bare `Model.objects.create()`, or existing login/auth tests will start failing silently
  on password checks.
- No API contract, serializer field, or endpoint changes are involved — this is purely a
  test-code refactor, so `data-access` and `security` review is not required for this
  issue (no new endpoints, no serializer field changes, no auth/permission logic changes
  in production code).
- Confirm during implementation whether `game_npcs_all_test.py` / `game_npcs_test.py` /
  `game_pcs_test.py` form one pair or a pair-plus-standalone; the issue lists 11 pairs but
  the three "list" files need a closer look to map them precisely.
