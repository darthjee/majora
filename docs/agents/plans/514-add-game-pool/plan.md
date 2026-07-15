# Plan: Add game poll

Issue: [514-add-game-pool.md](../issues/514-add-game-pool.md)

## Overview

Add three new Django models — `Poll`, `PollOption`, and `PollVote` — under a new
`backend/games/models/poll/` resource folder, following the existing
`models/game/`-style grouping. This issue covers only the data model layer: models,
migrations, admin registration, and tests. No API endpoints, serializers, views, or
`versioning` history tracking are in scope.

## Context

A `Poll` belongs to a `Game` and has a `type` (`single`/`multiple`) and a `status`
(`open`/`inactive`/`closed`). A `PollOption` belongs to a `Poll` and holds a single
`option` string. A `PollVote` links a `Player` to a `PollOption`: a player can never
vote for the same option twice, a player must belong to the poll's game
(`player in poll.game.players.all()`), and for `single`-type polls a player may only
vote for one option in the whole poll — this last rule cannot be expressed as a plain
DB `unique_together` since it depends on the parent `Poll.type`, so it needs
model-level validation.

## Implementation Steps

### Step 1 — `Poll` model

Create `backend/games/models/poll/poll.py`:

- `game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='polls')`
- `TYPE_SINGLE = 'single'`, `TYPE_MULTIPLE = 'multiple'`, `TYPE_CHOICES` — constants +
  `*_CHOICES` list convention (see `Upload.STATUS_CHOICES`,
  `Character.ALLEGIANCE_CHOICES`). Field: `type = models.CharField(max_length=16,
  choices=TYPE_CHOICES, default=TYPE_SINGLE)`.
- `STATUS_OPEN = 'open'`, `STATUS_INACTIVE = 'inactive'`, `STATUS_CLOSED = 'closed'`,
  `STATUS_CHOICES`. Field: `status = models.CharField(max_length=16,
  choices=STATUS_CHOICES, default=STATUS_INACTIVE)`.
