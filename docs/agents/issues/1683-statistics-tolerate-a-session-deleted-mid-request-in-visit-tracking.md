# Issue: Statistics: tolerate a session deleted mid-request in visit tracking

## Description

Part of #1678 (Epic: staff dashboard visits summary card).

Make statistics visit tracking **tolerate a `Session` that was deleted mid-request**. Follow
`docs/agents/specs/statistics_dashboard/tracking-race.md`.

The upcoming "Clear statistics" action (#1684) deletes every `statistics.Session` and
`statistics.Visit`. A request that already loaded its session in
`StatisticsSessionMiddleware._load_or_create_session` can then write to a row that no longer
exists. That error reaches the visitor as a 500.

### Where a deleted session breaks today

| Point | Call | Behaviour on a deleted `Session` |
|---|---|---|
| Load → touch | `StatisticsSessionMiddleware._touch_session` → `session.save(update_fields=['last_seen_at'])` | Raises `DatabaseError("Save with update_fields did not affect any rows.")`. This happens whenever a reused session is older than the touch interval. |
| Load → track | `visit_tracking.track_visit`: the extend `UPDATE` matches 0 rows, so it falls back to `Visit.objects.create(session=...)` | Raises `IntegrityError`, because MySQL/InnoDB checks the foreign key at insert time. |
| Track → attach | `session_attachment.attach_user`, called from `_backfill_user` and from `accounts.views.auth._shared.attach_statistics_session`: the in-place `UPDATE ... WHERE user_id IS NULL` matches 0 rows, so it rotates to `Session.objects.create(...)` | **Does not raise.** It creates a fresh session tied to the user, and the cookie points to that session. Only regression tests are needed here. |

`_set_cookie` only reads `session.token`, so it is safe.

## Problem

Once Clear (#1684) exists, any visitor whose request overlaps a clear can get a 500 from the
statistics middleware. The middleware is a side concern and must never break a page.

## Expected Behavior

- A session deleted at any of the points above never causes a 500, and the request is served
  normally.
- Touching a deleted session is a silent no-op.
- Tracking a visit for a deleted session is skipped: no `Visit` is created and no error is raised.
- Attaching a user to a deleted session keeps today's behaviour: it rotates to a new session tied
  to the user.
- Stale cookies still work as today. After a clear, `_session_from_cookie` returns `None` for the
  unknown token and a new session is created. A test now covers this.
- The normal path does not change.
- Skipped writes are not logged. This keeps the middleware quiet, as it is today.

### Acceptance criteria

- Regression tests delete the session at each point and assert a 200 with no exception. The
  points are: before the touch, before the visit is tracked, and before user attachment (both the
  in-place and the always-rotate paths).
- A stale-cookie test shows that, after `Session.objects.all().delete()`, the next request gets a
  new session and opens a new visit.
- The existing middleware, `visit_tracking` and `session_attachment` tests pass unchanged.

## Solution

Fix each failure where it happens. This is narrow, follows the existing atomic-`UPDATE` style,
and does not hide unrelated DB errors. A broad `try/except DatabaseError` in the middleware was
considered and rejected for that reason.

- **`_touch_session`:** replace `session.save(update_fields=['last_seen_at'])` with
  `Session.objects.filter(pk=session.pk).update(last_seen_at=now)`. `.update()` skips `auto_now`,
  so `now = timezone.now()` must be set explicitly, and it should also be assigned back to
  `session.last_seen_at`. An update that matches 0 rows just means the session is gone, so nothing
  raises.
- **`track_visit`:** wrap `Visit.objects.create(...)` in `transaction.atomic()` (a savepoint) and
  catch `IntegrityError`, skipping the visit. The savepoint is needed so a caught error does not
  break an outer transaction. Today the outer transaction is pytest's test transaction; later it
  could be `ATOMIC_REQUESTS`, if that is ever turned on.
- **`attach_user`:** no code change. Add tests for both paths on a deleted session.
- **Spec sync:** update `docs/agents/specs/statistics_dashboard/tracking-race.md` to list
  `_touch_session` as a failure point, and to say that attachment already rotates on its own.

### Testing strategy

- Simulate the race by deleting the session inside a `unittest.mock.patch` side effect at the
  right moment. A real concurrent delete is not needed. Use these hooks:
  - wrap `track_visit` to delete the session before the touch or the track;
  - wrap `attach_user` to delete the session before the attach.
- Unit tests in `visit_tracking_test.py` and `session_attachment_test.py` call the function on an
  already-deleted session.
- Middleware tests in `middleware_test.py` assert a 200 response and no new `Visit` for the
  deleted session.

### Performance & security

- Performance: one savepoint per `Visit` insert, which is negligible.
- Security: no new attack surface. A forged or stale cookie already falls back to a new session.

### Out of scope

- The Clear endpoint itself (#1684).
- Excluding dashboard requests from tracking. The spec accepts that the Clear request may count
  itself.
- Permissions, caching and navi: middleware only, with no endpoint added.
