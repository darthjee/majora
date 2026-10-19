# Proxy, cache and security docs

Make sure the spec's `token-api.md` "Caching, proxy and Navi", "Secret handling, logging and
audit" and "CSRF" sections, and the library's transport-security rule, live in permanent docs.

- **Proxy and cache**: `architecture/proxy.md`, `no-private-cache-routes.md` and
  `cache-warmer.md` already describe Bearer handling (#1643). Compare them with the spec's
  "Bearer detection", "Proxy", "Backend safety net" and "Token endpoints and Navi"
  subsections and add only what is missing. Do not duplicate.
- **Security guidelines**: in `security-guidelines/authentication.md`, add a scoped API token
  section: secrets are hashed and never serialized or logged, the full token appears only in
  the create response, staff revocations are audited, token endpoints are session-only,
  scoped tokens fail closed. Mention the CSRF behavior for Bearer requests in
  `security-guidelines/csrf.md` and the token secret in `security-guidelines/exposed-secrets.md`
  if the spec records rules not already there. Link `access-control/token-scopes.md` rather
  than repeating the scope rules.
- Note the client's HTTPS-only transport rule (with its reason) in
  `docs/agents/client/library.md` (step 01) and link it from the authentication guideline.

## Files to Change

- `docs/agents/architecture/proxy.md` — fill gaps only, if any.
- `docs/agents/no-private-cache-routes.md` — fill gaps only, if any.
- `docs/agents/cache-warmer.md` — fill gaps only, if any.
- `docs/agents/security-guidelines/authentication.md` — add the scoped API token section.
- `docs/agents/security-guidelines/csrf.md` — Bearer CSRF note, if missing.
- `docs/agents/security-guidelines/exposed-secrets.md` — token secret note, if missing.
