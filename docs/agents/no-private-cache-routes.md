# Routes Excluded From Private Caching

Restricted (per-user) GET endpoints that are deliberately **not** candidates for the
private-response-caching mechanism introduced in #949, even though they're otherwise
GET-only and authenticated. An endpoint ends up here when its response carries data
sensitive enough that the team doesn't want it to ever be considered for that caching
path, regardless of how the hashing/invalidation mechanism evolves.

This list is human-curated — there is no detection script. Add an entry whenever a
restricted GET endpoint is explicitly ruled out as a private-cache candidate during
issue discussion, so the reasoning stays traceable instead of getting re-litigated
each time the endpoint comes up again.

## Excluded routes

| Endpoint | Module/App | Why excluded |
|----------|------------|---------------|
| `GET /users/account.json` | `accounts` (`accounts.views.auth.account`) | Returns PII (name, email) — too sensitive to be a private-cache candidate. |
| `GET /account/authorization_requests.json` | `accounts` (`accounts.views.authorization_requests.list`) | Per-user sensitive data (pending authorization requests) — reserved from private caching. |
