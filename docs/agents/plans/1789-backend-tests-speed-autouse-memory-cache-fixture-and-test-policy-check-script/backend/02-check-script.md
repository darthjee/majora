# Test-policy check script

Create `backend/bin/check_test_policy.py` (standard library only, same style as
`bin/junit_summary.py`: module docstring with purpose and usage, small functions with
docstrings, `main()` returning an exit code).

Structure:

- `load_testpaths(pyproject)`: read `[tool.pytest.ini_options].testpaths` with `tomllib`;
  missing file or key → exit `2` with a message.
- `iter_test_files(testpaths)`: every `*_test.py` (matching `python_files`) and `conftest.py`
  under the testpaths, plus the root `conftest.py`, sorted for stable output.
- `Violation` (a small `NamedTuple`: `path`, `line`, `rule`, `message`).
- `opt_outs(source)`: map line number → set of rule ids, from comments matching
  `# test-policy: allow <rule-id>[, <rule-id>...]`, read with `tokenize` so strings that look
  like comments are ignored.
- Rules: functions `rule(tree, path) -> list[Violation]`, registered in a module-level `RULES`
  list with their id, so #1790 and #1793 append one function each.
- First rule, `memory-cache-clear`: an `ast.Call` whose `func` is an `ast.Attribute` named
  `clear` on `ast.Name(id='memory_cache')` (also catch `cache.memory_cache.clear()` via an
  attribute chain ending in `memory_cache`). The root `conftest.py` is exempt from this rule,
  since the autouse fixture lives there.
- `check_file(path)`: parse once, run every rule, split results into violations and honoured
  opt-outs. A file that does not parse is reported as a violation with rule id `syntax`.
- `main()`: print violations and opt-outs (`path:line: rule-id: ...`), a summary line
  (`N files checked, V violations, A opt-outs`), return `1` if any violation else `0`.

Check it by hand inside the container:

- On the branch: exit `0`, one opt-out listed (`registered_domains_cache_test.py`).
- With a temporary test file containing an unmarked `memory_cache.clear()`: exit `1` and the
  violation line. Remove the file afterwards. Keep both outputs for the PR description.
- `ruff check .` passes and `bin/reports.sh ci` (complexity, run by `checks`) passes.

## Files to Change

- `backend/bin/check_test_policy.py` — new script.
