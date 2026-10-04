# Add a trusted client-IP resolver
Add a reusable helper, e.g. `backend/common/client_ip.py` with `client_ip(request)`, so IP trust lives in one place instead of inside the statistics middleware.

- Read the secret from `os.environ.get('PROXY_SECRET', '')` at call time, so tests can `monkeypatch.setenv`. A small `proxy_secret()` function next to it is enough.
- Trust the request only if both the secret and `request.META.get('HTTP_X_PROXY_SECRET')` are non-empty and `secrets.compare_digest` matches. This mirrors `StatisticsSessionMiddleware._skip_requested`.
- When trusted: take `HTTP_X_FORWARDED_FOR`, split on `,`, strip the first entry, and validate it with `ipaddress.ip_address`. Return it if valid.
- Otherwise, or on any missing or invalid value, return `REMOTE_ADDR`, or `None` if absent.

Tests in `backend/common/tests/client_ip_test.py`, using `RequestFactory`:
- trusted single value;
- trusted multi-value, where the leftmost wins;
- trusted with whitespace;
- trusted but invalid value, falling back to `REMOTE_ADDR`;
- wrong secret, so the forged header is ignored;
- missing header;
- secret unset, so `X-Forwarded-For` is ignored even when a header is sent;
- an IPv6 value.

## Files to Change
- `backend/common/client_ip.py` (new): `client_ip(request)` and the secret lookup.
- `backend/common/tests/client_ip_test.py` (new): unit tests.
