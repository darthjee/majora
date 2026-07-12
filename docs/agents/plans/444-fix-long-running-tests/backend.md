# Backend Plan: Fix long running Python tests in CI

Main plan: [plan.md](plan.md)

## Shared contracts

None — all changes are confined to `source/` test configuration and test files. Does not depend on `infra`'s work landing first.

## Implementation Steps

### Step 1 — Wire in a fast password hasher for tests

`source/majora_project/settings_test.py` already exists (added in the initial commit) but is currently dead code — nothing sets `DJANGO_SETTINGS_MODULE=majora_project.settings_test` anywhere, so it has never actually been used. Repurpose it as the real test-settings module:

1. In `source/majora_project/settings_test.py`, **drop the existing `DATABASES` override** (it swaps to SQLite in-memory, which is an unrelated, larger, riskier change — out of scope for this issue; tests should keep running against the same MySQL engine used in production/CI to avoid MySQL-vs-SQLite behavioral drift). Replace it with:
   ```python
   PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
   ```
   Keep the `from majora_project.settings import *` wildcard import so everything else (including `DATABASES`, which now reads from the same `MAJORA_MYSQL_*` env vars as production/CI) is inherited unchanged.
2. Point pytest at this settings module instead of the production one:
   - `source/pyproject.toml`: change `[tool.pytest.ini_options]`'s `DJANGO_SETTINGS_MODULE` from `"majora_project.settings"` to `"majora_project.settings_test"`.
   - `source/conftest.py`: change the `os.environ.setdefault('DJANGO_SETTINGS_MODULE', ...)` default to `'majora_project.settings_test'` too, so both entry points agree and there's no ambiguity about which one wins.
   - Do **not** touch `source/manage.py` or `source/majora_project/wsgi.py` — both must keep defaulting to `majora_project.settings` (production behavior).
3. Sanity-check that `django.contrib.auth.hashers.MD5PasswordHasher` is acceptable for this codebase's test usage (it's Django's standard low-security-but-fast hasher recommended for tests; never used outside `settings_test.py`).

This is the single highest-value, lowest-risk fix: ~279 call sites across `source/games/tests` create users via `create_user`/`UserFactory`/`SuperUserFactory` (see `source/games/tests/factories.py`), each currently paying full `PBKDF2PasswordHasher` cost (~100-300ms/hash).

### Step 2 — Refactor `setup_method` to `setUpTestData` where safe

94 of ~108 test files under `source/games/tests` (and `source/versioning/tests`) use `setup_method` (pytest's per-test-method hook, e.g. `source/games/tests/paginator_test.py:22-27`) to build fixture data before **every single test**, combined with plain `@pytest.mark.django_db` classes rather than `django.test.TestCase` subclasses.

**Important technical constraint**: `setUpTestData` is a `django.test.TestCase` classmethod — it does not exist on plain pytest classes. A literal "rename `setup_method` to `setUpTestData`" will not work as-is. To actually get the once-per-class setup behavior:

1. Convert the affected test class to subclass `django.test.TestCase` (instead of a plain class decorated with `@pytest.mark.django_db`).
2. Move object creation from `setup_method(self)` into `setUpTestData(cls)`, assigning to `cls.foo` instead of `self.foo` (Django exposes class attributes set this way as instance attributes automatically on each test).
3. Only do this where the fixture objects are **not mutated** by test methods in ways that would leak across tests — `setUpTestData` wraps creation in a class-level transaction that Django rolls back at the *DB* level after each test, but Python-level attribute mutations (e.g. `self.character.name = 'x'` without `.save()`, or mutating a list/dict fixture in place) are **not** rolled back and will leak state between tests. Where a test mutates its fixture objects, leave `setup_method` as-is.

Given the size (94 files), do not attempt a single blind mechanical pass:
- Start with a pilot batch of files with clearly read-only fixtures (e.g. `source/games/tests/paginator_test.py`, `source/games/tests/permissions_test.py`) to validate the approach and confirm the full test suite still passes with no cross-test leakage.
- Expand to the rest of `source/games/tests` incrementally, skipping any file where a test method mutates a `setup_method`-created object without re-fetching/re-saving it.
- Leave files alone where the conversion isn't clearly safe rather than forcing it — a partial, correct refactor is strictly better than a full but flaky one.

This also reduces the `django-simple-history` write overhead (every `.save()` on the 9 historically-tracked models also writes a historical record row) since fewer redundant object creations happen overall.

## Files to Change

- `source/majora_project/settings_test.py` — replace the unused SQLite `DATABASES` override with a `PASSWORD_HASHERS` override using `MD5PasswordHasher`.
- `source/pyproject.toml` — `[tool.pytest.ini_options]` `DJANGO_SETTINGS_MODULE` → `"majora_project.settings_test"`.
- `source/conftest.py` — default `DJANGO_SETTINGS_MODULE` → `'majora_project.settings_test'`.
- `source/games/tests/**/*.py`, `source/versioning/tests/**/*.py` — convert `setup_method` to `setUpTestData` (with the class-base change described above) where safe, starting with a pilot batch.

## CI Checks

- `source/`: `poetry run pytest --cov` (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`)

## Notes

- Measure the actual time impact of Step 1 alone before investing heavily in Step 2 — it's possible the password hasher change accounts for the bulk of the win, in which case the `setUpTestData` refactor could be scoped down or split into a follow-up issue.
- `django-simple-history` disabling in tests and `pytest-xdist` parallelization were explicitly flagged as out of scope for this issue (see the issue file) — do not include them here; file separate issues if still worth pursuing after these changes land.
- Confirm `MD5PasswordHasher` doesn't break any test that asserts on exact password-hash format/length (unlikely, but worth a full test-suite run after Step 1).
