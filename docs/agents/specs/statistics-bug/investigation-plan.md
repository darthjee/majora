# Investigation Plan

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696). Sub-issue status is
tracked in the index's [Sub-issues](../statistics-bug.md#sub-issues) table.

## Angles

The investigation runs two complementary angles:

1. **Code review** (#1704): read the tracking path (`backend/statistics/middleware.py`,
   `session_attachment.py`, `cookies.py`, `visit_tracking.py`, `backend/common/client_ip.py`,
   the Tent rules and custom handlers) against each entry of [Hypotheses](hypotheses.md).
2. **Scripts** ([Scripts](scripts.md)):
   - `emulate.py` (#1702) replays navigation scenarios against the **local** stack and reports
     which ones create extra sessions;
   - `analyse.py` (#1703) reads **production** sessions and visits through the export endpoint
     ([Export endpoint](export-endpoint.md)) and classifies duplicate sessions.

Each hypothesis needs evidence from at least one angle. A cause that only shows in production is
confirmed from `analyse.py` evidence alone, documented as such (see
[Environments](environments.md)).

## Order and dependencies

```text
#1697 specs, #1698 agent
  -> #1699 scope + export endpoint (backend)
  -> #1700 scope UI (frontend)
  -> #1701 version bump
  -> #1702 emulate.py
  -> #1703 analyse.py (production run needs #1701)
  -> #1704 code review & findings
  -> #1705 fix issue
```

- #1697 (these specs) and #1698 (the investigator agent, *planned by #1698*) come first.
- #1699 adds the `statistics:read` scope and the export endpoint; #1700 lets staff grant the
  scope from the token and device-authorization UI.
- #1701 releases the scope. The version bump only gates the **production** run of
  `analyse.py`; `emulate.py` and local runs of `analyse.py` work before it.
- #1702 then #1703 build the scripts; #1703 is cross-validated on #1702's local data.
- #1704 combines the code review and the script evidence into [Findings](findings.md).
- #1705 creates the fix issue.

## Definition of done

- Every hypothesis in [Hypotheses](hypotheses.md) is **confirmed** or **ruled out**, with
  evidence.
- The root cause is reproduced locally by an `emulate.py` scenario (or, for a production-only
  cause, documented from `analyse.py` evidence).
- [Findings](findings.md) is written.
- The fix issue (#1705) is created, with a regression test, a post-fix check, its own version
  bump and the specs cleanup (see [Lifecycle](../statistics-bug.md#lifecycle)).

## Constraints

- The request hot path (`StatisticsSessionMiddleware`) does **not** change in this Epic. The
  fix belongs to the issue created by #1705.
- The export endpoint's own requests must not be tracked (see
  [Export endpoint](export-endpoint.md#caching-and-tracking)).
