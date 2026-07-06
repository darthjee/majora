# Security Guidelines

This document is the authoritative checklist used by the `security` agent to review changes in the Majora project. It covers vulnerability patterns relevant to the Django backend (`source/`) and the Tent PHP proxy (`proxy/`).

Refer to this document whenever reviewing a diff that touches API endpoints, authentication/authorization logic, proxy configuration, or user-facing input handling.

---

## 1. Authentication Gaps

- Every non-trivial view must declare `@permission_classes` (DRF) or equivalent. Using `AllowAny` is only acceptable for endpoints that intentionally serve public, unauthenticated data (e.g. public game listings); it must be explicitly justified in a comment.
- Views that omit both `@authentication_classes` and `@permission_classes` inherit the DRF `DEFAULT_AUTHENTICATION_CLASSES` / `DEFAULT_PERMISSION_CLASSES` settings — verify those defaults are restrictive enough for the endpoint's data sensitivity.
- Admin views must not be reachable via the API router unless gated by `IsAdminUser` or equivalent.

## 2. Injection Risks

### Django ORM

- Avoid passing user-controlled data directly into `filter()` keyword arguments without validation (e.g. `filter(**request.query_params)` is dangerous).
- Never use `extra()`, `RawSQL()`, or `raw()` with unsanitised user input.
- URL-captured values (e.g. `<slug>`, `<id>`) must be constrained by the URL pattern type (e.g. `<int:id>`, `<slug:slug>`) — do not rely on downstream casting alone.

### PHP Proxy (Tent)

- Proxy rule files (`proxy/*/rules/*.php`) must not interpolate HTTP request data (headers, query params, body) into shell commands, `exec()`, `eval()`, `system()`, or dynamic `include`/`require` paths.
- Host-based routing in `configure.php` must use exact-match comparisons, not substring matches, to prevent header injection attacks via the `Host` header.

## 3. Insecure Headers

- API responses should not strip security headers that Django or Tent adds by default (e.g. `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
- Tent proxy rules must not override or remove security headers on proxied responses. Verify that `ProxyRule` / middleware chains do not call any header-stripping method on the response from Django.
- If a view sets `Access-Control-Allow-Origin: *`, flag it for review — CORS wildcards are acceptable only for fully public, read-only, non-cookie-authenticated endpoints.

## 4. Exposed Secrets

- No credentials, API tokens, secret keys, passwords, or private certificates may appear in source files, Dockerfiles, `docker-compose.yml`, or proxy configuration files.
- `.env` files (`.env`, `.env.*`) must be listed in `.gitignore` and must never be committed.
- Django's `SECRET_KEY` and database credentials must only be read from environment variables (via `os.environ` or `django-environ`) — never hardcoded.
- Any value loaded from the environment in `settings.py` must also be present in `.env.dev.sample` as a placeholder (no real value), so developers know the variable exists.

## 5. CSRF

- Django REST Framework views using `SessionAuthentication` are subject to CSRF enforcement. Do not use `@csrf_exempt` without confirming the endpoint uses a non-session authentication scheme (e.g. token-based or JWT).
- Views that bypass CSRF via `@csrf_exempt` must include a comment explaining why it is safe to do so.
- Verify that the `CsrfViewMiddleware` is present in `MIDDLEWARE` in `settings.py`; do not remove it.

## 6. Insecure Proxy Rules

- Tent proxy rules (`proxy/*/rules/*.php`) must route only the intended URL patterns to each upstream — overly broad patterns (e.g. `.*` matching everything) can expose unintended paths.
- Rules that proxy to the Django backend must not forward the raw `Authorization` header from the client to Django unless Django explicitly expects and validates it.
- Rules should restrict forwarded HTTP methods to those the upstream handler actually uses; do not forward `PUT`, `DELETE`, or `PATCH` to an endpoint that only handles `GET`.
- If Tent is configured to cache a route, confirm that the route serves identical content to all clients (unauthenticated public data) — never cache responses that contain user-specific data.
- **`X-Skip-Cache` header (cache bypass):** Majora's proxy rules set `'skip_cache_header' => 'X-Skip-Cache'`, meaning any request that carries this header bypasses the Tent cache entirely (no read, no write) — the mechanism for preventing user-specific data from leaking between accounts via the shared cache. Whenever a route serves (or might in the future serve) user-specific data, both sides must opt out: the **backend** sets the `X-Skip-Cache` response header on any response containing user-specific data, and the **frontend** sends the `X-Skip-Cache` request header on any API call expected to return user-specific data. Never introduce a new cached endpoint that returns per-user data without both — omitting either will cause Tent to store one user's data in the shared cache and serve it to a subsequent user who requests the same URL.

## 7. Input Validation

- Serializer fields must declare explicit types (e.g. `CharField`, `IntegerField`) and include validators where appropriate (e.g. `max_length`, `min_value`).
- Avoid `SerializerMethodField` that executes complex logic without input validation on data derived from the request.
- File upload fields (if added in future) must validate MIME type, file extension, and maximum size server-side — never rely solely on client-supplied `Content-Type`.
- Query parameters used for filtering or ordering must be validated against an allowlist of accepted field names; reject unknown parameter names with a `400` response.

## 8. Mass Assignment / Field-Level Update Authorization

- Update serializers (e.g. `CharacterUpdateSerializer`, `GameUpdateSerializer`,
  `TreasureUpdateSerializer`) must declare an explicit `Meta.fields` allowlist. Never use
  `fields = '__all__'`, and never rely on implicit exclusion via `Meta.exclude` — an
  allowlist is the only pattern that keeps newly added model fields safe by default.
- The allowlist must never include foreign keys that represent ownership/relationship
  chains (e.g. `game`, `player`, `character`) or other server-managed fields (e.g. slugs,
  ids, timestamps, computed fields). These must only ever be set server-side (on create,
  or via a dedicated, explicitly-reviewed transfer/reassignment endpoint) — never through
  a generic update payload.
- Every update serializer must have a regression test proving at least one
  disallowed/relationship field has no effect when included in an update payload
  alongside valid fields (i.e. `serializer.save()` leaves it unchanged). See
  `source/games/tests/serializers/test_character_update.py`,
  `test_game_update.py`, and `test_treasure_update.py` for the pattern to follow
  (`test_game_slug_is_not_included` is the reference example).
- When reviewing a diff that adds or modifies an update serializer for a new or existing
  entity, verify both of the above are true: an explicit allowlist with no
  ownership/relationship fields, and at least one regression test covering it.
