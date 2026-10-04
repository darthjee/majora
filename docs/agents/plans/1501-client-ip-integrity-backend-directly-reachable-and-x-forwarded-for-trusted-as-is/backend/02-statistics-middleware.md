# Use it in the statistics middleware
Replace the body of `StatisticsSessionMiddleware._client_ip` with a call to `common.client_ip.client_ip(request)`, or drop the method and call the helper directly. Update the docstring, which currently says it prefers `X-Forwarded-For` unconditionally.

Update `backend/statistics/tests/middleware_test.py`. Tests that rely on `HTTP_X_FORWARDED_FOR` being stored must now set `PROXY_SECRET` and send `HTTP_X_PROXY_SECRET`. Add cases for:
- a forged `X-Forwarded-For` without the secret, which stores `REMOTE_ADDR`;
- a multi-value header with the secret, which stores the leftmost entry.

Search the backend for other tests that set `HTTP_X_FORWARDED_FOR` (e.g. accounts/login tests touching statistics) and adjust them the same way.

## Files to Change
- `backend/statistics/middleware.py`: use the shared resolver.
- `backend/statistics/tests/middleware_test.py`: adjust the existing IP tests; add spoofing and multi-value cases.
- Other backend tests that set `HTTP_X_FORWARDED_FOR`, if any.
