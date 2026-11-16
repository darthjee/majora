# 02 — Codemod the call sites

Before changing anything, save `poetry run pytest --collect-only -q` (in the `majora_tests`
container) for the comparison in step 04.

Write a one-off codemod (in the scratchpad, not committed) and run it over every `.py` file under
the `testpaths`:

- Rewrite `Token.objects.create(<args>)` to `TokenFactory(<args>)`, keeping the arguments as they
  are (almost all are `user=<expr>`). Match the DRF `Token` name only, never `ApiToken` or
  `PasswordResetToken`.
- Add `from games.tests.factories import TokenFactory` (or merge it into an existing import from
  `games.tests.factories`).
- Remove `from rest_framework.authtoken.models import Token` when `Token` is no longer used in the
  file. Keep it where the file still reads `Token.objects` (`get`, `filter`, `count`, ...).
- Run `ruff check --fix .` and the formatter the repo uses, then `ruff check .`.

Convert by hand any call the codemod cannot rewrite safely (multi-line, unusual arguments) and list
those in the PR description. `grep -rn '\bToken\.objects\.create' --include=*.py` under `backend/`
must return nothing afterwards.

## Files to Change

- About 287 test and helper files under `backend/{accounts,games,miniatures,staff,statistics,uploads,versioning}/tests/` — replace the calls and fix imports.
