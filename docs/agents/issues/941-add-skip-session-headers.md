# Issue: Add skip session headers

## Description

Navi (the cache warmer) hits the backend the same way a real visitor does, so every crawl creates fake `statistics.Session` rows that pollute analytics data — especially right after a deploy, when Navi fully re-warms the cache and generates a large batch of false sessions at once.

## Problem

Right now, every request records a statistics session for later analytics use, via `StatisticsSessionMiddleware` (`backend/statistics/middleware.py`). Navi's cache-warming requests are indistinguishable from real visitor traffic to this middleware, so each deploy's cache-warming pass records a large number of false sessions, skewing analytics data.

## Expected Behavior

Requests originating from Navi never create a `statistics.Session` row or receive a statistics cookie. All other traffic continues to be tracked exactly as today. The change is inert (no behavior difference for anyone) until the shared secret is explicitly configured on both sides.

## Solution

Navi will send a shared-secret header on its requests; the backend will recognize it and skip statistics-session recording for that request only.

### Header & secret format

- Header: `X-Statistics-Skip-Secret`
- Env var (set identically in Navi's config and in the backend's settings): `STATISTICS_SKIP_SECRET`
- Format: a single static shared secret string, not a signed/rotatable token. The consequence of the header being guessed or leaked is limited to "some fake sessions stop being recorded" — not a security-sensitive action (no data exposure, no privilege gain) — so HMAC-signing/timestamp windows were considered and rejected as unnecessary complexity for this risk level.
- Backend comparison must use `secrets.compare_digest` (constant-time) rather than `==`, mirroring the existing internal-header pattern in `backend/games/views/upload_finalize.py:74` (`HTTP_X_UPLOAD_TOKEN` check).
- Naming is intentionally generic ("statistics skip", not "navi") so other internal tooling could reuse the same mechanism later if needed (see Scope below).

### Backend check location & behavior

- Check happens at the top of `StatisticsSessionMiddleware.__call__` (`backend/statistics/middleware.py:22`): if the header is present and matches, set `request.statistics_session = None` and short-circuit straight to `self.get_response(request)` — no `Session` row is created, no cookie is written.
- `request.statistics_session` is also read by two other call sites that assume it's always a real `Session`, and both need a one-line early-return guard for `None` so a skip-flagged request that also happens to hit an authenticated endpoint doesn't crash:
  - `_backfill_user` in `backend/statistics/middleware.py:62`
  - `attach_statistics_session` in `backend/accounts/views/auth/_shared.py:146` (used by `/login` and the authorization-request poll flow)
- Considered and rejected: attaching an in-memory, never-persisted "null" `Session`-like object instead of `None`, to avoid needing the guards above. Rejected because `attach_user`'s fallback path (`backend/statistics/session_attachment.py:19`) always calls `Session.objects.create(...)` when the in-place update fails (which it would for a `pk=None` object) — so the moment a skip-flagged request authenticates through `/login` or `poll`, it would silently create a real DB session anyway, defeating the purpose in a non-obvious way.
- Also considered and rejected: still creating the `Session` row but flagging it as synthetic/excluding it from stats queries later — contradicts the issue's intent of not registering the session at all, and leaves DB noise the feature is meant to avoid.

### Secret storage & env var naming

Follows the existing `MAJORA_PRODUCTION_URL` precedent exactly, since it's the same shape of value (backend + Navi need the same secret):

- `.env.dev.sample` — add `STATISTICS_SKIP_SECRET=<dev-placeholder-value>` next to `MAJORA_PRODUCTION_URL` (line 36). The `base` (backend) service already has `env_file: .env` (docker-compose.yml:26), so this reaches Django automatically.
- `docker-compose.yml` — `majora_navi` has no `env_file` and only receives vars explicitly listed in its `environment:` block (docker-compose.yml:124-125, currently `MAJORA_PRODUCTION_URL` and `NAVI_PORT`); add `STATISTICS_SKIP_SECRET=$STATISTICS_SKIP_SECRET` there too, or it won't reach Navi.
- `navi/navi_config.yaml` — add a `headers:` block under `clients.default` (alongside `base_url`/`timeout`, lines 12-14): `X-Statistics-Skip-Secret: $STATISTICS_SKIP_SECRET`, using Navi's existing `$VAR` env-var substitution support.
- Backend — add a `skip_secret()` static method to `backend/statistics/settings.py`, next to `cookie_max_age_seconds()`, reading `os.environ.get('STATISTICS_SKIP_SECRET', '')` directly (no new shared `env_str` helper — single use, so a helper would be premature abstraction).
- Production — set the real value through whatever channel already provisions `MAJORA_PRODUCTION_URL` in prod; out of scope for this issue to define that channel.

