# Issue: Client spec: improve tokens.md

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Review
`docs/agents/specs/client/tokens.md` (written in #1593) against the epic's decisions and the
existing code, settle its open questions, and leave it ready to drive the implementation
sub-issue #1602 (`ApiToken` model, Bearer auth, expiry, last-used, auto-revoke).

This is a documentation-only issue: no backend code changes.

## Problem

`tokens.md` ends with an **Open questions** section that #1602 cannot be implemented without:

- the hashing algorithm for the secret, and whether it needs a salt;
- the prefix and secret lengths and their alphabet;
- where and how often the last-used time is written;
- the hook point for auto-revoke, and whether revoked tokens are deleted or flagged;
- how missing, malformed, expired or revoked tokens are reported.

Reading the code turned up two more gaps the page doesn't mention:

- `CookieTokenAuthentication` falls back to the session when there is no `Token` header, so a
  request carrying both a Bearer token and a session cookie depends on the order of the DRF
  authentication classes.
- `CookieTokenAuthentication` treats unapproved users as logged out; the page doesn't say
  whether the Bearer class does the same.

## Expected Behavior

- `docs/agents/specs/client/tokens.md` records every decision below in its **Decisions** section
  (with the rejected alternatives and their reasons), and its **Open questions** section is
  empty or removed.
- The page's **Affected code** section lists everything the decisions touch, including
  `backend/staff/views/staff_user_deny.py` and `DEFAULT_AUTHENTICATION_CLASSES` in
  `backend/majora_project/settings.py`.
- The hub `docs/agents/specs/client.md` is updated only if a decision changes its summary of
  this page.
- Cross-references point to `scopes.md` (#1595) for the 403 on a missing scope, and to
  `token-api.md` (#1596) for the session-only token management checks.

## Solution

Update `tokens.md` with the following decisions, agreed while refining this issue.

### Secret hashing

- **Algorithm: plain SHA-256, no salt.** The secret is server-generated with Python's `secrets`
  module and long and random (about 256 bits), so a salt or a slow hash adds nothing. Brute force
  and precomputed tables are infeasible either way. This is the usual scheme for API tokens
  (GitHub, Stripe, PyPI). The spec must give this reasoning so reviewers don't flag the missing
  salt.
- **What is hashed:** only the secret part, not the whole `mjr_<prefix>_<secret>` string. It is
  stored as a 64-character hex digest.
- **Lookup:** find the token by `prefix` (unique, indexed), then compare the SHA-256 of the
  presented secret with the stored hash using `hmac.compare_digest`. That is one indexed query
  and a constant-time comparison. The prefix must be unique, so its length and alphabet (see
  "Token format") must keep collisions negligible, with a retry when generation produces a clash.
- **Rejected: HMAC with a server-side pepper.** Rotating the key would break every token at once,
  and with a 256-bit random secret it adds little.
- **Rejected: Django password hashers (PBKDF2/Argon2).** They would add a slow hash (roughly
  100–300 ms) to every API call, and they only help with secrets that people choose.

### Token format: alphabet and lengths

- **Alphabet: base62** (`A–Z a–z 0–9`) for both the prefix and the secret. It has no `_` or `-`,
  so splitting on the `_` separators is unambiguous and double-clicking selects the whole token.
  Characters are drawn uniformly with
  `''.join(secrets.choice(ALPHABET) for _ in range(n))`. `secrets.token_urlsafe` is not used,
  because base64url contains `_` and `-`.
- **Prefix: 8 base62 characters** (about 2×10¹⁴ values), random and independent of the secret,
  so showing it leaks nothing. It is stored as a unique `CharField(max_length=8)`. Creation
  retries up to 3 times when the unique constraint raises an `IntegrityError`.
- **Secret: 43 base62 characters** (about 256 bits). Only its SHA-256 hex digest is stored, in a
  `CharField(max_length=64)`.
- **Full token:** `mjr_<prefix>_<secret>`, 56 characters. The authentication class requires an
  exact match of `^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})# Issue: Client spec: improve tokens.md

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Review
`docs/agents/specs/client/tokens.md` (written in #1593) against the epic's decisions and the
existing code, settle its open questions, and leave it ready to drive the implementation
sub-issue #1602 (`ApiToken` model, Bearer auth, expiry, last-used, auto-revoke).

This is a documentation-only issue: no backend code changes.

## Problem

`tokens.md` ends with an **Open questions** section that #1602 cannot be implemented without:

- the hashing algorithm for the secret, and whether it needs a salt;
- the prefix and secret lengths and their alphabet;
- where and how often the last-used time is written;
- the hook point for auto-revoke, and whether revoked tokens are deleted or flagged;
- how missing, malformed, expired or revoked tokens are reported.

Reading the code turned up two more gaps the page doesn't mention:

- `CookieTokenAuthentication` falls back to the session when there is no `Token` header, so a
  request carrying both a Bearer token and a session cookie depends on the order of the DRF
  authentication classes.
- `CookieTokenAuthentication` treats unapproved users as logged out; the page doesn't say
  whether the Bearer class does the same.

## Expected Behavior

- `docs/agents/specs/client/tokens.md` records every decision below in its **Decisions** section
  (with the rejected alternatives and their reasons), and its **Open questions** section is
  empty or removed.
- The page's **Affected code** section lists everything the decisions touch, including
  `backend/staff/views/staff_user_deny.py` and `DEFAULT_AUTHENTICATION_CLASSES` in
  `backend/majora_project/settings.py`.
- The hub `docs/agents/specs/client.md` is updated only if a decision changes its summary of
  this page.
- Cross-references point to `scopes.md` (#1595) for the 403 on a missing scope, and to
  `token-api.md` (#1596) for the session-only token management checks.

. Anything else is treated as a
  malformed token (see "Error reporting").
- **Rejected: base64url** (its `_`/`-` break parsing and selection) **and hex** (about 50%
  longer for the same entropy).
- **Rejected: a checksum suffix** (like GitHub's CRC32). It would catch typos without a database
  query and help secret scanners, but it adds format, tests and client work for little gain at
  this project's size.

### Last-used tracking

- **Where:** in the Bearer authentication class, right after the token passes every check
  (format, hash, expiry, revocation, owner approved). The token row is already loaded there, and
  the token logic stays in one place.
- **Meaning:** "last used" means "last authenticated". A request that authenticates but is then
  refused by a scope check (403) still counts, so a leaked token being probed shows up as
  activity. Failed authentications (wrong secret, expired, revoked) never update it.
- **How often:** on every authenticated request, with no throttling for now. The write is a
  targeted `ApiToken.objects.filter(pk=token.pk).update(last_used_at=now)`, not `token.save()`,
  so it never overwrites other fields (for example a rename happening at the same time).
- **Deferred: throttling the write** (for example only when the stored value is older than 60
  seconds). It can be added later if the extra write per request becomes a measurable cost. It
  is out of scope here.
- **Rejected: a middleware or post-response hook.** DRF authenticates lazily, so a middleware
  would have to inspect `request.auth`, and the token logic would be split across files.

### Auto-revoke and revocation

- **Hook point: inline in the staff deny view** (`backend/staff/views/staff_user_deny.py`),
  next to the existing `Token.objects.filter(user=user).delete()`. That view is the only place
  in the app that moves a user out of `approved` (it denies from any status). The approve view
  never revokes.
- **Backed by the owner-status check:** the Bearer authentication class rejects any token whose
  owner's profile status is not `approved`, the same way `CookieTokenAuthentication` already
  treats unapproved users as unauthenticated. This covers status changes the deny view never sees
  (Django admin, shell): such tokens stop working at once.
- **Known, accepted limitation:** a user moved approved → pending → approved purely through the
  Django admin or a shell keeps their tokens, which then work again on re-approval. The spec
  records this explicitly.
- **Rejected: overriding `UserProfile.save()` or a `post_save` signal.** Either would close the
  admin gap, but it hides a side effect in `save()` (or adds the first signal to `accounts`) to
  fix a path the app itself never takes.
- **Revoking deletes the row.** This covers auto-revoke, owner revocation and staff revocation.
  There is no `revoked_at` flag: a revoked token is gone for good and is never restored, so no
  lookup or list has to filter revoked rows. A revoked token then looks unknown to the
  authentication class, the same as a token that never existed. Expired tokens are not deleted
  automatically. They stay in the owner's list, shown as expired, until revoked.

### Error reporting

- **No `Authorization: Bearer` header:** the Bearer class returns `None` ("not mine") and DRF
  tries the next authentication class as usual.
- **Any `Bearer` header that does not authenticate:** the class raises `AuthenticationFailed`,
  which gives **401**. It never falls back to anonymous or session. An automation with a dead
  token must fail loudly rather than quietly read public data as anonymous. This deliberately
  differs from `CookieTokenAuthentication`, which swallows stale `Token` headers for the SPA's
  sake. Every `Bearer` header is treated as ours: a value that doesn't match the `mjr_` format
  is simply malformed.
- **One generic error for every failure:** malformed header, unknown prefix (never existed or
  revoked), wrong secret, expired token and owner not approved all return the same 401 with
  code `token_invalid` and DRF's default body (`{"detail": ...}`). Nothing tells the caller which
  check failed, so the order of the checks leaks nothing.
- **`WWW-Authenticate`:** Bearer 401s should carry `Bearer realm="api", error="invalid_token"`
  (RFC 6750). DRF takes the header from the first authentication class, so this depends on the
  class order (see "Authentication class order").
- **Out of this page:** a valid token that lacks the scope a request needs gets **403**, never
  401. That is specified in `scopes.md` (#1595) and only cross-referenced here.

### Authentication class order

- **`DEFAULT_AUTHENTICATION_CLASSES = [ApiTokenAuthentication, CookieTokenAuthentication]`** —
  the Bearer class goes first.
- **A request with a Bearer header is always a scoped request.** When it also carries a session
  cookie, the token decides: a valid token gives a scoped request, a bad one gives 401, and the
  session is ignored. The reverse order would let `CookieTokenAuthentication` (which ignores the
  `Bearer` keyword) fall back to the session and authenticate the full-access user. That would
  silently skip the token's scopes, and a dead token would even appear to work.
- **Token management stays session-only.** A request carrying both a token and a session
  authenticates as the token, so the session-only checks in `token-api.md` (#1596) refuse it.
- **Side effect:** every 401 across the API now carries `WWW-Authenticate: Bearer realm="api"`
  instead of `Token`, because DRF takes the header from the first class. Nothing in the backend,
  frontend or proxy reads this header, browsers only prompt on `Basic`, and the status stays 401.
- **Unaffected:** views with `@authentication_classes([])` (`auth/status`, `auth/header_status`,
  `domains/config`, `games/ready`, `access_route_config`) still ignore every credential. Legacy
  `Authorization: Token <key>` requests never reach the Bearer class, so `crawler/` doesn't
  change.

### Testing strategy

`tokens.md` lists what #1602 must cover:

- **Generation:** the token matches `^mjr_[A-Za-z0-9]{8}_[A-Za-z0-9]{43}$`; a prefix clash
  (`IntegrityError`) is retried; only the SHA-256 hash is stored; the plain token appears only in
  the creation response.
- **Authentication:** no `Bearer` header returns `None` (the next class runs). A malformed header,
  unknown prefix, wrong secret, expired token or unapproved owner each gives 401 with code
  `token_invalid`. A valid token authenticates as its owner, with the `ApiToken` as `request.auth`.
- **Last-used:** updated on a successful authentication, never on a failed one.
- **Class order:** with both a Bearer header and a session, a bad token gives 401 and is never
  rescued by the session; a valid token authenticates as the token, not the session.
- **Auto-revoke:** the staff deny view deletes the user's scoped tokens as well as their DRF
  tokens.

## Benefits

- #1602 can be implemented without design questions left open.
- The security-relevant choices (hashing, error reporting, authentication order, auto-revoke) are
  explicit and justified before any code is written, so the reviews of #1602 check against a
  stated design.
