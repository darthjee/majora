# Code review

Read the session path against each entry of `hypotheses.md` (1 IP flip from Tent custom
handlers, 2 refresh + parallel requests, 3 other IP change, 4 domain mismatch, 5 proxy/cache
replaying `Set-Cookie`, 6 cookie not stored or not sent) and note, per hypothesis, what the code
makes possible or impossible and what the scripts should show if it holds.

- Backend: `StatisticsSessionMiddleware` in `middleware.py` (`_load_or_create_session`,
  `_backfill_user`, `_set_cookie`), `session_attachment.py`, `cookies.py`,
  `visit_tracking.py`, `route_pattern.py`, `common/client_ip.py`.
- Proxy: Tent rules and custom handlers (`cache.php`, `delete.php`, `uploads.php`):
  `X-Forwarded-For` handling, `Set-Cookie` passthrough, whether cached responses can carry or
  drop `Set-Cookie`.
- Frontend: which requests fire in parallel on page load and refresh, and when the cookie is
  first available to them.
- Cookie attributes (`Domain`, `SameSite`, `Secure`, `Path`, expiry) against the production
  host setup (hypotheses 4 and 6).

Working notes stay local (in `reports/` or the chat); only conclusions reach `findings.md`.

## Files to Change

- None (read-only).
