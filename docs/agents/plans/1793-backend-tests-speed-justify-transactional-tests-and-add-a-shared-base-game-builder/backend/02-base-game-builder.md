# base_game builder
Create `backend/games/tests/factories/base_game.py`:

- A frozen `@dataclass` named `BaseGame`, with fields `game`, `dm_user`, `dm_player` and `domain`.
- `build_base_game(*, game_name='Test Game', game_slug=None, dm_username=None, **game_overrides)` (the signature can be adjusted):
  1. Calls `DomainFactory(domain='testserver')`.
  2. Calls `GameFactory(name=..., game_slug=... (factory sequence when None), game_domain_groups=[domain.domain_group], **game_overrides)`.
  3. Calls `UserFactory(...)` for the DM, using `username` when it is given.
  4. Calls `PlayerFactory(game=game, user=dm_user, is_dm=True)`.
  5. Returns the dataclass.
- The module docstring says the builder is meant for `setUpTestData` (`cls.base = build_base_game()`), and that it must never back a fixture scoped to a class, module or session.

Export `BaseGame` and `build_base_game` from `games/tests/factories/__init__.py` (add them to `__all__`).

Add `backend/games/tests/factories/base_game_test.py` (check how `user_test.py` in the same folder is collected). It is a Django `TestCase` with `setUpTestData`, following the policy for new tests. Each test method has a one-line docstring, and the tests check:
- the four objects exist;
- the player is the DM of the game and is linked to the user;
- the game is in the domain's group, and the domain is `testserver`;
- the overrides apply (name, slug, DM username).

## Files to Change
- `backend/games/tests/factories/base_game.py`: new builder
- `backend/games/tests/factories/__init__.py`: export it
- `backend/games/tests/factories/base_game_test.py`: new tests
