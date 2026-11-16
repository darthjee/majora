# 03 — Check script rule and scope

In `backend/bin/check_test_policy.py`:

- **Wider scan:** `iter_test_files` collects every `*.py` file under each `testpaths` entry
  (`base.rglob("*.py")`), plus the root `conftest.py`. Update the module and function docstrings.
  Both rules now apply to helper modules too.
- **New rule `token-create`:** flags `Token.objects.create(...)` calls, i.e. an `ast.Call` whose
  func is `Attribute(attr='create')` on `Attribute(attr='objects')` on `Name(id='Token')`.
  Message: `use TokenFactory instead of Token.objects.create`. Add it to `RULES`. The
  `# test-policy: allow token-create` opt-out works through the existing mechanism.
- The script must exit `0` on the whole tree after step 02. If the wider scan surfaces
  `memory_cache.clear()` calls in helper modules, remove them like #1789 did (the autouse fixture
  already clears the cache) and list them in the PR.

Verify by hand, in the `majora_tests` container: run the script on the tree (exit `0`, file count
higher than before), then temporarily add a `Token.objects.create(user=None)` line to a test file,
check that the script reports it with exit `1`, that `# test-policy: allow token-create` turns it
into an opt-out, and revert.

## Files to Change

- `backend/bin/check_test_policy.py` — new rule, wider scan, docstrings.
