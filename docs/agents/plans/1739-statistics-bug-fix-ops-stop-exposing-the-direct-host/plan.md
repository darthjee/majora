# Plan: Statistics bug fix: ops, stop exposing the direct host

Issue: [1739-statistics-bug-fix-ops-stop-exposing-the-direct-host.md](../../issues/1739-statistics-bug-fix-ops-stop-exposing-the-direct-host.md)

## Overview

An ops checklist that the owner carries out on the hosting and in the Django admin. No agent
has code to change: no backend, proxy, frontend or infra file handles the direct host.

## Context

The direct host reaches the backend without going through the Tent proxy. Its requests carry no
`X-Proxy-Secret`, so `backend/common/client_ip.py` records the hosting's rotating internal IP,
and `StatisticsSessionMiddleware` opens inflated sessions. Nothing legitimate uses this host
(an owner decision in Epic #1736).

## Implementation Steps

### Step 1 — Stop exposing the direct host (owner, now)

1. Remove the direct host's custom domain from the hosting, or redirect it to the main site.
2. Confirm that the main site, through the proxy, still works: pages, API and login.
3. Confirm that the direct host no longer reaches the backend.

Keep the direct host's `Domain` record for now.

### Step 2 — Remove the `Domain` record (owner, after #1741)

Only after the post-fix check (#1741) has run, delete the direct host's `Domain` record in the
Django admin. `statistics.Session.domain` uses `on_delete=SET_NULL`. Deleting the record earlier
would detach the existing direct-host sessions from their domain, and #1741 needs them for the
before/after comparison.

## Files to Change

None.

## Notes

- The hosting's default service hostname still reaches the backend directly. It is out of scope
  here and is handled by #1750 (a backend safeguard for requests that bypass the proxy).
- Changing `ALLOWED_HOSTS` is not a reliable block: `USE_X_FORWARDED_HOST` lets a direct caller
  choose the host.
- The repository is public: never name the direct host, real IPs or secrets in commits, PRs or
  comments.
- Because there are no code changes, an `auto-resolve-issue` run has nothing to implement. Close
  the issue by hand once Step 1 is done, or keep it open until Step 2.