- `Meta.ordering = ['id']` (matching `GameMaster`/`CharacterTreasure`).
- `__str__` returning something like `f'Poll(game={self.game.name}, type={self.type})'`.
- No `history = HistoricalRecords(...)` field — history tracking is explicitly out of
  scope for this issue (see issue's Solution section).

### Step 2 — `PollOption` model

Create `backend/games/models/poll/poll_option.py`:

- `poll = models.ForeignKey('games.Poll', on_delete=models.CASCADE,
  related_name='options')`
- `option = models.CharField(max_length=200)`
- `Meta.ordering = ['id']`
- `__str__` returning `self.option`.

### Step 3 — `PollVote` model

Create `backend/games/models/poll/poll_vote.py`, a through-model linking `Player` to
`PollOption` (same shape as `CharacterTreasure`):

- `player = models.ForeignKey('games.Player', on_delete=models.CASCADE,
  related_name='poll_votes')`
- `option = models.ForeignKey('games.PollOption', on_delete=models.CASCADE,
  related_name='votes')`
- `Meta.unique_together = [('player', 'option')]` — a player may never vote for the
  same option twice, regardless of poll type. `Meta.ordering = ['id']`.
- Override `clean()` (called from `save()`, following `Upload.save()`'s pattern of
  enforcing invariants in the model itself) to raise `ValidationError` when:
  1. `self.player` is not in `self.option.poll.game.players.all()` — the voting
     player must belong to the poll's game.
  2. `self.option.poll.type == Poll.TYPE_SINGLE` and a `PollVote` already exists for
     `self.player` on a *different* option of the same poll (i.e.
     `PollVote.objects.filter(player=self.player,
     option__poll=self.option.poll).exclude(option=self.option).exists()`) — a
     single-type poll allows only one option per player.
  3. Call `self.full_clean(validate_unique=...)`-style guard isn't needed here since
     `unique_together` already covers the DB-level per-option uniqueness; only the
     two checks above need explicit `clean()`/`save()` logic.
- Override `save()` to call `self.clean()` before `super().save(*args, **kwargs)`,
  matching how `Upload.save()` enforces its own invariant inline.
- `__str__` returning something like
  `f'PollVote(player={self.player.name}, option={self.option.option})'`.

### Step 4 — Register models

- `backend/games/models/__init__.py`: add `Poll`, `PollOption`, `PollVote` imports
  (from `games.models.poll.poll`, `games.models.poll.poll_option`,
  `games.models.poll.poll_vote`) and `__all__` entries, alphabetically ordered
  alongside the existing entries.
- `backend/games/admin.py`: `admin.site.register(Poll)`,
  `admin.site.register(PollOption)`, `admin.site.register(PollVote)` — plain
  registration, no custom `ModelAdmin`/inline needed (none of the existing simple
  through-models like `GameMaster` or `CharacterTreasure` have one either).

### Step 5 — Migrations

Run `docker-compose run --rm majora_app poetry run python manage.py makemigrations`
inside the backend container to generate the migration for the three new tables (do
not hand-write it). Verify the generated migration only adds new models/fields (no
unrelated diffs) before committing.

### Step 6 — Test factories

Add to `backend/games/tests/factories.py`, following the existing `PlayerFactory`/
`GameMasterFactory` style:

- `PollFactory` — `game = factory.SubFactory(GameFactory)`, `type = Poll.TYPE_SINGLE`,
  `status = Poll.STATUS_OPEN`.
- `PollOptionFactory` — `poll = factory.SubFactory(PollFactory)`, `option = 'Test
  Option'`.
- `PollVoteFactory` — `player = factory.SubFactory(PlayerFactory)`, `option =
  factory.SubFactory(PollOptionFactory)`. Since `PollVote.clean()` requires the
  player to belong to the poll's game, tests that build a valid vote must explicitly
  add the player to the poll's game (e.g. `player.games.add(poll.game)`) — the
  factory itself cannot do this generically since `player` and `option` are
  independent sub-factories with no shared game by default.

### Step 7 — Tests

Create `backend/games/tests/models/poll/` mirroring the new `models/poll/` folder
(per `models-organization.md`), one file per model:

- `poll_test.py` — creation, `type`/`status` defaults and choices, `str`, ordering,
  `related_name='polls'` on `Game`, cascade delete when the game is deleted.
- `poll_option_test.py` — creation, `str`, ordering, `related_name='options'` on
  `Poll`, cascade delete when the poll is deleted.
- `poll_vote_test.py` — creation for a valid player/option pair; duplicate
  `(player, option)` raises `IntegrityError` (mirroring
  `test_duplicate_character_treasure_raises_integrity_error`); voting for a player
  not in the poll's game raises `ValidationError`; for a `single`-type poll, a second
  vote by the same player for a *different* option in the same poll raises
  `ValidationError`, while a second vote for the *same* option still raises the
  `IntegrityError` above (not the single-type check); for a `multiple`-type poll, a
  player may vote for several different options in the same poll without error;
  cascade delete when the player, option, or poll is deleted.

## Files to Change

- `backend/games/models/poll/poll.py` — new `Poll` model.
- `backend/games/models/poll/poll_option.py` — new `PollOption` model.
- `backend/games/models/poll/poll_vote.py` — new `PollVote` model with vote validation.
- `backend/games/models/__init__.py` — re-export the three new models.
- `backend/games/admin.py` — register the three new models.
- `backend/games/migrations/00XX_poll_polloption_pollvote.py` — generated migration.
- `backend/games/tests/factories.py` — `PollFactory`, `PollOptionFactory`,
  `PollVoteFactory`.
- `backend/games/tests/models/poll/poll_test.py` — new tests.
- `backend/games/tests/models/poll/poll_option_test.py` — new tests.
- `backend/games/tests/models/poll/poll_vote_test.py` — new tests.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job:
  `checks`)

## Notes

- Naming: the issue text said "Pool", but was refined during discussion to "Poll" —
  the standard English term for a vote — for `Poll`/`PollOption`/`PollVote`.
- History tracking (`versioning` app / `HistoricalRecords`) is intentionally skipped
  for these three models in this issue, matching how `GameTreasure` is excluded.
- API endpoints, serializers, and views are explicitly out of scope for this issue
  and should be tracked as a follow-up.
- `PollVote.clean()`'s single-type check only prevents voting for a *different*
  option than one already voted for; voting for the same option twice is already
  rejected by the `unique_together` constraint (`IntegrityError`), so both paths are
  covered without redundant logic.
