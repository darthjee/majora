# Plan: Refactor backend

Issue: [688-refactor-backend.md](../issues/688-refactor-backend.md)

## Overview

Refactor 10 concrete code-quality issues found across `backend/`: mostly duplicated logic
(env-var parsing, photo models, permission predicates, account-uniqueness checks, serializer
mixins, treasure filters, email sending) plus one oversized view function. Every change is
backend-only (Python/Django), so this is a single-agent plan with no agent split. Each item is
independent and can be implemented and reviewed as its own commit/step; none of them change
observable behavior — this is a pure internal refactor, so existing tests must keep passing
unchanged (aside from tests that need updating because they exercised now-removed duplicate
code directly).

## Context

A backend investigation (see the issue) found that this codebase is already fairly
well-factored — small private methods, thin views — so almost all findings are **duplicated
code** that should be extracted into a shared helper, mixin, or base class, plus one view that
has accumulated too many responsibilities. No behavior should change; every step below is a
structural refactor only.

## Implementation Steps

### Step 1 — Extract `env_int` helper for env-var parsing

`backend/games/settings.py` and `backend/statistics/settings.py` each repeat the same
`try: return int(os.environ.get(KEY, default)) except (ValueError, TypeError): return default`
block, 6 times total (`pagination_size`, `password_reset_token_expiration_minutes`,
`upload_expiration_minutes`, `cache_control_anonymous_max_age`,
`cache_control_authenticated_max_age` in `games`, and `cookie_max_age_seconds` in
`statistics`).

Create `backend/majora_project/env.py` (shared by both Django apps, since neither app should
depend on the other) with:

```python
def env_int(key, default):
    """Return the int value of environment variable `key`, or `default` if unset/invalid."""
    try:
        return int(os.environ.get(key, default))
    except (ValueError, TypeError):
        return default
```

Update every method in both `Settings` classes to call `env_int(KEY, default)` instead of the
repeated try/except block.

### Step 2 — Extract `BasePhoto` abstract model

`backend/games/models/character/character_photo.py`, `game/game_photo.py`,
`treasure/treasure_photo.py`, `character/character_item_photo.py`, and
`game/game_item_photo.py` each define an identical `path`/`ready`/`history` shape and
`__str__` returning `self.path`, differing only in their owning `ForeignKey`.

Create `backend/games/models/base_photo.py` with an abstract `BasePhoto(models.Model)`
carrying `path`, `ready`, `history = HistoricalRecords(app='versioning',
user_db_constraint=False)`, `__str__`, and `class Meta: abstract = True`. Each of the 5
concrete models then only adds its own FK field and keeps its own docstring/class name.

Verify with `django-simple-history` that an abstract base class with `HistoricalRecords` is
supported (it is — each concrete subclass gets its own historical model/table). Run
`makemigrations` after the change and confirm it produces **no** migration (table names and
columns must stay identical) — if it does produce one, something in the field definitions
diverged from the original and needs fixing before this step is done.

### Step 3 — Extract `_is_admin_or_player` permission helper

In `backend/games/permissions.py`, the predicate `user.is_superuser or user.is_staff or
game.players.filter(user=user).exists()` is duplicated verbatim in
`SessionMessagePermission._can_view`, `PollPermission._is_allowed`,
`PlayerPermission._is_allowed`, and `PollVotePermission._can_view`.

Add a shared helper — a module-level function `_is_admin_or_player(user, game)` (or a
`classmethod` on `_EditPermission`, whichever reads more naturally next to the existing
`_unauthenticated_response`/`_forbidden_response` helpers) — and replace all 4 call sites.

### Step 4 — Collapse the repeated guard-check shape in `permissions.py`

About 10 `check`/`check_view`/`check_create`/`check_vote` classmethods across
`backend/games/permissions.py` repeat the exact same 5-line shape:

```python
unauthenticated = cls._unauthenticated_response(request)
if unauthenticated:
    return unauthenticated
if not cls._is_allowed(...):
    return cls._forbidden_response()
return None
```

Add a `_guarded_check(cls, request, predicate)` classmethod to `_EditPermission` that takes a
zero-arg callable (`predicate`) returning a bool, and performs the unauthenticated check +
predicate check + forbidden response in one place. Rewrite each `check*` method as a one-liner
that calls `cls._guarded_check(request, lambda: cls._is_allowed(request.user, obj))` (or
equivalent). Keep each method's existing docstring — only the body collapses.

Do this step after Step 3 so `_is_admin_or_player` is already available and doesn't need a
separate pass.

### Step 5 — Extract shared account-uniqueness checks

