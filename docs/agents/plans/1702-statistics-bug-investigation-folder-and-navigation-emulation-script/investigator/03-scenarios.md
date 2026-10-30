# Navigation scenarios

Implement the scenarios from `docs/agents/specs/statistics-bug/scripts.md`, each with the
creation reasons it expects. Scenarios run sequentially, each with a fresh cookie jar unless it
says otherwise, and record their start and end time.

| Scenario | Hypothesis | Expected |
|---|---|---|
| First visit | — | one `no_cookie` session |
| Sequential navigation | — | the same session reused; no new session |
| Refresh burst, no cookie, anonymous | 2a | one `no_cookie` session per parallel request |
| Refresh burst, with cookie, anonymous | 2c | the existing session reused |
| Refresh burst, with cookie, logged in | 2b | at most one `login_rotation` session |
| Mixed handlers (standard + custom-handler routes) | 1 | no new session (an `ip_changed` session confirms hypothesis 1) |
| Login mid-navigation | 2b | one `login_rotation` session |
| IP change | 3 | one `ip_changed` session |
| Host change | 4 | one `domain_changed` session |

- **Refresh burst list:** read the frontend (`frontend/assets/js/`) for the API calls fired in
  parallel when a page loads (for example a game page, plus the account/user call), and encode
  that list. Name the source files in the README.
- **Mixed handlers:** standard-rule routes plus routes served by Tent custom handlers
  (`proxy/dev_configuration/rules/cache.php`, `delete.php`, `uploads.php`). Use only requests
  that are safe on local data (reads, or harmless requests a 4xx answer is fine for); never
  clear the cache or delete data.
- **Login:** log in with a local test user whose credentials come from the environment (never
  committed). Document the variables in the README.
- **IP change:** `SetClientIpMiddleware` overwrites `X-Forwarded-For`, so send this scenario's
  requests straight to the backend with `X-Proxy-Secret` and an `X-Forwarded-For` from the
  documentation ranges (`192.0.2.0/24`, `198.51.100.0/24`), switching IP mid-navigation.
- **Host change:** the same proxy under two local host names (for example `localhost` and
  `127.0.0.1`) with the same cookie. Check the cookie domain and `ALLOWED_HOSTS` locally; if
  the cookie is not sent to the second host, emulate the browser carrying it and note this.
- Expectations that turn out to be wrong are flagged, not "fixed" in the scenario: a mismatch
  is evidence.

## Files to Change

- `investigations/statistics-bug/emulate.py` — scenario definitions and runner.
- `investigations/statistics-bug/README.md` — burst source, login variables, scenario list.
