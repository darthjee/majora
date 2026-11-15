# Conversions

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

Which test-style each backend test file uses, and which modules have been converted to Django
`TestCase` + `setUpTestData`. This keeps the period with two styles visible and measurable.

## How the counts are taken

Unit: test files (`backend/**/*_test.py`). Each file falls in exactly one bucket, so totals add
up:

1. `testcase`: a class subclassing Django `TestCase` (directly; no project base class exists
   today).
2. `django_db`: `@pytest.mark.django_db` without `transaction=True`.
3. `transactional`: `TransactionTestCase` or `django_db(transaction=True)`, and nothing else.
4. `mixed`: more than one of the patterns above (for example a `transaction=True` class next to a
   plain `django_db` one).
5. `none`: none of the above (no database).

A shell-only command, run from `backend/` (no script is added). The first stage classifies each
file; the `awk` stage groups files by app and top-level test folder (a file directly under
`<app>/tests/` counts under `<app>/tests`):

```bash
for f in $(find . -name '*_test.py' -not -path '*/__pycache__/*'); do
  n=0; b=none
  grep -qE 'class [A-Za-z0-9_]+\((django\.test\.)?TestCase\)' "$f" && { n=$((n+1)); b=testcase; }
  grep -qE 'pytest\.mark\.django_db($|[^(]|\(\))' "$f" && { n=$((n+1)); b=django_db; }
  grep -qE 'TransactionTestCase|django_db\(transaction=True\)' "$f" && { n=$((n+1)); b=transactional; }
  [ "$n" -gt 1 ] && b=mixed
  echo "$(echo "$f" | cut -d/ -f2,3,4) $b"
done | awk '{k=$1; if(k ~ /\.py$/){sub(/\/[^\/]*\.py$/,"",k)} c[k","$2]++; t[k]++; g[$2]++; G++}
END{for(k in t) printf "%s %d %d %d %d %d %d\n",k,c[k",testcase"],c[k",django_db"],c[k",transactional"],c[k",mixed"],c[k",none"],t[k];
printf "TOTAL %d %d %d %d %d %d\n",g["testcase"],g["django_db"],g["transactional"],g["mixed"],g["none"],G}' | sort
```

Recorded on commit `4a01213d83b7d2576a1ada3b3809a7bda7084068` (`main` at the time, by #1786).
Each module conversion re-runs the same command on its base commit and updates the table below
and this commit SHA, so re-counts compare like for like. Files added later by branches written
to the old instructions are simply included in the next re-count.

The rough figures in Epic #1785 (193 `TestCase` files, 387 `django_db` files) used a looser
definition (files could count in both); the numbers below are the reference.

## Counts

| App / folder | testcase | django_db | transactional | mixed | none | total |
|--------------|---------:|----------:|--------------:|------:|-----:|------:|
| `accounts/tests` | 1 | 4 | 0 | 0 | 4 | 9 |
| `accounts/tests/api_tokens` | 0 | 5 | 0 | 0 | 0 | 5 |
| `accounts/tests/auth` | 2 | 5 | 0 | 0 | 1 | 8 |
| `accounts/tests/authorization_requests` | 0 | 4 | 0 | 1 | 0 | 5 |
| `accounts/tests/models` | 7 | 1 | 0 | 2 | 0 | 10 |
| `accounts/tests/password_reset` | 2 | 0 | 0 | 0 | 0 | 2 |
| `accounts/tests/serializers` | 3 | 3 | 0 | 0 | 0 | 6 |
| `common/tests` | 0 | 3 | 0 | 0 | 6 | 9 |
| `conversations/tests/models` | 0 | 4 | 0 | 0 | 0 | 4 |
| `domains/tests` | 0 | 1 | 0 | 0 | 0 | 1 |
| `domains/tests/management` | 0 | 1 | 0 | 0 | 0 | 1 |
| `domains/tests/migrations` | 0 | 0 | 0 | 1 | 0 | 1 |
| `domains/tests/models` | 0 | 2 | 0 | 1 | 0 | 3 |
| `domains/tests/seeds` | 0 | 0 | 0 | 0 | 1 | 1 |
| `domains/tests/views` | 0 | 1 | 0 | 0 | 0 | 1 |
| `games/tests` | 3 | 3 | 0 | 0 | 2 | 8 |
| `games/tests/cache` | 0 | 0 | 0 | 0 | 3 | 3 |
| `games/tests/caches` | 0 | 5 | 0 | 0 | 0 | 5 |
| `games/tests/integration` | 1 | 0 | 0 | 0 | 0 | 1 |
| `games/tests/management` | 0 | 0 | 0 | 0 | 1 | 1 |
| `games/tests/models` | 35 | 4 | 0 | 4 | 0 | 43 |
| `games/tests/serializers` | 66 | 6 | 0 | 0 | 4 | 76 |
| `games/tests/views` | 24 | 223 | 0 | 9 | 18 | 274 |
| `majora_project` | 0 | 0 | 0 | 0 | 1 | 1 |
| `miniatures/tests` | 0 | 0 | 0 | 0 | 1 | 1 |
| `miniatures/tests/models` | 10 | 0 | 0 | 0 | 0 | 10 |
| `miniatures/tests/serializers` | 0 | 14 | 0 | 0 | 0 | 14 |
| `miniatures/tests/views` | 3 | 9 | 0 | 0 | 0 | 12 |
| `permissions/tests` | 0 | 5 | 0 | 0 | 2 | 7 |
| `staff/tests` | 6 | 42 | 1 | 0 | 5 | 54 |
| `staff/tests/models` | 0 | 1 | 0 | 0 | 0 | 1 |
| `staff/tests/serializers` | 5 | 2 | 0 | 0 | 0 | 7 |
| `statistics/tests` | 0 | 1 | 1 | 2 | 4 | 8 |
| `statistics/tests/aggregation` | 0 | 11 | 0 | 0 | 8 | 19 |
| `statistics/tests/models` | 0 | 2 | 0 | 0 | 0 | 2 |
| `uploads/tests` | 8 | 5 | 0 | 0 | 9 | 22 |
| `versioning/tests` | 0 | 2 | 0 | 0 | 0 | 2 |
| **Total** | **176** | **369** | **2** | **20** | **70** | **637** |

Notes:

- `majora_project` is `majora_project/settings_test.py`, which has no `tests/` folder.
- Only `staff/tests/staff_statistics_clear_test.py` and `statistics/tests/reset_test.py` are
  purely transactional; the other transactional files of [Edge cases](edge-cases.md#transactional-tests)
  also use plain `django_db` or `TestCase` and count as `mixed`.
- The `none` bucket relies on text patterns: a file that reaches the database only through a
  fixture or helper defined elsewhere also lands there.

## Converted modules

Filled in by each module conversion sub-issue.

| Module | Sub-issue | Before | After | Notes (parametrize kept or replaced, renamed tests) |
|--------|-----------|--------|-------|-----------------------------------------------------|
| — | — | — | — | — |