`backend/games/views/auth/_shared.py` (`_validate_unique_name`, `_validate_unique_display_name`,
`_validate_unique_email`, used by registration) and
`backend/games/serializers/auth/my_account_update.py` (`validate_name`, `validate_display_name`,
`validate_email`) independently implement the same three uniqueness rules — the register path
checks `User`/`UserProfile` with no exclusion (new user), the update path excludes the current
instance (`exclude(pk=...)`/`exclude(user=...)`).

Extract shared query helpers (e.g. in `backend/games/views/auth/_shared.py`, imported by the
serializer) that take an optional `exclude_pk`/`exclude_user` parameter, such as:

```python
def username_taken(name, exclude_pk=None):
    qs = User.objects.filter(username=name)
    if exclude_pk is not None:
        qs = qs.exclude(pk=exclude_pk)
    return qs.exists()
```

...and equivalents for display_name and email. Update both the registration validators and the
`MyAccountUpdateSerializer.validate_*` methods to call these helpers instead of duplicating the
query.

### Step 6 — Extract shared serializer mixin (`data` property + `_user()`)

`backend/games/serializers/base_access.py`'s `BaseAccessSerializer` and
`backend/games/serializers/base_permissions.py`'s `BasePermissionsSerializer` both define an
identical `data` property (memoized `to_representation(self.instance)`) and `_user()` method.

Create `backend/games/serializers/_request_context_mixin.py` with a
`RequestContextSerializerMixin` providing `data` and `_user()`. Have both
`BaseAccessSerializer` and `BasePermissionsSerializer` inherit from
`(RequestContextSerializerMixin, serializers.Serializer)` and drop their own copies.

### Step 7 — Reuse `_treasure_filters.py` helpers in `treasures_list.py`

`backend/games/views/treasures/treasures_list.py` defines its own
`_filter_by_min_value`/`_filter_by_max_value`/`_filter_by_name`, reimplementing logic that
already exists as reusable helpers in `backend/games/views/games/_treasure_filters.py`
(`filter_by_min_value`, `filter_by_max_value`, `filter_by_name` — already used this way by
`backend/games/views/game/_treasures.py`).

Import `filter_by_min_value`, `filter_by_max_value`, `filter_by_name` from
`..games._treasure_filters` and call them with `field='value'` (the field name differs from
the shared default `'game_value'` since `treasures_list` filters the plain `Treasure` model,
not a game-scoped queryset) for min/max, and the default `field='name'` for name filtering.
Delete the three local `_filter_by_*` functions from `treasures_list.py` once nothing calls
them.

### Step 8 — Merge min/max value filters into one parameterized helper

In `backend/games/views/games/_treasure_filters.py`, `filter_by_min_value` and
`filter_by_max_value` are identical apart from the `gte`/`lte` lookup suffix. Merge into one
private helper:

```python
def _filter_by_value(request, queryset, param, lookup, field):
    value = request.GET.get(param)
    if value is None:
        return queryset
    try:
        value = int(value)
    except ValueError:
        return queryset
    return queryset.filter(**{f'{field}__{lookup}': value})


def filter_by_min_value(request, queryset, field='game_value'):
    return _filter_by_value(request, queryset, 'min_value', 'gte', field)


def filter_by_max_value(request, queryset, field='game_value'):
    return _filter_by_value(request, queryset, 'max_value', 'lte', field)
```

Keep the public `filter_by_min_value`/`filter_by_max_value` signatures unchanged so every
existing caller (including the ones updated in Step 7) keeps working without changes.

### Step 9 — Extract shared `_send_email` helper

`backend/games/views/auth/_shared.py` (`send_test_email`, `send_welcome_email`) and
`backend/games/views/password_reset/_shared.py` (`send_password_reset_email`) each
independently implement "if emails enabled, render template, send_mail".

Add a private `_send_email(user, template, subject, context=None)` helper (in
`auth/_shared.py`, imported by `password_reset/_shared.py`, or in a new small shared module if
that creates an awkward import direction — check for any existing cross-import between these
two `_shared.py` modules before choosing) that does:

```python
def _send_email(user, template, subject, context=None):
    if not Settings.emails_enabled():
        return
    message = render_to_string(template, context or {})
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )
```

Rewrite `send_test_email`, `send_welcome_email`, and `send_password_reset_email` as thin
wrappers that build the right `template`/`subject`/`context` and delegate to `_send_email`.
Note `send_test_email`/`send_welcome_email` pass `{'username': user.username}` while
`send_password_reset_email` passes `{'recovery_url': ..., 'expiration_minutes': ...}` — keep
each function's own context-building logic, only the enabled-check/render/send-mail body is
shared.

