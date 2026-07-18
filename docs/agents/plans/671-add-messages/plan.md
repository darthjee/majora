# Plan: Add messages

Issue: [671-add-messages.md](../issues/671-add-messages.md)

## Overview
Add a new top-level Django app, `conversations`, with four models (`Conversation`, `ConversationParticipant`, `Message`, `MessageVisualisation`) and their migrations, mirroring how `statistics` and `games` are structured as sibling apps in `INSTALLED_APPS`. This is a backend-only, models-and-migrations issue — no serializers, views, URLs, or frontend work.

## Context
- `backend/majora_project/settings.py` `INSTALLED_APPS` currently lists `'games'`, `'versioning'`, `'statistics'` as sibling top-level apps. The new `conversations` app is added the same way — not nested inside `games`.
- `backend/games/models/game/player.py`: `Player` belongs to exactly one `Game` (`unique_together = [('game', 'user')]`). Both `Conversation.owner` and `ConversationParticipant.player` link to `games.Player`, not `User` — per the refined issue, this scoping is intentionally *not* enforced at the DB level (no `game` FK on `Conversation`, no cross-model constraint).
- `backend/games/models/game/game_session_message.py` (`GameSessionMessage`) is a pre-existing, unrelated per-`GameSession` chat log with its own `SessionMessagePermission`. The new models are a separate, parallel system — no FK or reference to `GameSession` at all.
- Precedent from `docs/agents/models-organization.md` and `backend/games/models/__init__.py`: multi-model apps use a `models/` package (one class per file) with `__init__.py` re-exporting every class, plus a mirrored `tests/models/` tree — this plan follows that shape for `conversations` rather than a flat `models.py` (which is what the smaller, single-model-family `statistics` app uses).
- `HistoricalRecords(app='versioning', ...)` is selectively applied in this codebase (`Character`, `Game`, `Player`, `Treasure`, photos, etc.) but is consistently absent from message/chat/join-like models (`GameSessionMessage`, `GameTreasure`, `Upload`, `Task`). None of the four new models get history tracking, per the refined issue.
- `backend/games/admin.py` does not register `GameSessionMessage`; following that same precedent, this plan does not add admin registration for the new models either (can be added later if needed).
- `backend/statistics/apps.py` / `backend/games/apps.py` show the standard `AppConfig` shape: `default_auto_field = 'django.db.models.BigAutoField'`, `name = '<app_label>'`.

## Implementation Steps

### Step 1 — Scaffold the `conversations` app
Create `backend/conversations/` with:
- `__init__.py`
- `apps.py` — `ConversationsConfig(AppConfig)` with `default_auto_field = 'django.db.models.BigAutoField'` and `name = 'conversations'`.
- `models/__init__.py` — will re-export the four model classes (populated in Step 2).
- `migrations/__init__.py`
- `tests/__init__.py`, `tests/models/__init__.py`

Add `'conversations'` to `INSTALLED_APPS` in `backend/majora_project/settings.py`, after `'statistics'`.

### Step 2 — Add the four models
Create one file per model under `backend/conversations/models/`:

- `conversation.py` — `Conversation`:
  - `title = models.CharField(max_length=200)` (match the max_length convention used by similar title-like fields, e.g. `Player.name`/`Game.name`; confirm the exact value against an existing title field during implementation).
  - `owner = models.ForeignKey('games.Player', on_delete=models.CASCADE, related_name='owned_conversations')`
  - `__str__` returning the title, matching the codebase convention of a human-readable `__str__` on every model.

- `conversation_participant.py` — `ConversationParticipant`:
  - `conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')`
  - `player = models.ForeignKey('games.Player', on_delete=models.CASCADE, related_name='conversation_participations')`
  - `Meta.unique_together = [('conversation', 'player')]` (a player can only participate once per conversation — mirrors `Player`'s own `unique_together` pattern for join-like uniqueness).

- `message.py` — `Message`:
  - `conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')`
  - `player = models.ForeignKey('games.Player', on_delete=models.CASCADE, related_name='sent_messages')`
  - `body = models.TextField()`
  - `created_at = models.DateTimeField(auto_now_add=True)` (matches `GameSessionMessage.created_at`; needed for any sane default ordering).
  - `Meta.ordering = ['-id']`, matching `GameSessionMessage`.

- `message_visualisation.py` — `MessageVisualisation`:
  - `message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='visualisations')`
  - `player = models.ForeignKey('games.Player', on_delete=models.CASCADE, related_name='message_visualisations')`
  - `not_seen = models.BooleanField(default=False)`
  - `Meta.unique_together = [('message', 'player')]` (one visualisation record per player per message, consistent with the "row only exists once viewed" lifecycle from the issue).

Update `backend/conversations/models/__init__.py` to import and re-export all four classes via `__all__`, matching `backend/games/models/__init__.py`'s pattern.

### Step 3 — Generate and review migrations
Run `poetry run python manage.py makemigrations conversations` (inside the backend container, per `AGENTS.md`'s `make dev`/docker-compose convention) to produce `backend/conversations/migrations/0001_initial.py`. Review the generated migration for correct FK targets (`games.Player`), `on_delete` behavior, and the two `unique_together` constraints.

### Step 4 — Tests
Add one test file per model under `backend/conversations/tests/models/`, mirroring `backend/games/tests/models/`'s style (e.g. `conversation_test.py`, `conversation_participant_test.py`, `message_test.py`, `message_visualisation_test.py`). Cover: field defaults (e.g. `not_seen` defaults to `False`), `__str__` output, `unique_together` constraint violations (creating a duplicate `ConversationParticipant` or `MessageVisualisation` raises `IntegrityError`), and `on_delete=CASCADE` cleanup (deleting a `Conversation`/`Message`/`Player` cascades as expected).

## Files to Change
- `backend/majora_project/settings.py` — add `'conversations'` to `INSTALLED_APPS`.
- `backend/conversations/__init__.py`, `apps.py` — new app scaffold.
- `backend/conversations/models/__init__.py`, `conversation.py`, `conversation_participant.py`, `message.py`, `message_visualisation.py` — new models.
- `backend/conversations/migrations/__init__.py`, `0001_initial.py` — generated migration.
- `backend/conversations/tests/__init__.py`, `tests/models/__init__.py`, `tests/models/conversation_test.py`, `conversation_participant_test.py`, `message_test.py`, `message_visualisation_test.py` — new tests.

## CI Checks
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — will pick up the new `conversations/tests/` tree automatically.
- `backend`: `poetry run ruff check .` (CI job: `checks`) — lint.

## Notes
- No admin registration is included, matching the existing precedent that `GameSessionMessage` (the closest analogous model) isn't registered in `games/admin.py` either. Can be added later if inspection via Django Admin becomes useful.
- `on_delete=CASCADE` is used uniformly here (owner/participant/sender/visualisation all cascade-delete with their `Player`). This differs from `GameSessionMessage.player`, which uses `SET_NULL` to preserve the message after a player is removed. Since this issue only covers models/migrations (no product-facing deletion flows yet), CASCADE is the simpler default; revisit if a future issue needs messages/conversations to outlive a removed player.
- No `game` FK or cross-game validation is added on `Conversation`, per the refined issue — enforcing "all participants share the owner's game" is deferred to a future API-layer issue.
- API endpoints, serializers, views, URLs, and frontend are explicitly out of scope for this issue.
