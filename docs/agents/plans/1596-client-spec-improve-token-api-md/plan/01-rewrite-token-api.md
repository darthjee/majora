# Rewrite token-api.md

Rewrite `docs/agents/specs/client/token-api.md` from the issue's *Solution* section. Keep the
current Overview, updating the link and wording where needed. Restructure `## Decisions` as
follows, carrying over the existing owner, staff, validation and caching bullets where they still
hold:

1. **Endpoints.** The owner and staff URL tables, methods and actions. One view per URL. The
   integer pk as the id. Lookups scoped to the owner or to the URL's user, with 404 for anything
   outside the scope. No single-token GET. Rejected: the prefix as the URL id.
2. **Payloads.**
   - The token item, with an example JSON. Note that `games` is a list of `{slug, name}` and
     `status` is a convenience field.
   - Create: the request body and field rules. A missing or `null` `expires_at` means never.
     `owner` is always `request.user`, and unknown fields give 400 `not_editable`. JSON bodies
     only. 201 with `token`, once.
   - Rename: name only, 200. Other fields give 400 `not_editable`.
   - Revoke: 204.
   - Lists: plain arrays, newest first, no pagination.
3. **Validation and error codes.** The 400 table (now including unknown fields on create), the
   access table (401 / 403 `token_not_allowed` / 403 `not_allowed` / 404), 415 for form bodies,
   and 500 after the prefix retries run out.
4. **Session-only enforcement.**
   - What "session" means: `CookieTokenAuthentication`, cookie or legacy `Token`.
   - Why it matters: the escalation risk.
   - Two layers: fail-closed in the authentication class, plus the `require_session` helper in
     `backend/games/views/common.py`. The helper runs before `require_staff`, and `@restricted`
     is the outermost decorator.
   - Rejected: fail-closed only; a `@session_only` decorator.
5. **Reachable game.** One definition, shared by creation and request time: any game the owner's
   roles let them read.
6. **Caching, proxy and Navi.**
   - A Bearer request never reads or writes the proxy cache, and its writes still clear entries.
   - Bearer detection: the shared regex `(^|,)\s*bearer(\s|$)`, case-insensitive, on the joined
     value.
   - `BearerSkipCacheMiddleware` is prepended on `rules/backend.php` (marker `X-Skip-Cache`) and
     on `rules/private_game_data_cache.php` (marker `X-Bearer-Request`, through its own
     `skip_cache_header`), in the prod and dev configurations.
   - The private rule never stores or serves an entry when `X-Cache-Token` is empty.
   - The backend safety-net middleware sets `X-Skip-Cache: true` and `Cache-Control: no-store`
     on every Bearer response, and is listed after `CacheControlMiddleware`.
   - Spoofing the marker header only skips the sender's own cache, and the backend never reads
     it.
   - Other proxy rules and Navi are unchanged. Token endpoints keep a single `X-Skip-Cache`
     variant and stay out of the Navi chain.
   - Rejected: a Tent header matcher; the backend header alone; skipping on any `Authorization`
     header; per-token caching.
7. **Secret handling, logging and audit.** No `HistoricalRecords` on the hash. The hash is hidden
   in the admin. The `Authorization` header and the create response are never logged. Staff
   revocations are audit-logged, and the user is not notified. Rejected: staff creating a token
   on a user's behalf.
8. **CSRF.** The current posture (Lax cookie, CORS without credentials), the remaining same-site
   form-POST path, and the `JSONParser`-only decision. Link #1618.
9. **Edge cases.**
   - Duplicate names are allowed.
   - Losing access to a listed game revokes nothing.
   - `games: []` follows the owner over time; the UI warns staff and superusers.
   - A deleted game must revoke every token that lists it (rule for any future delete
     endpoint).
   - Expiry details, concurrency, and unapproved or inactive users.
10. **Access-control documentation (shipped with #1604).** The new `access-control/api-token.md`
    page, and the updates to `access-control.md`, `user.md`, `principles.md` (account routes and
    the DELETE exception), `endpoints.md` and `no-private-cache-routes.md`. `permissions.yaml`
    is unchanged.
11. **Rejected at the page level:** a create throttle and a per-owner cap (`tokens.md` keeps "no
    per-user limit"), and making `expires_at` required.

Then:

- Replace `## Open questions` with "None. Every open question was settled by #1596 and recorded
  under Decisions."
- Add `### Testing strategy` ("#1604 must cover:"), with the issue's grouped list: auth and
  session-only, create, rename and revoke, lists, staff, edge cases, backend cache headers, and
  proxy. #1604 gets `security` and `data-access` reviews.
- Update `## Affected code`. Add `backend/games/views/common.py` (`require_session`), the
  backend middleware and its `MIDDLEWARE` position in `backend/majora_project/settings.py`, and
  `proxy/extension/lib/middlewares/` with both proxy rules (prod and dev). Keep
  `backend/accounts/`, `backend/staff/urls.py` and the staff views, the access-control pages, and
  `navi/` (unchanged, context only).

## Files to Change

- `docs/agents/specs/client/token-api.md`: full rewrite of Decisions, Open questions, Testing
  strategy and Affected code.
