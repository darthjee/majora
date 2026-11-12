# Statistics skip untrusted requests

In `statistics/middleware.py`, `StatisticsSessionMiddleware._skip_requested` also returns
`True` when `getattr(request, 'via_proxy', True)` is false. An untrusted request then gets no
session lookup, no visit and no cookie. Check this first, before the route resolution, so
untrusted requests don't pay for `route_pattern`. Update the class docstring's list of
exemptions.

Update the existing tests in `statistics/tests/middleware_test.py`:

- Rewrite `test_forged_forwarded_for_without_proxy_secret_stores_remote_addr`: with
  `PROXY_SECRET` set and no `X-Proxy-Secret`, assert that **no** `Session` is created and no
  statistics cookie is set (rename the test accordingly).
- Add: an untrusted request with a valid `X-Statistics-Skip-Secret` is still untracked; a
  trusted request (matching secret) is still tracked; with an empty `PROXY_SECRET`, requests
  are tracked as today.

## Files to Change

- `backend/statistics/middleware.py` — skip untrusted requests.
- `backend/statistics/tests/middleware_test.py` — rewrite one test and add the cases above.