### Step 10 — Split `character_treasures` into smaller helpers

`backend/games/views/game/_treasures.py`'s `character_treasures` handles character lookup,
the hidden-character gate, hidden-treasure filtering, value annotation, ordering, three query-
param filters, context building, pagination, and cache-header logic all in one function.

Following this file's own existing convention of small private helper functions (not classes
— see the sibling `_treasure_exchange.py`'s `_authorize_and_parse`/`_find_game_treasure`
pattern), extract at least:

- `_build_character_treasure_queryset(game, character, npc, allow_hidden)` — owns the
  `select_related`/`filter(quantity__gt=0)`, the `_exclude_hidden_treasures` call, the
  `game_value` annotation, and the ordering.
- `_apply_treasure_filters(request, treasures)` — owns the three `filter_by_*` calls.

`character_treasures` itself then reads as: resolve character → hidden gate → build queryset →
apply filters → build context → paginate → set cache header. Keep `_exclude_hidden_treasures`
as-is (already a separate function).

## Files to Change

- `backend/majora_project/env.py` — new, `env_int` helper (Step 1)
- `backend/games/settings.py`, `backend/statistics/settings.py` — use `env_int` (Step 1)
- `backend/games/models/base_photo.py` — new, abstract `BasePhoto` (Step 2)
- `backend/games/models/character/character_photo.py`,
  `backend/games/models/game/game_photo.py`,
  `backend/games/models/treasure/treasure_photo.py`,
  `backend/games/models/character/character_item_photo.py`,
  `backend/games/models/game/game_item_photo.py` — inherit `BasePhoto` (Step 2)
- `backend/games/permissions.py` — `_is_admin_or_player` + `_guarded_check` (Steps 3-4)
- `backend/games/views/auth/_shared.py` — uniqueness helpers, `_send_email` (Steps 5, 9)
- `backend/games/serializers/auth/my_account_update.py` — use uniqueness helpers (Step 5)
- `backend/games/serializers/_request_context_mixin.py` — new, `RequestContextSerializerMixin`
  (Step 6)
- `backend/games/serializers/base_access.py`, `backend/games/serializers/base_permissions.py`
  — use the mixin (Step 6)
- `backend/games/views/treasures/treasures_list.py` — reuse `_treasure_filters.py` helpers
  (Step 7)
- `backend/games/views/games/_treasure_filters.py` — merge min/max helpers (Step 8)
- `backend/games/views/password_reset/_shared.py` — use `_send_email` (Step 9)
- `backend/games/views/game/_treasures.py` — split `character_treasures` (Step 10)
- Any test files that import/exercise the removed duplicate functions directly (e.g. tests
  targeting `treasures_list._filter_by_min_value` or the old per-model photo `__str__`
  tests) — update imports/targets to match the new structure. Run the full backend test suite
  after each step to catch these.
- A new Django migration under `backend/games/migrations/` — only if Step 2 turns out not to
  be migration-free; expected to be a no-op change, but verify with `makemigrations`.

## CI Checks

- `backend`: `poetry run pytest` (CI jobs `pytest_views_game`, `pytest_views_rest`,
  `pytest_all` split the suite by path; running the full `pytest` suite locally covers all of
  them) — run via `docker-compose run --rm majora_tests pytest`, per this repo's convention of
  never invoking `poetry`/`pytest` directly on the host.
- `backend`: `poetry run ruff check .` (CI job `lint_backend`) — run via
  `docker-compose run --rm majora_tests ruff check .`.

## Notes

- Every step is behavior-preserving by design — no step should change any API response,
  status code, or DB schema (aside from the internal table-name-preserving photo model
  refactor in Step 2). If a step turns out to require an observable behavior change to
  implement cleanly, stop and flag it rather than silently changing behavior.
- Steps are independent of each other (different files/areas) and can be implemented and
  tested in any order, though Step 4 depends on Step 3 having already introduced
  `_is_admin_or_player`.
- Step 2's abstract-base-model change touches `django-simple-history`; double check the
  generated historical model table names match the pre-refactor ones exactly (they're derived
  from the concrete model name, not the abstract base, so this should be safe, but must be
  verified with `makemigrations` producing no diff).
- Given Steps 3-4 touch `backend/games/permissions.py` (authorization logic) and Step 5
  touches account-uniqueness/auth validation, it's worth a `security` agent review pass on the
  resulting diff even though no behavior is intended to change — permission-check refactors
  are exactly the kind of change where a silent behavior slip is easy to introduce
  unintentionally.
