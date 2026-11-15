# Count test styles and write conversions.md

Count `backend/**/*_test.py` files once, per app and per top-level test folder (for example `games/tests/models`, `games/tests/views`), into exactly one bucket each:

1. `testcase` — a class subclassing Django `TestCase` (directly; no project base class exists today).
2. `django_db` — `@pytest.mark.django_db` without `transaction=True`.
3. `transactional` — `TransactionTestCase` or `django_db(transaction=True)`.
4. `mixed` — more than one of the above.
5. `none` — none of the above (no database).

A shell-only command is enough (no Python on the host, per `CLAUDE.md`). A tested starting point, run from `backend/`:

```bash
for f in $(find . -name '*_test.py' -not -path '*/__pycache__/*'); do
  n=0; b=none
  grep -qE 'class [A-Za-z0-9_]+\((django\.test\.)?TestCase\)' "$f" && { n=$((n+1)); b=testcase; }
  grep -qE 'pytest\.mark\.django_db($|[^(]|\(\))' "$f" && { n=$((n+1)); b=django_db; }
  grep -qE 'TransactionTestCase|django_db\(transaction=True\)' "$f" && { n=$((n+1)); b=transactional; }
  [ "$n" -gt 1 ] && b=mixed
  echo "$(echo "$f" | cut -d/ -f2,3,4) $b"
done | sort | uniq -c
```

On `origin/main` at the time of planning it gave totals of roughly testcase 176, django_db 369, transactional 2, mixed 20, none 70 (637 files). Re-run it on the branch's base commit; the numbers to record are the ones you get.

Write `docs/agents/specs/pytest-all-long-test/conversions.md`:

- The "Part of the ... specs" line.
- **How the counts are taken:** the bucket definitions, the exact command above (as run), and the commit SHA it was run on. Each module conversion re-runs it and updates the tables.
- **Counts:** a table per app and top-level test folder with the five buckets and a total row. Note that the rough figures in #1785 (193 / 387) used a looser definition.
- **Converted modules:** an empty table (module, sub-issue, before time, after time, notes such as parametrize kept or replaced).

## Files to Change

- `docs/agents/specs/pytest-all-long-test/conversions.md` — new.
