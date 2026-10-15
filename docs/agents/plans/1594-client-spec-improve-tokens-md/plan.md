# Plan: Client spec: improve tokens.md

Issue: [1594-client-spec-improve-tokens-md.md](../../issues/1594-client-spec-improve-tokens-md.md)

## Overview

Documentation-only. Rewrite `docs/agents/specs/client/tokens.md` so that every open question is
replaced by a recorded decision, using the decisions in the issue's **Solution** section, then
check that the hub and the sibling aspect pages stay consistent with them. No code changes.

## Context

`tokens.md` (written in #1593) ends with an **Open questions** section that blocks #1602
(`ApiToken` model, Bearer auth, expiry, last-used, auto-revoke). Refining #1594 settled all of
them: SHA-256 hashing without salt, a base62 token format (8-character prefix, 43-character
secret), last-used written on every request, auto-revoke inline in the staff deny view with
deletion on revoke, a single `token_invalid` 401 for every Bearer failure, the Bearer class
placed first in `DEFAULT_AUTHENTICATION_CLASSES` and checking the owner is approved, and a
testing strategy for #1602.

## Implementation Steps

### Step 1 — Update `tokens.md`

Edit `docs/agents/specs/client/tokens.md`, keeping the page template (**Overview**,
**Decisions**, **Open questions**, **Affected code**) and the existing decisions:

- **Model table:** set the column details: `prefix` is a unique `CharField(max_length=8)`, and
  `hashed secret` is a `CharField(max_length=64)` holding the SHA-256 hex digest.
- **Transport:** add the exact format (base62, 8 + 43 characters, 56 in total), the parsing
  pattern `^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})$`, and that any `Bearer` header is treated as
  a Majora token.
- **New subsections under Decisions**, each with its rejected alternatives and why:
  - *Secret hashing*: SHA-256 of the secret part only, no salt, with the reasoning (server-made
    256-bit random secret); lookup by prefix plus `hmac.compare_digest`; secrets generated with
    `secrets.choice` over base62 (not `token_urlsafe`); prefix-clash retry up to 3 times. Rejected:
    HMAC with a pepper, and Django password hashers.
  - *Token format*: rejected base64url, hex and a checksum suffix.
  - *Authentication*: the class goes first in `DEFAULT_AUTHENTICATION_CLASSES`, ahead of
    `CookieTokenAuthentication`, and why (a Bearer request is always scoped; the session never
    rescues or widens it; token management stays session-only); the order of checks (format,
    prefix, hash, expiry, owner `approved`); the `WWW-Authenticate: Bearer realm="api"` side
    effect, and that nothing reads it; the views with `@authentication_classes([])` that stay
    unaffected.
  - *Error reporting*: no `Bearer` header returns `None`; every failure raises
    `AuthenticationFailed`, giving 401 with the single code `token_invalid`; this deliberately
    differs from `CookieTokenAuthentication`; a missing scope is a 403 defined in
    [`scopes.md`](scopes.md).
- **Lifecycle:** make *Last-used tracking* precise: it is updated in the authentication class
  after every successful authentication (scope-refused requests count; failed authentications
  never do), on every request, as a targeted `.update()` rather than `save()`. Record throttling
  as deferred. Make *Revocation* and *Auto-revoke* precise: revoking deletes the row (no
  `revoked_at`); expired tokens stay listed until revoked; auto-revoke is inline in
  `staff_user_deny.py` next to the DRF `Token` deletion, backed by the owner-approved check;
  record the known limitation (approved → pending → approved through the admin keeps the tokens),
  and reject the `UserProfile.save()` override and the `post_save` signal.
- **Testing strategy:** add the section from the issue (generation, authentication, last-used,
  class order, auto-revoke).
- **Open questions:** remove the list, leaving a line saying they were all settled by #1594.
- **Affected code:** name `backend/staff/views/staff_user_deny.py` and
  `DEFAULT_AUTHENTICATION_CLASSES` in `backend/majora_project/settings.py` explicitly, and link
  [`token-api.md`](token-api.md) for the session-only token management checks.

### Step 2 — Check the hub and sibling pages for consistency

- `docs/agents/specs/client.md`: the "Tokens" line in **Aspect pages** must still describe the
  page. Change it only if a decision makes it wrong.
- `docs/agents/specs/client/token-api.md` and `token-ui.md`: "Revoke takes effect at once" and
  "Removes the token at once" already match deletion. Add a short cross-reference to
  `tokens.md` only where a page would otherwise contradict a decision (for example by implying
  a revoked state or a revoked list). Leave their own open questions to #1596 and #1597.
- `docs/agents/specs/client/scopes.md`: make sure its **Affected code** line on the Bearer class
  exposing the token (as `request.auth`) still holds. No other change; scope semantics belong to
  #1595.

## Files to Change

- `docs/agents/specs/client/tokens.md`: replace the open questions with decisions, add the
  testing strategy, and update the affected code.
- `docs/agents/specs/client.md`: only if the Tokens summary line becomes inaccurate.
- `docs/agents/specs/client/token-api.md`, `docs/agents/specs/client/token-ui.md`,
  `docs/agents/specs/client/scopes.md`: cross-reference fixes only, if needed.

## CI Checks

- Markdown: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes

- Documentation only: nothing under `backend/` changes. The code is written in #1602.
- Follow the writing style of the existing spec pages, and keep lines within the wrap width they
  already use.
- Don't settle questions that belong to other aspect pages (scope semantics in #1595, endpoint
  shapes in #1596). Only link to them.
