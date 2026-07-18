# Backend Plan: Add user display name

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section — backend produces every field/endpoint
listed there; frontend only consumes them.

## Implementation Steps

### Step 1 — Model and migrations

- Add `display_name = models.CharField(max_length=150, unique=True, null=True)` to
  `UserProfile` (`backend/games/models/user_profile.py`). Nullable at the DB level so the
  `AddField` migration doesn't need a default for existing rows (mirrors the two-step
  add-then-backfill shape of `0058_gametreasure_hidden.py`/`0059_backfill_gametreasure_hidden.py`);
  application code always treats it as populated once the backfill below has run, since every
  write path (registration, my-account update) requires it going forward.
- Migration 1 (`AddField`): `display_name` on `UserProfile`, nullable, unique.
- Migration 2 (`RunPython` data migration): for every `User` row, `get_or_create` its
  `UserProfile` (not every user has one yet — it's created lazily elsewhere via
  `UserProfile.objects.get_or_create(user=user)`) and set `display_name = user.username` if not
  already set. Use `apps.get_model('games', 'UserProfile')` / `apps.get_model('auth', 'User')`
  (historical models, per the `0059` precedent) — do not call the real `UserProfile.save()`
  override (it recomputes `email_hash`, irrelevant here and not needed on historical models).
  Usernames are already unique, so the backfilled `display_name` values satisfy the new
  uniqueness constraint with no collisions.
- No `RunPython` reverse needed beyond a no-op (matches `0059`'s `_noop_reverse` — the `AddField`
  reversal drops the column).

### Step 2 — Expose `display_name` on my-account (self)

- `backend/games/serializers/auth/my_account_detail.py` — add
  `display_name = serializers.SerializerMethodField()` (or a `source='profile.display_name'`
  field, whichever reads more naturally given the serializer already does
  `UserProfile.objects.get_or_create(user=user)` for `avatar_url` — reuse that profile lookup
  rather than querying twice) alongside the existing `name`/`first_name`/`last_name`/`email`.
- `backend/games/serializers/auth/my_account_update.py` — add `display_name =
  serializers.CharField(max_length=150)` (required, no `allow_blank`), a `validate_display_name`
  uniqueness check mirroring `validate_name`'s pattern (exclude the current user's own
  `UserProfile`, reject if another one already has this value), and update `.update()` to also
  persist `instance_profile.display_name = validated_data['display_name']` via
  `UserProfile.objects.get_or_create(user=instance)` (the same helper already used by
  `_refresh_email_hash`).

### Step 3 — Registration requires `display_name`

- `backend/games/views/auth/_shared.py` — add `'display_name'` to `REGISTER_REQUIRED_FIELDS`;
  add `_validate_unique_display_name` (mirrors `_validate_unique_name`, checking
  `UserProfile.objects.filter(display_name=data.get('display_name')).exists()`) to the
  `validators` tuple in `_validate_register_payload`; in `_create_registered_user`, after
  `User.objects.create_user(...)`, create the profile with
  `UserProfile.objects.create(user=user, display_name=data.get('display_name'))` (no profile
  exists yet for a brand-new user, so `create` rather than `get_or_create` is fine here).

### Step 4 — Switch other-user-facing serializers to `display_name`

- `backend/games/serializers/games/sessions/messages/session_message_user.py::get_name` —
  currently `return user.username`; change to resolve the linked `UserProfile.display_name`
  (via `UserProfile.objects.get_or_create(user=user)`, same pattern `get_avatar_url` already
  uses in this file, or a single combined lookup shared between the two methods to avoid a
  double query per message).
- `backend/games/serializers/games/polls/poll_vote_user.py` — no change needed; it subclasses
  `SessionMessageUserSerializer` and inherits the fixed `get_name`.

### Step 5 — Staff endpoints unchanged

- `backend/games/serializers/staff/staff_user_list.py`, `staff_user_detail.py`,
  `staff_user_update.py` — no changes; per the issue, staff continues to see/edit only the real
  `name` (`username`), not `display_name`.

### Step 6 — Docs

- `docs/agents/access-control/user.md` — no change (staff-facing fields are unaffected).
- `docs/agents/access-control/game-session-message.md` — update the "Reduced author view" note
  (currently: "`name` (the poster's username)") to say `name` now resolves to
  `UserProfile.display_name`, not `User.username`.
- `docs/agents/access-control/poll.md` — same update to its `name` (`User.username`) note for
  the poll-voter reduced view.
- `docs/agents/product.md` — the "User (Account)" entity description currently says "Its 'name'
  for management purposes is the Django `username` field; there is no separate first/last name
  field" — this is already stale (first/last name exist per issue #636) and should be corrected
  in this same PR while adding a note about the new `display_name` (public-facing) vs `username`
  (real, login) distinction.

## Files to Change

- `backend/games/models/user_profile.py` — add `display_name`
- `backend/games/migrations/` — new `AddField` + `RunPython` backfill migrations
- `backend/games/serializers/auth/my_account_detail.py` — expose `display_name`
- `backend/games/serializers/auth/my_account_update.py` — accept/validate/persist
  `display_name`
- `backend/games/views/auth/_shared.py` — require + validate + persist `display_name` at
  registration
- `backend/games/serializers/games/sessions/messages/session_message_user.py` — source `name`
  from `display_name`
- `docs/agents/access-control/game-session-message.md`, `docs/agents/access-control/poll.md`,
  `docs/agents/product.md`
- Corresponding test files under `backend/games/tests/` mirroring every changed/added file
  above (models, migrations, serializers, views), plus `backend/games/tests/factories.py` if
  `UserProfileFactory`/`UserFactory` need a `display_name` default

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers
  models, migrations, serializers, factories
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers `my_account`, `register`
- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`) —
  covers session-message and poll views, if their tests live under this tree

## Notes

- Run inside the project containers per `AGENTS.md` (`docker-compose run --rm majora_tests
  pytest ...`), never directly on the host.
- Existing users who register before this migration ships all get `display_name = username`
  seeded — no forced rename flow; they can change it later from `/#/my_account`.
- `display_name` is required going forward (registration, my-account update) but nullable at
  the DB level purely so the `AddField` migration doesn't need a default — don't read that
  nullability as "optional" at the API layer.
