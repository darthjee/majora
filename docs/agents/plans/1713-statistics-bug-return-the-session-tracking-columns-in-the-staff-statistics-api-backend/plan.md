# Plan: Statistics bug: return the session tracking columns in the staff statistics API (backend)

Issue: [1713-statistics-bug-return-the-session-tracking-columns-in-the-staff-statistics-api-backend.md](../../issues/1713-statistics-bug-return-the-session-tracking-columns-in-the-staff-statistics-api-backend.md)

## Overview

Expose the tracking columns stored by #1712 (`Session.first_path`, `creation_reason`,
`first_seen_logged`; `Visit.first_path`, `last_path`) on the staff statistics export and visit
list endpoints, with no extra query, and document the new payload fields.

See [backend.md](backend.md) for the full plan.
