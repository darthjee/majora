# Issue a scoped token on poll

In `poll.py`, `_resolve_approved` keeps its checks (denied user, atomic approved→logged
transition). After winning the transition:

- **Scoped request:** create the token with
  `ApiToken.objects.create_token(owner=user, name=<name>, scopes=list(request.scopes),
  expires_at=timezone.now() + timedelta(hours=24))` — no games. Return
  `202 {"status": "approved", "token": plain_token}`. Do **not** create a legacy `Token`, do not
  touch `request.session`, do not call `attach_statistics_session`.
- **Name:** `Device authorization <YYYY-MM-DD> — <browser>` (date in the server timezone; when
  `browser` is blank, just the date part), truncated to `NAME_MAX_LENGTH` (100).
- **Plain request:** `_issue_login_credentials` unchanged.
- Put the 24-hour duration in a named constant (e.g. `SCOPED_TOKEN_LIFETIME`) and the name
  builder in a small helper, keeping the view thin.

Tests (`poll_test.py`): a scoped approved request returns an `mjr_` token that authenticates as
a Bearer token with exactly the requested scopes, `expires_at` ≈ now + 24h, the expected name
(including truncation and blank browser), no games; no DRF `Token` row is created, the session
has no `auth_token`, and no statistics session is attached; a second poll gets `403 not_found`;
plain requests unchanged.

## Files to Change

- `backend/accounts/views/authorization_requests/poll.py` — scoped branch.
- `backend/accounts/tests/authorization_requests/poll_test.py` — tests.
