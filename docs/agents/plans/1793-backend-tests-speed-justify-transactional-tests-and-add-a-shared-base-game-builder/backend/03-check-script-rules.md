# Check-script rules
Add two rule functions to `backend/bin/check_test_policy.py`, each with the `rule(tree, path) -> list[Violation]` signature. Append both to `RULES`, and keep the script standard-library only.

1. **`transaction-justification`**
   - It flags:
     - a `ClassDef` whose bases include `TransactionTestCase` (a `Name` or an `Attribute` ending in it);
     - a `ClassDef` or `FunctionDef`/`AsyncFunctionDef` decorated with `pytest.mark.django_db(...)` (also `mark.django_db`) where `transaction=True` is a keyword set to a constant.
   - The anchor line is the first decorator's `lineno`, or the def's `lineno` when there is no decorator.
   - The site passes when the line directly above the anchor (`anchor - 1`), stripped, matches `^#\s*transactional:\s*\S`. Use the source lines: pass them in, or extend `check_file` to give rules access to the source.
   - The violation is reported at the anchor line, so `# test-policy: allow transaction-justification` on that line still works as the opt-out.
   - Message: "transactional test needs a '# transactional: <reason>' comment directly above it".
2. **`scoped-db-fixture`**
   - It flags a function decorated with `pytest.fixture(...)`/`fixture(...)` whose `scope` keyword is the constant `class`, `module`, `package` or `session`, when either of these holds:
     - one of its arguments is named `django_db_blocker`;
     - its body references `django_db_blocker`.
   - It is reported at the decorator line.
   - Message: "fixtures scoped to class/module/package/session must not write to the database; use setUpTestData".

Update the module docstring to mention both rules.

Check the rules with temporary sample files under a test path. For each rule, cover these cases:
- a flagged case;
- a justified or opted-out case;
- the cases that must not be flagged: a non-transactional `django_db`, `transaction=False`, a function-scoped fixture that uses the blocker, a scoped fixture without the blocker.

Run the script against the samples, put its output in the PR description, then delete the samples. Finally, the script must exit `0` on the real tree.

## Files to Change
- `backend/bin/check_test_policy.py`: two rules plus the docstring
