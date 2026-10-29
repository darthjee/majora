# Plan: Statistics bug: store creation path, reason and logged state on sessions and visits (backend)

Issue: [1712-statistics-bug-store-creation-path-reason-and-logged-state-on-sessions-and-visits-backend.md](../../issues/1712-statistics-bug-store-creation-path-reason-and-logged-state-on-sessions-and-visits-backend.md)

## Overview

Add nullable tracking columns to statistics `Session` (`first_path`, `creation_reason`,
`first_seen_logged`) and `Visit` (`first_path`, `last_path`), and fill them from
`StatisticsSessionMiddleware`, `attach_user` and `track_visit` with no extra query per
request and no change to which sessions are reused, created or rotated.

See [backend.md](backend.md) for the full plan.
