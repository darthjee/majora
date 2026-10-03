# Middleware: track visits and throttle Session writes

In `StatisticsSessionMiddleware`:

1. **Throttle the Session write.** In `_load_or_create_session`, when reusing a session, only
   write `last_seen_at` if `now - session.last_seen_at >= Settings.session_touch_interval_seconds()`.
   Because `last_seen_at` is `auto_now`, `save(update_fields=['last_seen_at'])` is fine for the
   write itself; just guard it.
2. **Track the visit.** Right after the session is resolved in `__call__` (before
   `get_response`, so the login request counts on the pre-rotation session), call a new
   `_track_visit(session)`:
   - `now = timezone.now()`; `cutoff = now - inactivity window`;
   - `updated = Visit.objects.filter(pk=<latest visit pk>, last_seen_at__gte=cutoff)
     .update(hits=F('hits') + 1, last_seen_at=now)` where the latest visit is
     `session.visits.order_by('-last_seen_at').values_list('pk', flat=True).first()`
     (covered by the `(session, last_seen_at)` index). Alternatively a single
     filtered update ordered by latest — keep it to one read + one write at most;
   - if nothing was updated (no visit, or expired) → `Visit.objects.create(session=session,
     started_at=now, last_seen_at=now, hits=1)`.
   - A freshly created session skips the lookup and creates the visit directly.
   Consider extracting this into `statistics/visit_tracking.py` (mirroring
   `session_attachment.py`) to keep the middleware small and the complexity report green.
3. **Skip** — the existing early return for `X-Statistics-Skip-Secret` already precedes this,
   so skipped requests touch no visit; keep it that way.
4. **Rotation** — `_backfill_user` is unchanged: visits are never moved. The rotated session
   gets its first visit on the next request carrying its cookie. Add a short docstring note.

## Files to Change

- `backend/statistics/middleware.py` — throttle Session write, call visit tracking
- `backend/statistics/visit_tracking.py` — new helper (optional, recommended)
