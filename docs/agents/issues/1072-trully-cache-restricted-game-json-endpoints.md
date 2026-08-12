# Issue: Trully cache restricted game json endpoints

## Description

The private (per-caller) response-caching mechanism piloted in
`proxy/prod_configuration/rules/private_cache.php` (issue #949) has been tested and works.
This issue graduates it out of pilot status: remove its feature-flag gate, rename it to
reflect its real purpose, drop the test-only route it was piloted against, and point it at
real restricted `GET /games/...` endpoints.

## Problem

Restricted (DM/owner-gated) `GET` endpoints under `/games/...` unconditionally set
`X-Skip-Cache: true`, so Tent's identity-blind reverse-proxy cache never caches them — every
request hits the backend directly, even though the response only varies by the caller's
permission tier, not by every individual caller.

The private-cache mechanism (per-caller cache key via the `X-Cache-Token` header, already sent
on every frontend request) solves this safely, but today it's still gated behind
`$privateCacheEnabled` and only wired to one test-only route
(`GET /staff/cache/summary.json`), so none of the real restricted endpoints benefit from it.

## Solution

### Route scope

Bring these 3 routes under private caching:

- `GET /games/<slug>/npcs/all.json` (no `pcs/all.json` equivalent exists — NPCs have a
  "list all, including hidden" endpoint, PCs don't)
- `GET /games/<slug>/pcs/<char_id>/full.json`
- `GET /games/<slug>/npcs/<char_id>/full.json`

All three are GET-only, unconditionally set `X-Skip-Cache: true`, and are gated by a DM/owner
permission check (`check_game_edit` / `_check_character_edit`) — the same private-cache-fit
shape as the pilot `/staff/cache/summary.json` route being removed.

The 6 `@restricted` `summary/all.json` endpoints (treasures/documents/items × pcs/npcs) were
initially considered but are **deferred** — their underlying data changes too often
(most-mutable of the candidates), so they need their own staleness/invalidation review before
joining private caching. Tracked in the candidate inventory instead of being rushed in here.

Widening the search further (any GET view under `/games/...` that sets `X-Skip-Cache: true`,
decorator or manual) turned up a much larger, more heterogeneous set beyond even the summary
routes — other DM/owner-only "reveal everything including hidden" endpoints, per-caller-
identity endpoints (`my-games.json`, `players.json`, `conversations.json`), and endpoints only
conditionally skip-cached depending on whether the target object is hidden. All of that is out
of scope for this issue — see the candidate inventory below.

### Matcher style

One combined `regex` matcher for all 3 routes, added to `private_game_data_cache`:

```php
'matchers' => [
    [
        'method' => 'GET',
        'pattern' => '#^/games/[^/]+/n?pcs/(all|\d+/full)\.json$#',
        'type' => 'regex',
    ],
],
```

Tent's `exact` matcher type is literal-only (no wildcards), so `regex` is required regardless
of style given the `<slug>`/`<char_id>` segments — unlike today's single literal
`/staff/cache/summary.json` entry. One combined pattern was chosen over one-matcher-per-route
for conciseness. Note it also structurally matches `/games/<slug>/pcs/all.json`, which isn't a
real backend route (only `npcs/all.json` exists) — harmless (backend 404s it either way, still
consistently privately cached), just a minor imprecision worth knowing about.

### Rule rename mechanics

`Configuration::buildRule()` has no `name` field — a rule is only identified by the file path
`require_once`'d from `configure.php`, so "rename the rule to `private_game_data_cache`" means
renaming the file, in both environments:

- `proxy/dev_configuration/rules/private_cache.php` → `private_game_data_cache.php`
- `proxy/prod_configuration/rules/private_cache.php` → `private_game_data_cache.php`
- Update both `proxy/{dev,prod}_configuration/configure.php` `require_once` lines accordingly.
- Refresh the file's docstring — it currently frames the rule as a "pilot" scoped to plan #949
  and references the (now-removed) `$privateCacheEnabled` gate; both are stale once this issue
  lands.

### Gate removal & cleanup scope

Strip `$privateCacheEnabled` entirely from tracked files:

- Remove the `if ($privateCacheEnabled) { ... }` wrapper in both rule files (dev & prod) —
  `Configuration::buildRule([...])` runs unconditionally.
- Delete `$privateCacheEnabled = true;` from `proxy/dev_configuration/locals.php`.
- Delete `$privateCacheEnabled = false;` and its explanatory comment from
  `proxy/prod_configuration/locals.php.sample`.
- Remove `'/staff/cache/summary.json'` from the rule's matchers — it was test-only.

Note: the real `proxy/prod_configuration/locals.php` is gitignored/untracked — it's set
manually on the production server (per the sample's own comment) and this repo can't touch it.
Once this ships, that line becomes inert/unused there; worth removing on next server access,
but not a blocker for this PR.

### Cache staleness

`CacheStalenessMiddleware`'s `maxAgeSeconds` stays at its existing pilot value (`10`) for the
new rule — it wasn't tuned specifically for `/staff/cache/summary.json`'s update frequency, and
`10` is a reasonable, conservative default for the 3 new routes too. Revisit later if it proves
too aggressive/lax for `npcs/all.json` or `*/full.json` in practice.

### Follow-up: broader private-cache candidate inventory

`docs/agents/private-cache-candidate-routes.md` (already added and pushed) inventories every
other GET `/games/...` endpoint that sets `X-Skip-Cache: true` (unconditionally or
conditionally) and whether it looks like a private-cache candidate — a companion to the
existing `docs/agents/no-private-cache-routes.md` exclusion list. It is not yet verified
route-by-route.

**Plan task:** verifying/pruning that inventory (confirming each row's route, condition, and
candidacy) is part of this issue's plan, so the follow-up work is scoped and ready to pick up
later rather than needing rediscovery.

## Benefits

- Restricted, frequently-hit GET endpoints (NPC list, PC/NPC full detail) stop bypassing the
  reverse-proxy cache entirely, reducing backend load without risking cross-caller data
  leakage (each cache entry stays scoped to its caller via `X-Cache-Token`).
- Removes now-unneeded pilot scaffolding (`$privateCacheEnabled` gate, test-only staff route),
  leaving one clearly-named, always-on rule.
- Leaves a documented, revisitable inventory of further private-cache candidates instead of
  losing that analysis, so the next expansion doesn't need rediscovery.
