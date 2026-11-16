# Issue: Backend tests speed: add TokenFactory and replace manual token creation

## Description

Part of Epic #1785, which reduces the backend pytest suite runtime (CI first, local runs too).

Add a `TokenFactory` and replace every manual `Token.objects.create(...)` (DRF `rest_framework.authtoken.models.Token`) in the backend tests with it, in one codemod PR. The check script from #1789 gets a rule that keeps it that way.

## Problem

Authenticated tests build their API token by hand with `Token.objects.create(user=...)`: 1,275 calls in 287 files (games 1,054, of which 677 are in `games/tests/views/game/`; staff 89; accounts 50; uploads 39; miniatures 35; statistics 7; versioning 1). 453 of them create a token in `setUp` (once per test), 196 in `setUpTestData`, and 626 in local variables. 10 of the 287 files are helper modules, not `*_test.py` files, e.g. `uploads/tests/fixtures.py`, `staff/tests/photo_test_support.py`, `staff/tests/copy_test_support.py`, `games/tests/views/game/_scoped_token_fixtures.py` and `games/tests/views/games/_entity_token_scopes_behavior.py`.

There is no single place to make token creation cheaper or consistent. Hypothesis 4 in `cost-drivers.md` (`UserFactory` and manual `Token` creation multiply `INSERT`s) cannot be tested or acted on until token creation goes through one place.

## Expected Behavior

- A `TokenFactory` exists next to the other test factories in `games/tests/factories/` and is exported like them. By default it creates a token for a new user from `UserFactory` (so an approved one). The key is generated the same way the model already does it. `TokenFactory(user=some_user)` replaces `Token.objects.create(user=some_user)`.
- No `.py` file under the pytest `testpaths` calls `Token.objects.create`. This covers `*_test.py` files and the helper modules alike.
- `bin/check_test_policy.py` has a new `token-create` rule that flags `Token.objects.create` and allows the usual `# test-policy: allow token-create` line opt-out. It scans every `.py` file under the `testpaths` (plus the root `conftest.py`), not just `*_test.py` and `conftest.py`. The existing `memory-cache-clear` rule gets the same wider scope, and the script must still pass on the whole tree.
- No behavior change: each token is still created where it is today (`setUp`, `setUpTestData` or local). Moving per-test tokens into `setUpTestData` is out of scope; it belongs to the per-directory conversions of the Epic.
- `cost-drivers.md` records the before and after job times under hypothesis 4, which stays open until #1791. `verification.md` and `isolation-policy.md` list the new check-script rule and its scope.

## Solution

- Owner: `backend` agent. Depends on #1789 (check script), which is merged.
- Add `TokenFactory` (a `DjangoModelFactory` for `rest_framework.authtoken.models.Token` with `user = factory.SubFactory(UserFactory)`).
- Replace the calls with one codemod script in one PR: rewrite `Token.objects.create(user=X)` to `TokenFactory(user=X)`, fix the imports (add the factory import, remove the `Token` import when it is no longer used) and run the linters. Any call the codemod cannot rewrite safely is converted by hand and listed in the PR. The codemod itself is a one-off and is not committed.
- Extend `bin/check_test_policy.py`: add the `token-create` rule and widen the file scan, with tests for both like the existing rule.
- Edge cases:
  - Code outside the tests (`ApiToken.objects.create_token`, `PasswordResetToken.objects.create`) is not touched. The rule matches only the DRF `Token` name, not `ApiToken` or `PasswordResetToken`.
  - Tests that check the `Token` model or authentication itself may still read `Token.objects` (`get`, `filter`, `count`). Only `create` is flagged.

### Verification (applies to every test or CI change in this Epic)

- `pytest --collect-only -q` lists the same node IDs before and after, except for renames the PR lists explicitly.
- The full suite passes in CI; no test is skipped, marked `xfail` or deleted to get there.
- Codacy total coverage does not drop.
- The PR description reports the before and after time of the affected CI jobs, and the new numbers are added to `baseline.md`.

## Benefits

- One place to create tokens, so later changes (cheaper creation, shared tokens per class) touch one factory instead of 287 files.
- The check script now covers helper modules, so neither forbidden pattern can come back through a support file.
