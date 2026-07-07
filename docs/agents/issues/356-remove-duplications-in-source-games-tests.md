# Remove duplications in source/games/tests

## Context

`source/games/tests` (111 test files) has significant code duplication in test setup, object creation, and shared helper logic. This is greenfield work — there is no existing factory or shared test-behavior infrastructure in the project today. Three distinct kinds of duplication were found:

1. **PC/NPC test pairs**: `source/games/tests/views/characters/` has 11 pc/npc file pairs (e.g. `game_npc_detail_test.py`/`game_pc_detail_test.py`) that are near-complete parallel duplicates — same test classes/method names/assertions, differing mainly in fixture data (character names/roles, pc vs npc flags). Roughly 300+ lines per pair, ~3,300+ lines total, with no shared test helpers used today.
2. **Duplicated auth-header helper**: a private `_get(self, client, token=None)` method (building the `HTTP_AUTHORIZATION` header dict) is copy-pasted verbatim across at least 11 files spanning `auth/`, `views/treasures/`, `views/game_masters/`, `views/staff/`, `views/characters/`, and `views/games/`.
3. **Hand-rolled object creation**: hundreds of call sites hand-build the same model objects with the same field shapes, e.g. `User.objects.create_user(...)` (190 occurrences), `Game.objects.create(...)` (135), `Character.objects.create(...)` (119), `Treasure.objects.create(...)` (92), `GameMaster.objects.create(...)` (58), `Player.objects.create(...)` (29), almost always inline in `setup_method`.

Not every pair of similar-looking test files is actually duplicative — e.g. `serializers/test_treasure_create.py` and `serializers/test_treasure_update.py` test genuinely different validation logic and should be left alone. The fix should target confirmed duplication, not force-fit every superficially similar file.

Out of scope: this issue only touches `source/games/tests`; production code de-duplication is tracked separately in #355.

## What needs to be done

1. Add `factory_boy` as a test dependency and introduce factory classes for the core models (`User`, `Game`, `Character`, `Treasure`, `GameMaster`, `Player`, etc.), replacing the hand-rolled `Model.objects.create(...)` boilerplate throughout `source/games/tests`.
2. Extract shared test mixins ("behaviors") for recurring patterns, starting with the duplicated `_get(self, client, token=None)` auth-header helper (used across 11+ files) — e.g. an auth-token-required mixin — and any other recurring pattern found (such as the repeated "returns detail" / "returns 404" shape seen in `views/games/game_detail_test.py`, `views/games/game_treasure_detail_test.py`, `views/treasures/treasure_detail_test.py`).
3. Use the new factories and mixins to de-duplicate the 11 pc/npc test-file pairs in `views/characters/` specifically, since that's the largest single block of duplication.
4. Keep this as a single issue covering factories + behaviors + the pc/npc merge; sub-tasks can be broken out at planning/implementation time if needed.

## Acceptance criteria

- [ ] `factory_boy` is added as a test dependency, with factory classes for `User`, `Game`, `Character`, `Treasure`, `GameMaster`, and `Player`.
- [ ] Hand-rolled `Model.objects.create(...)` boilerplate in `source/games/tests` is replaced by the new factories where applicable.
- [ ] The duplicated `_get(self, client, token=None)` auth-header helper is extracted into a shared test mixin/behavior and reused across the 11+ files that duplicated it.
- [ ] The 11 pc/npc test-file pairs in `source/games/tests/views/characters/` are de-duplicated using the new factories and mixins.
- [ ] All existing tests continue to pass.

---
Tags: :shipit:
