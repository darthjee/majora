# ApiTokenAuthentication and settings

Add `ApiTokenAuthentication(BaseAuthentication)` to `backend/accounts/authentication.py`, next to
`CookieTokenAuthentication`, and make it first:
`DEFAULT_AUTHENTICATION_CLASSES = ['accounts.authentication.ApiTokenAuthentication',
'accounts.authentication.CookieTokenAuthentication']` in `backend/majora_project/settings.py`.

`authenticate(request)`:

1. Read `HTTP_AUTHORIZATION`. If it does not match `(?i)(^|,)\s*bearer(\s|$)` → return `None`.
2. Otherwise every failure raises one `AuthenticationFailed` subclass/instance with code
   `token_invalid` and DRF's default detail. Checks in order: value splits into exactly two parts
   (scheme + token; a joined multi-header value is malformed); token fully matches
   `^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})$`; `ApiToken` with that prefix exists
   (`select_related('owner')`); `hmac.compare_digest` of hashes; not expired; `owner.is_active`;
   profile status `approved` (reuse the same check as `CookieTokenAuthentication._is_approved`,
   extracted to a shared helper if convenient).
3. On success: `ApiToken.objects.filter(pk=token.pk).update(last_used_at=timezone.now())`.
4. **Interim fail-closed (until #1603):** raise `PermissionDenied` with code `token_not_allowed`
   (403). Isolate this in one clearly named method (e.g. `_check_scopes(request, token)`) so #1603
   replaces its body with the real scope check. Note that the success return `(owner, api_token)`
   is therefore never reached by views yet; keep it after the check so #1603 only edits the method.

`authenticate_header(request)` returns `'Bearer realm="api"'`; for Bearer failures the header must
be `Bearer realm="api", error="invalid_token"` (store a flag on the request/exception or override
in a way that keeps non-Bearer 401s at `Bearer realm="api"`).

Tests in `backend/accounts/tests/api_token_authentication_test.py`:

- no `Authorization` header and `Token <key>` header → `None`;
- `bearer`, `BEARER`, tab separator, leading spaces are detected as Bearer;
- malformed (one part, three parts, joined `Token x, Bearer mjr_…`, bad pattern), unknown prefix,
  wrong secret, expired, inactive owner, pending owner, denied owner → 401 `token_invalid`, and
  `last_used_at` unchanged;
- valid token → `last_used_at` updated, then 403 `token_not_allowed` (interim);
- unit-test the success path of the authentication core (owner + token returned before the
  interim check) by patching `_check_scopes`, asserting `request.auth` is the `ApiToken`;
- end-to-end via `APIClient` on a real view: Bearer + session with a bad token → 401 (session never
  rescues it); Bearer + session with a valid token → 403 interim (not the session user's response);
- `WWW-Authenticate` value on a Bearer 401;
- existing `CookieTokenAuthentication` tests and legacy `Token` requests still pass unchanged.

## Files to Change

- `backend/accounts/authentication.py` — new `ApiTokenAuthentication`.
- `backend/majora_project/settings.py` — authentication class order.
- `backend/accounts/tests/api_token_authentication_test.py` — new tests.
- Any existing test asserting `WWW-Authenticate: Token` — update to `Bearer realm="api"`.
