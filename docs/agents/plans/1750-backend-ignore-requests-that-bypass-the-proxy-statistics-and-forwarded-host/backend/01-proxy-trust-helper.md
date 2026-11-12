# Shared proxy-trust helper

Extract the proxy-secret logic from `common/client_ip.py` into a new module,
`common/proxy_trust.py`, so the middleware, `client_ip` and statistics share one decision.

- `proxy_secret()` moves here (read `PROXY_SECRET` from `os.environ` at call time, `''` if
  unset). Keep it importable from `common.client_ip` (re-export) so existing imports and
  tests keep working, or update the imports; either is fine as long as nothing breaks.
- `has_valid_proxy_secret(request)`: `secret_matches(request.META.get('HTTP_X_PROXY_SECRET'),
  proxy_secret())`, so it's `False` when the secret is empty. `client_ip._from_trusted_proxy`
  uses it, which keeps `client_ip`'s behavior **exactly** as it is today: an empty secret means
  `X-Forwarded-For` is ignored.
- `is_via_proxy(request)`: `True` when `proxy_secret()` is empty, otherwise
  `has_valid_proxy_secret(request)`. Document in the docstring why the empty-secret default is
  the opposite of `has_valid_proxy_secret`.
- `enforce_enabled()`: `os.environ.get('PROXY_ENFORCE', '').lower() == 'true'`, read at call
  time (tests use `monkeypatch.setenv`).
- Startup warning: next to `warn_if_proxy_secret_missing`, add a check that logs a `WARNING`
  on the `common` logger when `enforce_enabled()` and `proxy_secret()` is empty (enforcement
  is a no-op). The message never includes a secret value. Call it from
  `common/apps.py` `ready()`.
- Test isolation: in `backend/conftest.py`, add an autouse fixture that
  `monkeypatch.delenv`s `PROXY_SECRET` and `PROXY_ENFORCE` (`raising=False`).

Tests (`common/tests/proxy_trust_test.py`): every branch of `is_via_proxy` (empty secret,
matching, missing, wrong, non-ASCII header), `has_valid_proxy_secret` with an empty secret,
`enforce_enabled` values (`true`, `TRUE`, `false`, unset, other), and the new warning
(logged / not logged). `common/tests/client_ip_test.py` keeps passing unchanged.

## Files to Change

- `backend/common/proxy_trust.py` — new: `proxy_secret`, `has_valid_proxy_secret`,
  `is_via_proxy`, `enforce_enabled`, enforcement warning.
- `backend/common/client_ip.py` — reuse `has_valid_proxy_secret` / `proxy_secret`.
- `backend/common/apps.py` — call the new startup warning.
- `backend/conftest.py` — autouse env isolation fixture.
- `backend/common/tests/proxy_trust_test.py` — new tests.
