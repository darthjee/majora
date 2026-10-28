# Make the session touch a no-op on a deleted row

`StatisticsSessionMiddleware._touch_session` (`backend/statistics/middleware.py`) refreshes a
reused session's `last_seen_at` with `session.save(update_fields=['last_seen_at'])`. When the row
was deleted after `_session_from_cookie` loaded it, Django raises `DatabaseError("Save with
update_fields did not affect any rows.")`.

Replace the save with a filtered update, keeping the throttle exactly as it is:

```python
now = timezone.now()
if now - session.last_seen_at >= interval:
    Session.objects.filter(pk=session.pk).update(last_seen_at=now)
    session.last_seen_at = now
```

- `.update()` bypasses `auto_now`, so `now` is passed explicitly; assign it back to the instance
  so the in-memory session stays consistent with the old `save()` behaviour.
- An update matching 0 rows means the session is gone; nothing raises, and the request carries
  on to `_track_visit` (step 02 handles that).
- Adjust the docstring to mention that a vanished session is tolerated.

## Files to Change

- `backend/statistics/middleware.py` — `_touch_session` uses `Session.objects.filter(...).update(...)`.
