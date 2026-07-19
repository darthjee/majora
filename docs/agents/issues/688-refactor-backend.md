# Issue: Refactor backend

## Description
Find and refactor 10 concrete cases in the backend to improve code quality, focused on code repetition, methods that are too big / have too many responsibilities, and loops with too many steps.

## Problem
A backend investigation (models, serializers, views, permissions, authentication) turned up several recurring code-quality issues:

- Duplicated logic copy-pasted across multiple classes/files instead of being extracted into a shared helper, mixin, or base class.
- A few methods/views that take on too many responsibilities at once (query building, filtering, ordering, pagination, cache headers all inline).
- Filter helpers that already exist in one place being reimplemented from scratch elsewhere.

## Solution
Refactor the following 10 cases (file/method references from the current codebase):

1. **Duplicated env-int parsing** — `backend/games/settings.py` (`pagination_size`, `password_reset_token_expiration_minutes`, `upload_expiration_minutes`, `cache_control_anonymous_max_age`, `cache_control_authenticated_max_age`) and `backend/statistics/settings.py` (`cookie_max_age_seconds`) each repeat the same `try: return int(os.environ.get(KEY, default)) except (ValueError, TypeError): return default` block. Extract a shared `env_int(key, default)` utility used by both apps.
2. **Near-identical photo models** — `backend/games/models/character/character_photo.py`, `game/game_photo.py`, `treasure/treasure_photo.py`, `character/character_item_photo.py`, `game/game_item_photo.py` each define the same `path`/`ready`/`history` fields and `__str__`, differing only in the owning FK. Extract an abstract `BasePhoto` base model.
3. **Duplicated admin-or-player predicate** — `backend/games/permissions.py` repeats `user.is_superuser or user.is_staff or game.players.filter(user=user).exists()` in `SessionMessagePermission._can_view`, `PollPermission._is_allowed`, `PlayerPermission._is_allowed`, and `PollVotePermission._can_view`. Extract a shared `_is_admin_or_player(user, game)` helper.
4. **Repeated guard-check shape** — About ten `check*` classmethods in `backend/games/permissions.py` repeat the same "check unauthenticated, then check a predicate, then return forbidden or None" shape. Collapse into a single guarded-check template method that takes the predicate as an argument.
5. **Duplicated account-uniqueness rules** — `backend/games/views/auth/_shared.py` and `backend/games/serializers/auth/my_account_update.py` each independently implement the same unique `name`/`display_name`/`email` checks with slightly different query styles. Extract one shared uniqueness-check utility used by both.
6. **Copy-pasted serializer mixin logic** — `backend/games/serializers/base_access.py` and `backend/games/serializers/base_permissions.py` duplicate the same `data` property and `_user()` method verbatim. Extract a shared mixin (e.g. `RequestContextSerializerMixin`).
7. **Reimplemented treasure filters** — `backend/games/views/treasures/treasures_list.py` reimplements filtering logic that already exists as reusable helpers in `backend/games/views/games/_treasure_filters.py` (used by `game_treasures.py`). Reuse the existing helpers instead of duplicating them.
8. **Near-identical min/max value filters** — in `backend/games/views/games/_treasure_filters.py`, `filter_by_min_value` and `filter_by_max_value` are identical apart from the `gte`/`lte` lookup suffix. Merge into one parameterized helper.
9. **Duplicated email-sending logic** — `backend/games/views/auth/_shared.py` (`send_test_email`, `send_welcome_email`) and `backend/games/views/password_reset/_shared.py` (`send_password_reset_email`) each implement the same "if emails enabled, render template, send_mail" flow. Extract one shared `_send_email(user, template, subject, context=None)` helper.
10. **Oversized `character_treasures` view** — `backend/games/views/game/_treasures.py` handles character lookup, the hidden-character gate, hidden-treasure filtering, value annotation, ordering, three separate query-param filters, context building, pagination, and cache-header logic all in one function. Extract a small query-builder class (mirroring the pattern already used in the neighboring `_treasure_exchange.py`).

## Benefits
- Less duplicated logic to keep in sync when behavior changes.
- Smaller, single-responsibility methods that are easier to read, test, and extend.
- Consistent reuse of existing helpers instead of parallel reimplementations that can drift apart.
