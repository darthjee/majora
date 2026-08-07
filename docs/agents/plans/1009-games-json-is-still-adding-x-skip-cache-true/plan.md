# Plan: /games.json is still adding x-skip-cache true

Issue: [1009-games-json-is-still-adding-x-skip-cache-true.md](../../issues/1009-games-json-is-still-adding-x-skip-cache-true.md)

## Overview

`GET /games.json` currently only omits `X-Skip-Cache` when the requesting host is listed in the backend's `GAMES_JSON_CACHE_DOMAINS` env var — a safe default that was never actually deployed after PR #1006, so the header is always present in practice. Per-domain cache isolation for this endpoint is already handled correctly by the proxy (`rules/games.php` builds one Tent rule per domain, each independently gated on that domain), so the backend should stop making this decision at all: `GET /games.json` must never set `X-Skip-Cache`. The `POST` and unrecognized-domain `404` branches are untouched — they must keep setting it unconditionally, since Tent's shared cache (`rules/backend.php`) caches any 2xx response for any HTTP method keyed only by query string, and removing it from `POST` would let one user's game-creation response be served to another. A process-improvement addition (PR template + `contributing.md`) is also in scope, to prevent a new env var/setting from silently going undeployed again as happened here.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)

## Shared contracts

- The backend's `GAMES_JSON_CACHE_DOMAINS` Django setting (and its identically-named env var) is removed entirely — it has no remaining consumer once the conditional-GET logic is gone.
- The proxy's `$gamesJsonCacheDomains` PHP array (`proxy/prod_configuration/locals.php.sample`, consumed by `rules/games.php`) is unaffected functionally, but is no longer expected to be kept "in sync" with any backend env var — it becomes a purely proxy-side concern. Only its documentation comment changes; no behavioral change on the proxy side.

## Architect direct work (cross-cutting docs & root-level files)

Not owned by either specialist agent above — handled directly by the architect as part of this same change:

1. **`.github/pull_request_template.md`**: add a required section:
   ```markdown
   ## Environment Variables & Settings

   <!-- List any new or changed environment variables / Django settings this PR introduces. Write "None" if not applicable. -->
   ```
2. **`docs/agents/contributing.md`**, under "Pull Requests": add a bullet alongside "Descriptive Summary":
   > **Environment Variables & Settings:** Every PR that introduces or changes an environment variable or Django/proxy setting must call it out explicitly in its own PR section, naming the variable and what deploying it requires (e.g. a new production env var to set). This is not satisfied by the variable merely appearing in a code diff.
3. **`docs/agents/contributing.md`**, under "Definition of Done for PRs": add:
   > - Any new or changed environment variable/setting is documented in the PR's "Environment Variables & Settings" section.
4. **`docs/agents/cache-warmer.md`**: line 61 currently notes that `/games.json`'s per-domain form is excluded from Navi's warming because it's cache-partitioned "via `$domainCacheLocation`, not blanket `X-Skip-Cache: true`" — this remains accurate (it already describes the proxy-side partitioning, not the backend's now-removed conditional header) and needs no change. Re-read it during implementation to confirm nothing else on that page references `GAMES_JSON_CACHE_DOMAINS`.
5. **`docs/agents/access-control/game.md`**: update the block (around lines 26-33) documenting the old mechanism:
   - Keep: "The `404` (unrecognized domain) and `POST` responses in this mode always set `X-Skip-Cache: true` ... those paths stay uncached."
   - Remove/replace: "A successful `GET` only omits it when the host is also in the `GAMES_JSON_CACHE_DOMAINS` ... default, including every host when the env var is unset), `GET` keeps setting `X-Skip-Cache: ...`" — replace with a statement that a successful `GET` never sets `X-Skip-Cache`, full stop, since per-domain cache isolation is enforced by the proxy.

## Notes

- No API contract, serializer, or permission change — `data-access`/`security` review gates should have nothing to flag here, but they still run as part of the normal pipeline.
- The `cache` agent's read-only review (restricted endpoints must set `X-Skip-Cache`) is not affected: `/games.json`'s `GET` is a public, `AllowAny` listing, not a restricted endpoint, so it was never expected to set the header under that rule in the first place.
