# Plan: Statistics bug fix: backend session tracking fix

Issue: [1737-statistics-bug-fix-backend-session-tracking-fix.md](../../issues/1737-statistics-bug-fix-backend-session-tracking-fix.md)

## Overview

Stop the statistics middleware from creating extra sessions: unresolved routes are no longer
tracked, a valid cookie reuses its session across IP changes (the IP change is recorded on the
`Visit` as `first_ip`/`last_ip`), and `_backfill_user` attaches the user in place instead of
always rotating, which removes race 2b. The investigation's `emulate.py` expectations are moved
to the post-fix behaviour so #1741 can check it.

## Agents involved

- [backend](backend.md)
- [investigator](investigator.md)

## Shared contracts

Post-fix behaviour of `StatisticsSessionMiddleware` (backend produces it, the investigator's
`emulate.py` scenarios expect it):

- A request whose path matches no route creates no session and no visit, and sets no
  `majora_statistics` cookie.
- A valid cookie whose session exists for the same domain is reused whatever the client IP;
  `creation_reason = ip_changed` is never produced for it (the choice stays in
  `Session.CreationReason`).
- An authenticated request carrying a pre-existing anonymous session attaches the user to it
  in place; concurrent requests reuse it. `login_rotation` is only produced when the session
  is tied to a **different** user (or vanished mid-request).
- The login view keeps attaching in place (unchanged).
- `domain_changed`, `no_cookie`, `invalid_cookie`, `cookie_session_not_found` are unchanged.

New fields (backend):

- `Visit.first_ip`, `Visit.last_ip`: `GenericIPAddressField(null=True, blank=True)`.
- Staff visit list (`staff/statistics/visits.json`) rows gain `first_ip` and `last_ip`
  (string or `null`); `ip` is kept for the current frontend until #1745 (value: the visit's
  `last_ip`, falling back to `session.ip` for visits recorded before the migration).
- Export (`staff/statistics/export.json`) visits gain `first_ip` and `last_ip`.
