# Reproduce the root cause

Combine the code review and both runs into a root cause, then reproduce it locally.

- If an existing `emulate.py` scenario already reproduces it, use that.
- Otherwise add one: a `Scenario` subclass with `name`, `hypothesis`, an `Expect` describing the
  extra session(s) and their creation reason, `setup`/`run` using the existing `visit`/`refresh`
  helpers; append it to `SCENARIOS` and describe it in the README's scenario list. Run it alone
  with `--scenario <name>` (user approval again) and check `analyse --validate` agrees.
- A production-only cause (one that cannot be reproduced locally, see `environments.md`) is
  documented from `analyse.py` evidence instead, stating why it cannot be reproduced.

## Files to Change

- `investigations/statistics-bug/emulate.py` — new scenario, only if needed.
- `investigations/statistics-bug/README.md` — the new scenario's description.
