# Issue: Statistics bug: create the fix issue

## Description

Last sub-issue of Epic #1696 (statistics session investigation). Based on the findings of #1704
(`docs/agents/specs/statistics-bug/findings.md`), create the fix as a new **Epic** with its
sub-issues.

## Problem

#1704 confirmed the root cause: the backend records an infrastructure IP (the hosting's rotating
internal load-balancer address) instead of the visitor's, and `StatisticsSessionMiddleware`
opens a new session (`ip_changed`) whenever the IP differs. Two paths lead there: a public host
routed straight to the backend, bypassing the proxy (almost all inflated sessions), and, before
the 2026-11-02 hotfix, the missing proxy secret. Automated traffic to unresolved `.json` routes
amplifies it. Secondary causes are reproduced locally: custom proxy handlers that do not forward
the signed IP, the no-cookie race (2a) and the login-rotation race (2b).

## Expected Behavior

A fix Epic exists, split into sub-issues that the specialist pipeline can implement and release
without re-reading the investigation. It ends with the post-fix check and the cleanup, which
close the investigation.

## Solution

Create the fix Epic (labelled `Epic`) and its sub-issues, linked as GitHub sub-issues. The Epic
states the root cause, links `findings.md` and the reproducing `emulate.py` scenario
(`ip_change`), and records the owner's decisions below.

### Decisions (owner)

- **Direct host:** nothing legitimate uses the public host that reaches the backend directly. It
  stops being exposed: its custom domain is removed from the hosting, or redirected to the main
  site, and its `Domain` record is removed. This is an ops change done by the owner; no backend
  code handles that host.
- **IP change with a valid cookie:** the session is **reused** and its IP updated, instead of
  creating an `ip_changed` session. The IP change stays visible (how is decided by the plan, e.g.
  on the `Visit`). The per-IP session boundary is given up on purpose.
- **`statistics:read` scope and export endpoint:** **removed** in the cleanup, after the post-fix
  check, which still needs them. The removal ships in its own release.

### Sub-issues (in order)

1. **Backend: session tracking fix** (backend):
   - unresolved routes (404 on unknown paths) create or touch no statistics session;
   - a valid signed cookie from a different IP reuses its session and updates the IP;
   - parallel authenticated requests with one anonymous cookie create at most one
     `login_rotation` session (race 2b), and the `login_mid_navigation` open point from #1704
     (no `login_rotation` session where one was expected) is explained;
   - required **regression tests**, failing before the fix: one signed cookie on consecutive
     requests with different client IPs (trusted through the proxy, and untrusted) reuses a
     single session; an unresolved route creates no session; the parallel authenticated burst
     creates at most one `login_rotation` session.
2. **Proxy: custom handlers forward the signed client IP** (proxy): `BackendClient` sets
   `X-Forwarded-For` and `X-Proxy-Secret` the same way `SetClientIpMiddleware` does.
3. **Ops: stop exposing the direct host** (owner, checklist only): remove or redirect the custom
   domain and remove its `Domain` record. No hostname in the issue.
4. **Release: version bump** (infra), after 1 and 2.
5. **Post-fix check** (architect, interactive with the owner, like #1704): re-run `emulate.py`
   locally and `analyse-prod` over fresh production data collected after 3 and 4; confirm the
   duplicated-session pattern is gone and record the result in `findings.md`.
6. **Cleanup** (backend, frontend, translator, infra), after 5:
   - delete `investigations/statistics-bug/` (and its CI exclusion) and
     `docs/agents/specs/statistics-bug.md` + `docs/agents/specs/statistics-bug/`;
   - remove the `statistics:read` scope, the export endpoint, its UI wording and translations,
     and update the token-scopes docs;
   - keep the session tracking columns (permanent per #1696).
7. **Release: version bump** (infra), for the cleanup.

### Privacy

The repository is public: no real IPs, ids, tokens, secrets or production hostnames in the fix
Epic, its sub-issues or their PRs.

### Out of scope

- Implementing the fix (done by the new Epic).
- #1732 and #1733 (operational safeguards, tracked separately).

### Responsible agent

architect
