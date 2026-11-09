# Attach the user in place in the middleware

Race 2b: parallel authenticated requests carrying one pre-existing anonymous session each call
`attach_user(..., always_rotate=True)` and insert their own `login_rotation` session.

Decision (option a, reviewed by `security` while refining the issue): `_backfill_user` attaches
in place, like the login view (`accounts/views/auth/_shared.attach_statistics_session`).

**`session_attachment.attach_user`**:

- Drop the `always_rotate` parameter (no caller needs it any more; remove it from
  `_backfill_user`).
- Session not tied: atomic `UPDATE … WHERE pk = S AND user_id IS NULL`. When it updates a row,
  return the session (as today).
- `UPDATE` matched nothing (another request won, or the session vanished): **re-read** the
  row's `user_id` from the database (never trust the stale in-memory `None`):
  - tied to the **same** user → set it on the in-memory session and return it (reuse, no new
    row);
  - tied to a **different** user, or the row is gone → rotate (`login_rotation`), as today.
- Session already tied in memory: same user → return it unchanged (reuse); different user →
  rotate.
- `created_in_request` / `first_seen_logged` behaviour unchanged.

**`_backfill_user`**: call `attach_user` without `always_rotate`; returns early as today when
the session already has the request's user. Rewrite its docstring: the shared-device
protection is dropped on purpose (accepted trade-off: anonymous visits made before a login are
attributed to the user who authenticates first, as the login view already does); a session
tied to a different user still rotates.

The login view and the authorization-request poll keep calling `attach_user` the same way and
benefit from the same-user reuse.

Tests (`session_attachment_test.py`, `middleware_test.py`, `accounts` auth tests):

- A pre-existing anonymous session hit by an authenticated request is attached in place; no
  `login_rotation` row.
- A parallel burst (threads, `TransactionTestCase` / `transaction=True`, as the existing
  concurrent-extend test does) of authenticated requests carrying one anonymous cookie creates
  **no** `login_rotation` session and leaves the user attached to that one session.
- Lost in-place `UPDATE` with the row now tied to the same user → reuse (simulate by tying the
  row in the database while the in-memory object still has `user_id = None`).
- A session tied to a different user still rotates (`login_rotation`, IP and domain copied).
- A session deleted mid-request still rotates without error (Tracking race doc).
- Logout still deletes the statistics cookie.
- Login on an anonymous session still attaches in place (unchanged).

## Files to Change

- `backend/statistics/session_attachment.py` — no `always_rotate`, same-user reuse with re-read.
- `backend/statistics/middleware.py` — `_backfill_user` call and docstring.
- `backend/statistics/tests/session_attachment_test.py`, `backend/statistics/tests/middleware_test.py`,
  `backend/accounts/tests/` (logout / login statistics tests) — tests.
