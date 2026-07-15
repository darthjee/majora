# Issue: Add game poll

## Description
Add a voting "Poll" feature so players can vote within a game. This issue covers only the data model layer — models, migrations, and Django Admin registration. API endpoints, serializers, and views are out of scope and will be addressed in a follow-up issue.

## Solution
Add three new models under `backend/games/models/poll/`, following the existing `models/game/`-style resource grouping (see [models-organization.md](../models-organization.md)):

### Poll
- Belongs to a `Game` (FK).
- `type`: choice field — `multiple` (several options selectable) or `single` (only one option selectable) — using the repo's constants + `*_CHOICES` list convention (e.g. `Upload.STATUS_CHOICES`, `Character.ALLEGIANCE_CHOICES`).
- `status`: choice field — `open` (players can vote), `inactive` (no one can vote yet), `closed` (no one can vote; final).

### PollOption
- Belongs to a `Poll` (FK).
- `option`: string field naming the option.
- Standard `id` and relational fields as needed.

### PollVote
- Through-model linking a `Player` to a `PollOption`, following the `CharacterTreasure`-style through-model convention.
- A player may be linked to a given option only once.
- The voting player must belong to the poll's game (i.e. be in `poll.game.players`) — enforced via model-level validation, since `Player` is a global model only related to games through a many-to-many (`Player.games`), not scoped per-game.
- For `type=single` polls, a player may vote for only one option per poll. This cannot be expressed as a plain DB `unique_together` since it depends on the parent poll's `type` — enforced via model-level validation (e.g. `clean()`/`save()`), consistent with this issue defining the full voting rules up front.
- For `type=multiple` polls, a player may be linked to several options per poll, but only once per option.

All three models get entries in `backend/games/models/__init__.py`'s re-export list, and Admin registrations, matching existing conventions. They are **not** added to the `versioning` app's tracked-models list — like `GameTreasure`, history tracking is intentionally skipped for now.
