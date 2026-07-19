# Backend Plan: Move login to a dedicated module

Main plan: [plan.md](plan.md)

## Shared contracts

None to produce or consume — see [plan.md](plan.md)'s "Shared contracts". Every `/users/*.json`
endpoint keeps its exact current path, method, payload, and response shape; only the Python
module that implements it moves.

## Context

Today all account/authentication code lives inside the `games` app, mixed in with unrelated
gameplay code (games, characters, treasures, ...):

- Views: `games/views/auth/` (login, logout, register, status, account, email, language) and
  `games/views/password_reset/` (recover, reset_password)
- Serializers: `games/serializers/auth/` (my_account_detail, my_account_update)
- Models: `games/models/user_profile.py` (`UserProfile`), `games/models/password_reset_token.py`
  (`PasswordResetToken`)
- Auth backend: `games/authentication.py` (`CookieTokenAuthentication`) — used far beyond auth
  code, as the `DEFAULT_AUTHENTICATION_CLASSES` for the whole project and directly imported by
  ~40 view files across `games/views/`
- Helpers: `games/account_uniqueness.py`, `games/url_builder.py` (`FrontendBaseUrl`)
- URLs: `games/urls/auth.py`
- Email templates: `games/templates/games/{welcome_email,test_email,password_reset_email}.txt`
- Tests: `games/tests/auth/`, `games/tests/password_reset/`, `games/tests/serializers/auth/`,
  `games/tests/authentication_test.py`, `games/tests/url_builder_test.py`,
  `games/tests/models/user_profile_test.py`

There is no existing `accounts`/`users` app; `INSTALLED_APPS` currently lists only `games`,
`versioning`, `statistics`, `conversations`.

**Not moving** (used by non-auth code too, stay in `games`):
- `games/gravatar.py` (`GravatarUrlBuilder`) — also used by
  `serializers/games/players/player_user.py` and
  `serializers/games/sessions/messages/session_message_user.py`
- `games/settings.py` (`Settings`) — a general app-config facade (pagination, cache-control,
  upload expiration, *and* the two auth-relevant settings). `accounts` will import
  `from games.settings import Settings` for `password_reset_token_expiration_minutes()` and
  `emails_enabled()`, the same way `versioning` already depends on `games` models.
- `games/views/staff/staff_user_recovery_link.py` — a staff-management endpoint
  (`staff/users/:id/recovery-link.json`), not a self-service account action. It stays in
  `games/views/staff/`, but its imports of `CookieTokenAuthentication` and
  `get_or_create_recovery_token`/`build_recovery_url` must be updated to point at `accounts`.
