# Plan: Statistics: tolerate a session deleted mid-request in visit tracking

Issue: [1683-statistics-tolerate-a-session-deleted-mid-request-in-visit-tracking.md](../../issues/1683-statistics-tolerate-a-session-deleted-mid-request-in-visit-tracking.md)

## Overview

Make the statistics middleware survive a `Session` deleted mid-request (by the upcoming Clear,
#1684): touching it becomes a no-op `UPDATE`, and opening a `Visit` for it is skipped inside a
savepoint. User attachment already copes and only gains regression tests.

See [backend.md](backend.md) for the full plan.
