# Issue: Statistics bug fix: ops, stop exposing the direct host

## Description

Part of the statistics bug fix Epic (Epic #1736). Owner decision: the public host that
reaches the backend directly, bypassing the Tent proxy (the "direct host" of
`docs/agents/specs/statistics-bug/findings.md`), has no legitimate use and stops being exposed.

This is an **ops change done by the owner**. There is no code change: no backend code handles
that host.

## Problem

Requests to the direct host never carry the proxy secret, so `common/client_ip.py` falls back to
`REMOTE_ADDR`: the hosting's rotating internal IP. Every IP change opens a new statistics
session, so this host produces almost all inflated sessions. #1737, #1738 and the #1732 hotfix
do not affect it.

## Expected Behavior

- The direct host no longer reaches the backend.
- The main site, served through the proxy, keeps working.

## Solution

Owner checklist:

- [ ] Remove the direct host's custom domain from the hosting, or redirect it to the main site.
- [ ] Remove its `Domain` record (Django admin), **only after the post-fix check (#1741)**.
      `statistics.Session.domain` uses `on_delete=SET_NULL`. Deleting the record earlier would
      detach the existing direct-host sessions from their domain, and #1741 needs them for the
      before/after comparison.
- [ ] Confirm that the main site (through the proxy) still works: pages, API and login.
- [ ] Confirm that the direct host no longer reaches the backend.

## Out of scope

- The hosting's default service hostname, which always reaches the backend and can't be removed
  here. #1750 handles requests that bypass the proxy (backend safeguard).
- Changing `ALLOWED_HOSTS`. It doesn't block reliably, because `USE_X_FORWARDED_HOST` lets a
  direct caller choose the host.

## Privacy

The repository is public. The hostname is intentionally not named here, in comments or in any
PR.

## Responsible agent

owner
