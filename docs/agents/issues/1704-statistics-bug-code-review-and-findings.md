# Issue: Statistics bug: code review and findings

## Description

Part of Epic #1696: find out why navigating creates a new statistics `Session` for a visitor who
is already tracked. This sub-issue reviews the code, runs both investigation scripts
(`emulate.py` from #1702 and `analyse.py` from #1703, including the **first production run** of
`analyse.py`, moved here from #1703) and writes the findings, following
`docs/agents/specs/statistics-bug/` and `docs/agents/investigator.md`.

## Solution

### Code review

Read the session path against each entry of `hypotheses.md`:

- `backend/statistics/middleware.py` (`_load_or_create_session`, `_backfill_user`,
  `_set_cookie`), `session_attachment.py`, `cookies.py`, `visit_tracking.py`;
- `backend/common/client_ip.py`;
- the proxy: Tent rules and custom handlers (`X-Forwarded-For`, `Set-Cookie` passthrough,
  cached responses);
- how the frontend fires requests on page load and refresh.

### Execution

This issue is run **interactively**, in a chat session with the user, not through
`/loop /auto-resolve-issue`: every script run waits for a device authorization that the user
approves, and a background specialist could not show the approval link. The architect does the
investigator's work in that session and stops before each run for the user's approval.

### Script runs

- **Local:** `emulate.py` (all scenarios), then `analyse.py --validate` against its report.
- **Production (`analyse-prod`):** only after the user's explicit go-ahead.
  - The date range is chosen by the user at run time. It starts after the 1.5.0 deploy and
    should cover at least about 7 days of data.
  - `--dry-run` first checks the setup (`STATISTICS_PROD_URL` in the root `.env`) without
    touching production.
  - The user approves the request in production and revokes the token afterwards.
- Reports stay git-ignored. Only the anonymised or aggregated summaries are copied out.

### Findings

Fill in `docs/agents/specs/statistics-bug/findings.md`:

- **Evidence per hypothesis:** each one *confirmed*, *ruled out* or *inconclusive*, backed by
  aggregated or anonymised output: the emulation scenario and the production pattern. An
  inconclusive hypothesis states what evidence is missing; it does not block the issue as long
  as the root cause is confirmed and reproduced. The definition of done in
  `investigation-plan.md` is updated to allow it.
- **Root cause.**
- **Reproducing scenario:** an `emulate.py` scenario that reproduces the root cause locally.
  If no existing scenario does, add one to `emulate.py`. A production-only cause is documented
  from `analyse.py` evidence instead, as `environments.md` allows.
- **Proposed solution direction** and the **regression test scenario** for the fix issue (#1705).

### Privacy

- The repository is public: no real IPs, user ids, session ids, tokens, secrets or the
  production URL in anything committed, posted to an issue or written in the PR.
- An exploitable finding (for example cookie leakage through the cache, hypothesis 5) is
  reported privately: the architect tells the user in the chat and stops before writing anything
  about it to a file, the PR or an issue. The public write-up carries only what the user
  approves.

### Review

The PR is not pre-approved (no `shipit` label): it waits for the user's review of the
anonymised evidence before it is merged.

### Out of scope

- Fixing the bug, or any change to `backend/`, `frontend/` or `proxy/`.
- Creating the fix issue (#1705).

### Depends on

#1701 (1.5.0 release), #1702 (`emulate.py`) and #1703 (`analyse.py`), all merged.

### Responsible agents

- **investigator:** the code review, the script runs, any new `emulate.py` scenario and
  `findings.md`.
- **architect:** review of the findings.
