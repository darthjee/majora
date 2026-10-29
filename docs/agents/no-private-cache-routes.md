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

Separately, any request authenticated with a scoped API token (`Authorization: Bearer ...`)
never reads from or writes to the private (or any) proxy cache, whatever the route (#1643, see
[proxy architecture](architecture/proxy.md#bearer-requests-never-touch-the-cache-bearerskipcachemiddleware)).

## Excluded routes

| Endpoint | Module/App | Why excluded |
|----------|------------|---------------|
| `GET /account/account.json` | `accounts` (`accounts.views.auth.account`) | Returns PII (name, email) — too sensitive to be a private-cache candidate. |
| `GET /account/authorization_requests.json` | `accounts` (`accounts.views.authorization_requests.list`) | Per-user sensitive data (pending authorization requests) — reserved from private caching. |
| `GET /account/api_tokens.json` | `accounts` (`accounts.views.api_tokens.list_create`) | Credential metadata (scoped API tokens) — never a private-cache candidate. |
| `GET /account/api_tokens/options.json` | `accounts` (`accounts.views.api_tokens.options`) | Per-user data (reachable games) for the token create form — never a private-cache candidate. |
| `GET /staff/users/<id>/api-tokens.json` | `staff` (`staff.views.staff_user_api_tokens`) | Credential metadata (another user's scoped API tokens) — never a private-cache candidate. |
| `GET /staff/statistics/export.json` | `staff` (`staff.views.staff_statistics_export`) | Raw statistics sessions with IP addresses and user ids, also readable by a `statistics:read` scoped token — never a private-cache candidate; sent with `Cache-Control: private, no-store`. |