- `games/tests/factories.py` — the shared cross-app test-factory module (imported by
  `statistics`, `conversations`, `versioning`, and most of `games`' own tests). It stays in
  `games/tests/`; only its `from games.models import ... UserProfile` line changes to import
  `UserProfile` from `accounts.models` instead.
- `games/tests/models/user_profile_email_hash_migration_test.py` and
  `user_profile_display_name_migration_test.py` — these test **`games`' own historical data
  migrations** (`0046_userprofile_email_hash`, `0062_backfill_userprofile_display_name`), which
  stay in `games/migrations/` untouched (migration history is immutable/additive, never
  rewritten). Only their `UserProfile` import changes to `accounts.models`.

## Implementation Steps

### Step 1 — Scaffold the `accounts` app

Create `backend/accounts/` following the same shape as `games`/`versioning`/`conversations`:
`__init__.py`, `apps.py` (`AccountsConfig`, `name = 'accounts'`,
`default_auto_field = 'django.db.models.BigAutoField'`), `models/`, `views/`, `serializers/`,
`migrations/`, `tests/`, `templates/accounts/`, and a top-level `urls.py` (flat, like
`games/urls/auth.py` was — no need for the multi-file concatenation `games/urls/` uses, since
`accounts` only has one group of routes).

Add `'accounts'` to `INSTALLED_APPS` in `backend/majora_project/settings.py`, after `'games'`.

### Step 2 — Move the models (`UserProfile`, `PasswordResetToken`)

This is the highest-risk step: both models must keep their exact existing MySQL tables
(`games_userprofile`, `games_passwordresettoken`) and all existing rows — this must be a
**migration-state-only move**, never a real `DROP TABLE`/`CREATE TABLE`.

1. Move `games/models/user_profile.py` and `games/models/password_reset_token.py` to
   `accounts/models/`, updating their internal imports (`password_reset_token.py`'s
   `from games.settings import Settings` stays as-is — `Settings` isn't moving).
2. On both moved models, add an explicit `class Meta: db_table = 'games_userprofile'` /
   `'games_passwordresettoken'` so Django keeps writing to the same physical table under the
   new app label (Django's default table name would otherwise become
   `accounts_userprofile`/`accounts_passwordresettoken`).
3. Add a new migration in `games/migrations/` that removes the two models from `games`'
   migration **state only**:
   ```python
   migrations.SeparateDatabaseAndState(
       state_operations=[
           migrations.DeleteModel(name='UserProfile'),
           migrations.DeleteModel(name='PasswordResetToken'),
       ],
   )
   ```
   (`database_operations` left empty/omitted — no real DDL runs.)
4. Add `accounts/migrations/0001_initial.py` that adds the two models to `accounts`' migration
   state only, via `migrations.SeparateDatabaseAndState(state_operations=[...CreateModel...])`
   mirroring the exact fields/options Django would normally generate for each model (including
   the `db_table` Meta from step 2), with `dependencies` on the `games` migration from step 3
   (so state removal happens before state addition) and on `auth.__first__` (both models FK
   `django.contrib.auth.models.User`).
5. Verify with `poetry run python manage.py makemigrations --check --dry-run` (or equivalent)
   that Django sees no further model changes are pending, and that
   `python manage.py sqlmigrate` for both new migrations shows no SQL at all.
6. Move the corresponding model tests: `games/tests/models/user_profile_test.py` →
   `accounts/tests/models/user_profile_test.py` (this one tests the model's own
   behavior — `save()`, `email_hash`, `__str__` — not a `games` migration, so it belongs with
   the model). Leave the two migration-backfill test files in `games/tests/models/` per
   "Not moving" above, only updating their `UserProfile` import.

### Step 3 — Move `CookieTokenAuthentication`

1. Move `games/authentication.py` → `accounts/authentication.py` and
   `games/tests/authentication_test.py` → `accounts/tests/authentication_test.py`, unchanged.
2. Update `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']` in
   `backend/majora_project/settings.py` to `'accounts.authentication.CookieTokenAuthentication'`.
3. Update every one of the ~40 `games/views/**/*.py` files that currently do
   `from ...authentication import CookieTokenAuthentication` (or `from ..`/`from ....`, varying
   by depth) to the single absolute form `from accounts.authentication import
   CookieTokenAuthentication` — this sidesteps having to recompute the relative dot-count per
   file. A repo-wide search-and-replace is appropriate here; verify afterward with
   `grep -rn "from \.\+authentication import CookieTokenAuthentication" backend/games` (must
   return nothing) and `grep -rn "from accounts.authentication import" backend/games` (must
   match every previous call site).

### Step 4 — Move the auth/account/password-reset views and serializers

Move as complete subtrees, preserving their internal structure (both `auth/` and
`password_reset/` are explicitly *excluded* from the `views-organization.md` nesting convention
already, since every route there is a flat current-user action — no reason to restructure them
further while moving):

- `games/views/auth/` → `accounts/views/auth/`
- `games/views/password_reset/` → `accounts/views/password_reset/`
- `games/serializers/auth/` → `accounts/serializers/auth/`
- `games/tests/auth/` → `accounts/tests/auth/`
- `games/tests/password_reset/` → `accounts/tests/password_reset/`
- `games/tests/serializers/auth/` → `accounts/tests/serializers/auth/`

Within these, update imports that pointed at now-moved or games-only code:
- `views/auth/_shared.py`: `from games.account_uniqueness import ...` → move
  `account_uniqueness.py` itself to `accounts/account_uniqueness.py` (it's only used by
  `views/auth/_shared.py` and `serializers/auth/my_account_update.py`, both moving) and update
  both call sites to `from accounts.account_uniqueness import ...`.
- `views/auth/_shared.py`, `serializers/auth/my_account_detail.py`: keep
  `from games.settings import Settings` / `from games.gravatar import GravatarUrlBuilder` as
  cross-app imports (see "Not moving" above).
- `views/password_reset/_shared.py`: `from games.url_builder import FrontendBaseUrl` → move
  `url_builder.py` to `accounts/url_builder.py` (only used here) and update the import to
  `from accounts.url_builder import FrontendBaseUrl`; move `games/tests/url_builder_test.py` →
  `accounts/tests/url_builder_test.py` alongside it.
- `views/password_reset/_shared.py`: `from games.views.auth._shared import _send_email` →
  `from accounts.views.auth._shared import _send_email` (both sides now live in `accounts`).
- `views/auth/login.py`, `views/auth/logout.py`: keep `from statistics...` imports unchanged
  (cross-app, `statistics` is unrelated to this move).
- `views/auth/status.py`, `views/auth/language.py`, `views/auth/_shared.py`,
  `serializers/auth/*.py`: `from ...models import UserProfile` /
  `from games.models import UserProfile` → `from accounts.models import UserProfile` (now a
  same-app import within `accounts`).

### Step 5 — Move email templates

Move `games/templates/games/{welcome_email,test_email,password_reset_email}.txt` to
`accounts/templates/accounts/{welcome_email,test_email,password_reset_email}.txt`, and update
the three `render_to_string('games/....txt', ...)` calls in `accounts/views/auth/_shared.py` and
`accounts/views/password_reset/_shared.py` to `'accounts/....txt'`.

### Step 6 — Move URLs

1. Move the contents of `games/urls/auth.py` into `accounts/urls.py`, changing
   `from .. import views` to `from accounts import views` (or explicit per-view imports).
2. Remove `auth` from `games/urls/__init__.py`'s imports and `urlpatterns` concatenation, and
   delete `games/urls/auth.py`.
3. In `backend/majora_project/urls.py`, add `path('', include('accounts.urls'))` alongside the
   existing `path('', include('games.urls'))`.

### Step 7 — Fix the remaining cross-app call sites left in `games`

- `games/serializers/games/players/player_user.py`,
  `games/serializers/games/sessions/messages/session_message_user.py`: 
  `from games.models import UserProfile` → `from accounts.models import UserProfile`.
- `games/views/staff/staff_user_recovery_link.py`: 
  `from ...authentication import CookieTokenAuthentication` → 
  `from accounts.authentication import CookieTokenAuthentication`; 
  `from ..password_reset._shared import build_recovery_url, get_or_create_recovery_token` → 
  `from accounts.views.password_reset._shared import build_recovery_url, get_or_create_recovery_token`.
- `games/tests/factories.py`: `from games.models import (..., UserProfile)` → import
  `UserProfile` from `accounts.models` instead (keep the rest of the `games.models` import as
  is).
- `games/tests/models/user_profile_email_hash_migration_test.py`,
  `user_profile_display_name_migration_test.py`,
  `games/tests/views/game_sessions/session_messages_list_test.py`,
  `games/tests/views/polls/game_poll_votes_test.py`,
  `games/tests/views/staff/staff_user_recovery_link_test.py`,
  `games/tests/serializers/games/players/player_user_test.py`,
  `games/tests/settings_test.py`: update their `UserProfile`/`PasswordResetToken` imports the
  same way.

### Step 8 — Update documentation

- `docs/agents/architecture.md`: add an `### accounts/` subsection (modeled on the existing
  `### versioning/` one) describing the new app — models, views, serializers, urls, templates —
  and trim the corresponding auth/account bullets out of the `### games/` section.
- Root `AGENTS.md`: if it lists `/users/*.json` endpoints or the `games` app's model list by
  name, adjust wording to reflect the split (endpoints themselves are unchanged, only which app
  implements them).

### Step 9 — Full verification sweep

After all moves, confirm nothing was missed:
```bash
grep -rn "games\.authentication\|games\.models import UserProfile\|games\.models import PasswordResetToken\|games\.account_uniqueness\|games\.url_builder\|games/urls/auth\|games/views/auth\|games/views/password_reset\|games/serializers/auth" backend --include=*.py
```
This should return nothing outside of comments/docs. Then run the full backend test suite
(Step below) and confirm all auth/account/password-reset/staff-recovery/session-message/
player-serializer tests still pass, and that `poetry run ruff check .` is clean.

## Files to Change

- `backend/accounts/` (new) — `apps.py`, `models/`, `views/`, `serializers/`, `urls.py`,
  `authentication.py`, `account_uniqueness.py`, `url_builder.py`, `migrations/`,
  `templates/accounts/`, `tests/`
- `backend/games/models/__init__.py` — drop `UserProfile`/`PasswordResetToken` imports/exports
- `backend/games/migrations/` — new state-only `DeleteModel` migration for both models
- `backend/games/authentication.py`, `games/account_uniqueness.py`, `games/url_builder.py` —
  deleted (moved)
- `backend/games/views/auth/`, `games/views/password_reset/`, `games/serializers/auth/` —
  deleted (moved)
- `backend/games/urls/auth.py` — deleted; `games/urls/__init__.py` — drop `auth` reference
- `backend/games/templates/games/{welcome_email,test_email,password_reset_email}.txt` —
  deleted (moved)
- `backend/games/views/staff/staff_user_recovery_link.py`,
  `games/serializers/games/players/player_user.py`,
  `games/serializers/games/sessions/messages/session_message_user.py` — import updates only
- `backend/games/tests/factories.py` and the test files listed in Step 7/9 — import updates
  only
- `backend/majora_project/settings.py` — `INSTALLED_APPS`, `DEFAULT_AUTHENTICATION_CLASSES`
- `backend/majora_project/urls.py` — `include('accounts.urls')`
- `docs/agents/architecture.md`, `AGENTS.md` — documentation updates

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info`
  (CI job: `pytest_all`) — the new `accounts/tests/` tree and the moved `games/tests/models/`,
  `games/tests/serializers/`, `games/tests/authentication_test.py` etc. all fall under this job
  since none of them live under `games/tests/views/`.
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov ...`
  (CI job: `pytest_views_rest`) — covers the updated
  `games/tests/views/staff/staff_user_recovery_link_test.py`,
  `games/tests/views/game_sessions/session_messages_list_test.py`,
  `games/tests/views/polls/game_poll_votes_test.py`.
- `backend`: `poetry run ruff check .` (CI job: `checks`)

Run locally via `docker-compose run --rm majora_tests pytest` and
`docker-compose run --rm majora_tests ruff check .` (per `AGENTS.md`'s convention of always
running through Docker).

## Notes

- The model-move migration (Step 2) is the one genuinely risky part of this issue: getting the
  `SeparateDatabaseAndState`/`db_table` details wrong could make Django attempt to actually drop
  and recreate `games_userprofile`/`games_passwordresettoken` in production, losing all user
  profiles and password-reset tokens. Test this against a copy of a realistic database (or at
  minimum, carefully inspect `sqlmigrate` output for both new migrations) before considering
  this step done.
- `games` and `accounts` end up depending on each other (`accounts` imports `games.settings` and
  `games.gravatar`; `games` imports `accounts.models`/`accounts.authentication`). This is safe —
  neither module imports the other at its own top level in a way that cycles — but is worth a
  second look during review given how unusual bidirectional app dependencies are elsewhere in
  this codebase (`versioning`/`conversations`/`statistics` only ever get imported by `games`,
  never the reverse).
- Whether to also flatten `accounts/views/auth/` down to `accounts/views/` (since "auth" inside
  an app already called "accounts" reads as redundant) was considered and deliberately deferred
  — kept as a straight subtree move to minimize risk/diff size for this already-large change;
  a follow-up cosmetic issue can revisit it.
