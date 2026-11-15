# Add the JUnit per-file summary script

`pytest --durations` lists single tests only; the Epic needs totals per file and per directory (e.g. the share of `pytest_all` taken by the 10 transactional files). Add a small script that reads a JUnit XML file and writes a sorted summary.

- Path: `backend/bin/junit_summary.py`. Standard library only (`xml.etree.ElementTree`, `argparse`, `collections`, `pathlib`); no new dependency.
- Usage: `python bin/junit_summary.py <junit.xml> <output.md>` (in CI: `poetry run python bin/junit_summary.py test-reports/junit.xml test-reports/durations-by-file.md`).
- Input: the jobs generate JUnit with `-o junit_family=xunit1` (step 02), so each `testcase` has a `file` attribute. Fall back to deriving the path from `classname` (dotted module path, dropping the trailing class name when it starts with an upper-case letter) when `file` is missing.
- Output (Markdown, so it renders well as an artifact and can be pasted into specs):
  - a header line: total tests, total time (sum of `testcase` `time`), and the JUnit `testsuite` wall time if present;
  - a **per-file** table sorted by total time, descending: file, tests, total seconds, share of total (%), average per test;
  - a **per-directory** table (each test file's parent directory, aggregated) with the same columns.
- Skipped tests count in the test number but add their (near-zero) time as-is; errors and failures are counted the same way — the script never fails on test outcomes, only on an unreadable or missing input (non-zero exit with a clear message).
- Keep it short and readable; add a module docstring explaining its purpose and the Epic (#1785).
- Check it locally only inside the container, e.g. `docker-compose run --rm majora_tests sh -c "poetry run pytest common/tests --junitxml=/tmp/j.xml -o junit_family=xunit1 -q && poetry run python bin/junit_summary.py /tmp/j.xml /tmp/s.md && cat /tmp/s.md"`, and run `ruff check` on it.

## Files to Change

- `backend/bin/junit_summary.py` — new script.