### Security implications

- No oracle: a request with a missing or wrong secret just falls through to normal session recording — same response either way, so the endpoint can't be used to brute-force or verify guesses at the secret from the outside.
- Blast radius confirmed low: `statistics.Session` is only read by the auth flows (`login`, `poll`, `logout`) to tie a session to a user post-login — it isn't used anywhere for rate-limiting, fraud detection, or audit trails. A leaked secret lets someone avoid *analytics* tracking, not security monitoring — consistent with the earlier decision to skip HMAC/rotation.
- No log-leakage surface: this repo has no Sentry integration or request-logging middleware that would capture/persist headers as breadcrumbs, so the secret isn't at risk of ending up in error-tracking logs via some other system reading `request.META`.
- Considered and rejected (for now): logging a line when the header is present but wrong, as a signal of secret-guessing attempts. Rejected given the low blast radius above and no existing security-monitoring pipeline to consume such a signal — would be dead code today. Worth revisiting only if this mechanism's scope grows beyond Navi.

### Scope

- Navi-only for this issue: only `navi/navi_config.yaml`'s `clients.default` gets the header wired up, and this is the only caller expected to send it in production.
- The header/env-var naming stays generic ("statistics skip", not "navi") so other internal tooling could adopt the same backend mechanism later without a rename — but no other caller is being added now, and the backend check has no Navi-specific logic (it's a plain shared-secret header check), so extending scope later is just a config change, not a code change.

### Fail-safe / rollout behavior

- Configured secret empty/unset (e.g. before the env var is rolled out to prod) must be treated as "feature disabled" and always fall through to normal recording — never let an unset/empty secret accidentally match an absent or empty header. This also avoids a real bug: `secrets.compare_digest` raises `TypeError` if either side is `None`, and a missing header reads as `None` from `request.META.get(...)`, so the comparison must only run when both a non-empty configured secret *and* a header value are present.
- Header missing (Navi not yet updated, or any other caller) → normal recording, unaffected — today's behavior, unchanged.
- Header present but wrong → normal recording, no error, no distinguishable response (ties back to the "no oracle" point above).
- Rollout order: ship the backend change first — it's inert with the env var unset, so no coordination is needed with Navi. Then set `STATISTICS_SKIP_SECRET` in both the backend's and Navi's env and redeploy Navi. Worst case during the gap is continued over-recording (today's status quo), never a crash or an accidental bypass.

### Testing

Following the existing style in `backend/statistics/tests/middleware_test.py` (Django test `client`, `HTTP_X_...=` kwargs, `pytest.mark.django_db`), add:

1. `test_skips_session_when_valid_skip_header_present` — `monkeypatch.setenv('STATISTICS_SKIP_SECRET', ...)`, send the matching header, assert `Session.objects.count() == 0` and no statistics cookie in the response.
2. `test_creates_session_when_skip_header_missing` — secret configured, no header sent → session created as today (regression guard).
3. `test_creates_session_when_skip_header_wrong_value` — secret configured, header sent with a wrong value → session created, no crash.
4. `test_creates_session_when_skip_secret_not_configured` — secret unset, header sent with some value → session still created (covers the fail-safe/`TypeError`-avoidance guard above).
5. `test_no_crash_when_skip_header_used_on_authenticated_request` — hit an authenticated endpoint (mirroring `test_backfills_user_on_anonymous_session_when_request_is_authenticated`'s use of `HTTP_AUTHORIZATION`) with the skip header present → 200 response, `Session.objects.count() == 0`, exercising the `_backfill_user` `None`-guard.
6. A corresponding case for `attach_statistics_session` (`accounts/views/auth/_shared.py:146`) — hit `/login` (or the poll endpoint) with the skip header present → no crash, no `Session` row created, exercising that guard directly.

## Benefits

- Analytics data reflects real visitors only, no longer polluted by cache-warmer noise after every deploy.
- The mechanism is fail-safe by design: inert until the secret is explicitly configured, so rollout carries no risk of breaking existing tracking or crashing on partial deploys.
- Reuses established patterns already in the codebase (shared-secret request-header check, env var wiring via `.env`/docker-compose) rather than introducing new infrastructure or a new secret-management approach.
