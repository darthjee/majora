# Investigator Plan: Statistics bug fix: backend session tracking fix

Main plan: [plan.md](plan.md)

## Shared contracts

What this agent relies on (produced by backend; see [plan.md](plan.md#shared-contracts)):

- No `ip_changed` session for a valid cookie; the session is reused across IPs.
- No `login_rotation` session for a pre-existing anonymous session (in-place attach, also on
  login); only a session tied to a different user rotates.
- Unresolved routes create nothing.

## Implementation Steps

### Step 1 — Move the scenario expectations to the post-fix behaviour

In `investigations/statistics-bug/emulate.py` (an empty `Expect()` means "no new session"):

- `login_mid_navigation`: `Expect(text='no new session (login attaches the user in place)')`.
  Fix the docstring/notes: the login view attaches in place, so no `login_rotation` was ever
  expected on that path.
- `refresh_burst_with_cookie_logged_in`: `Expect(text='no new session (in-place attach)')`.
- `ip_change`: `Expect(text='the same session reused; no ip_changed session')`.
- `mixed_handlers`: keep `Expect()`; update the text (no `ip_changed` session: the cookie is
  reused; #1738 also stops the IP flip).
- Other scenarios unchanged (`refresh_burst_no_cookie_anonymous` keeps race 2a, out of scope).

Update the scenario table in `investigations/statistics-bug/README.md` to match, with one line
saying the expectations describe the post-#1737 behaviour (pre-fix results are in
`findings.md`).

Do not run `emulate.py` against production; the local run itself belongs to #1741. A quick
local `--dry-run` (or `--scenario ip_change` against `make stack-up`) after the backend change
is optional.

### Step 2 — Close the `login_mid_navigation` open point

In `docs/agents/specs/statistics-bug/findings.md`, replace "to be explained by the fix issue"
for `login_mid_navigation` with the explanation (the login view attaches the user to the
anonymous session in place; the expectation was wrong, not the code), referencing #1737.
Aggregated wording only; no ids, IPs or hostnames.

## Files to Change

- `investigations/statistics-bug/emulate.py` — scenario `Expect` values and texts.
- `investigations/statistics-bug/README.md` — scenario table.
- `docs/agents/specs/statistics-bug/findings.md` — `login_mid_navigation` row/open point.

## CI Checks

- `investigations/**` is excluded from CI lint (markdownlint, Codacy); keep the script runnable:
  `docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm emulate --help`.
- `docs/agents/specs/`: markdownlint applies (`make` lint target / CI markdownlint job).

## Notes

- Investigation rules in `docs/agents/investigator.md` apply (local stack only, no tokens
  stored, public repository).
