# Backend Plan: Don't Show New Game Button Unless Logged

Main plan: [plan.md](plan.md)

## Shared contracts

No cross-agent contract. The backend change is purely internal: a `GameMaster` record is created after game creation. No new API fields or endpoints are introduced.

## Implementation Steps

### Step 1 — Create `GameMaster` after game save in `_create_game`

In `source/games/views/games.py`:
- Import `GameMaster` from `..models`.
- After `game = serializer.save()`, add:
  ```python
  GameMaster.objects.create(game=game, user=request.user)
  ```
- This runs only for authenticated users (the auth check at the top of `_create_game` already guards this path).

### Step 2 — Add tests for the new behavior

In `source/games/tests/views/games_test.py`, inside `TestGamesCreateView`:
- Add `test_post_creates_game_master_for_creator`: POST a valid game with a token, then assert `GameMaster.objects.filter(game__game_slug=..., user=self.user).exists()` is `True`.
- Add `test_post_creates_exactly_one_game_master`: assert `GameMaster.objects.filter(user=self.user).count() == 1` after a single creation request.

## Files to Change

- `source/games/views/games.py` — import `GameMaster`, create record after `serializer.save()`
- `source/games/tests/views/games_test.py` — two new tests in `TestGamesCreateView`

## CI Checks

- `source`: `docker-compose run --rm majora_be poetry run pytest` (CI job: `pytest`)
- `source`: `docker-compose run --rm majora_be poetry run flake8` (CI job: `checks`)

## Notes

- `GameMaster` has a `unique_together = [('game', 'user')]` constraint, so duplicate creation will raise `IntegrityError`. This is not a concern in the normal creation flow (each game is new), but worth knowing if tests reuse the same game fixture.
- No migration is needed — the `GameMaster` model and its table already exist (migration `0014_gamemaster`).
