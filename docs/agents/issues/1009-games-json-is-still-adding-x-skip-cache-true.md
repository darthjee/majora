# Issue: /games.json is still adding x-skip-cache true

## Description

This was supposed to have been solved on commit `e103c231791eafd9387e83f4e1ee225150fbeffb` (PR #1006, issue #1004), which made the `X-Skip-Cache` header conditional on the requesting host being listed in the backend's `GAMES_JSON_CACHE_DOMAINS` setting.

Confirmed by requesting `https://moria-api.ffavs.net/games.json` directly (no proxy in front): the response is a successful `200` (recognized `GameDomain`, empty game list) but still carries `x-skip-cache: true`.

## Problem

This is not a regression of the `#1004`/`#1006` logic — it is that logic firing exactly as coded, in `backend/games/views/games/games_list.py` (`_games_list_per_domain`):

```python
games = Game.objects.filter(id__in=DomainGamesCache.game_ids_for_domain(host))
response = paginated_list_response(request, games, GameListSerializer)
if host not in settings.GAMES_JSON_CACHE_DOMAINS:
    response['X-Skip-Cache'] = 'true'
```

`settings.GAMES_JSON_CACHE_DOMAINS` (`backend/majora_project/settings.py`) is populated purely from the `GAMES_JSON_CACHE_DOMAINS` env var. `moria-api.ffavs.net` (a `GameDomain` created specifically to exercise this code path) was never added to that env var, so the safe-default branch fires.

The deeper problem: `#1006` introduced this env var as a plain code diff, with no PR section calling out "this is a new environment variable that must be set in production" — so it was never actually deployed. This process gap is addressed in the Solution below.

## Expected Behavior

`GET /games.json` must never send an `X-Skip-Cache` header, for any host — recognized or not. Per-domain cache isolation for this endpoint is the proxy's job (`proxy/prod_configuration/rules/games.php` builds one Tent rule per domain, each independently gated on that domain via Tent's `RequestMatcher` domain matching), not the backend's.

The `POST` branch and the unrecognized-domain `404` branch are unaffected — they keep unconditionally setting `X-Skip-Cache` exactly as they do today; see Solution for why.

## Solution

Verified directly against the pinned `darthjee/tent:0.10.1` source (`Configuration::$rules` is a plain append-only array; each `foreach ($gamesJsonCacheDomains as $domain)` iteration in `games.php` builds its own `Rule` with its own domain-scoped matcher, and `RequestMatcher::matches()` genuinely checks that domain per request): the proxy's per-domain routing already works correctly for the two configured production domains. There is no proxy bug to work around here — the backend just needs to stop duplicating that responsibility.

Scope of the fix:

1. **`backend/games/views/games/games_list.py`**: in `_games_list_per_domain`, remove only the conditional `X-Skip-Cache` assignment on the successful `GET` branch (the one currently gated on `host not in settings.GAMES_JSON_CACHE_DOMAINS`), so `GET /games.json` never sets the header. **Leave the `POST` branch and the unrecognized-domain `404` branch untouched** — both must keep setting `X-Skip-Cache` unconditionally. Reasoning: `rules/backend.php` (the catch-all `.json` rule any request not matched by `games.php`'s GET-only rule falls through to) omits the `cache` key entirely, which `DefaultProxyRequestHandler::build()` defaults to `'./cache'` rather than disabling — so it caches any 2xx response for *any* HTTP method. Its cache key comes from `QueryRequestHasher`, a SHA-256 of the query string only, and `POST /games.json` carries no query string. If `X-Skip-Cache` stopped being set on `POST`, the first `POST /games.json` response would be cached, and Tent would serve that same cached response to every subsequent `POST /games.json` — from any user — without ever forwarding the request to the backend. No game would be created, and the caller would receive someone else's game-creation response. `docs/agents/access-control/game.md` already documents this as an intentional deviation from the general `X-Skip-Cache` rule; that stays true.
2. **`backend/majora_project/settings.py`**: remove the now-unused `GAMES_JSON_CACHE_DOMAINS` setting (its only consumer is the conditional-GET logic being removed).
3. **`backend/games/tests/views/games/games_list_test.py`**: update/remove the tests asserting the header is conditionally present on `GET` (`test_recognized_domain_response_does_not_set_skip_cache_header`, `test_recognized_domain_not_cache_partitioned_still_sets_skip_cache_header`, `test_unrecognized_domain_response_sets_skip_cache_header`, `test_recognized_domain_response_sets_skip_cache_header`) to instead assert the header is always absent from a successful `GET /games.json` response. Tests covering `POST` and the unrecognized-domain `404` continuing to set the header are unaffected.
4. **Docs**: update `docs/agents/cache-warmer.md` and `docs/agents/access-control/game.md` (both touched by `#1006` to document the old mechanism) to drop the retired `GAMES_JSON_CACHE_DOMAINS`/conditional-GET behavior, while keeping the still-accurate POST/404 `X-Skip-Cache` documentation.
5. **`proxy/prod_configuration/locals.php.sample`**: the comment block on `$gamesJsonCacheDomains` currently says it "must be kept in sync with the backend's `GAMES_JSON_CACHE_DOMAINS` env var" — that sync requirement goes away once the backend setting is removed. Update the comment to reflect that `$gamesJsonCacheDomains` is now purely a proxy-side concern.
6. **`.github/pull_request_template.md`**: add a required section:
   ```markdown
   ## Environment Variables & Settings

   <!-- List any new or changed environment variables / Django settings this PR introduces. Write "None" if not applicable. -->
   ```
7. **`docs/agents/contributing.md`**, under "Pull Requests": add a bullet alongside "Descriptive Summary":
   > **Environment Variables & Settings:** Every PR that introduces or changes an environment variable or Django/proxy setting must call it out explicitly in its own PR section, naming the variable and what deploying it requires (e.g. a new production env var to set). This is not satisfied by the variable merely appearing in a code diff.
8. **`docs/agents/contributing.md`**, under "Definition of Done for PRs": add:
   > - Any new or changed environment variable/setting is documented in the PR's "Environment Variables & Settings" section.

### Known accepted risk (not in scope here)

A domain not covered by any rule in `rules/games.php` (i.e. not listed in `$gamesJsonCacheDomains`) would have its `GET /games.json` response fall through to `rules/backend.php`'s shared, non-partitioned cache instead of a per-domain one. This is accepted because Apache (in front of Cloudflare and the Tent proxy) only forwards the two configured production domains through in the first place — both of which are covered by `games.php`.

## Benefits

- Removes a backend responsibility that duplicated infrastructure-level cache partitioning, eliminating the exact failure mode that caused this issue: a setting that had to be kept in lockstep across two independently-deployed layers (backend env var and proxy config), and silently drifted out of sync.
- The new PR-template/`contributing.md` requirement prevents this class of "new setting silently never deployed" problem from recurring for any future environment variable or setting.
