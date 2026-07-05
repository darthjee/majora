# Plan: Use custom cache cleanup for NPC and PC routes

Issue: [324-use-cuscom-cache-cleanup.md](../../issues/324-use-cuscom-cache-cleanup.md)

## Overview
Add a `custom` key to the existing `Tent\Middlewares\CacheCleanupMiddleware` configuration used for every `.json` backend route, so that mutating NPC and PC requests also clear the sibling/derived read endpoints (`npcs/all.json`, `npcs/:id/full.json`, `pcs/:id/full.json`) that the generic `collection`/`entity` cleanup cannot reach. This is a pure proxy configuration change; no Django code changes.

## Context
`CacheCleanupMiddleware` is configured once, generically, for all `.json` backend routes in `proxy/dev_configuration/rules/backend.php` and `proxy/prod_configuration/rules/backend.php`, with `'clear' => ['collection', 'entity']`. That only clears cache paths derived from strict path-segment prefixes of the written path, so it cannot reach `npcs/all.json` (a sibling of `npcs.json`) or `npcs/:id/full.json` / `pcs/:id/full.json` (siblings of `npcs/:id.json` / `pcs/:id.json`). The middleware supports an additive `custom` option — a map from an exact-match `:placeholder` route pattern to a list of concrete cache-path templates to also clear — which is implemented in Tent's own source (outside this repo); here we only add configuration entries.

Real backend routes (from `source/games/urls.py`, confirmed in the issue body):
- NPCs: `POST /games/<slug>/npcs.json`, `PATCH /games/<slug>/npcs/<character_id>.json`; reads: `npcs.json`, `npcs/all.json`, `npcs/<id>.json`, `npcs/<id>/full.json`.
- PCs: `POST /games/<slug>/pcs.json`, `PATCH /games/<slug>/pcs/<character_id>.json`; reads: `pcs.json`, `pcs/<id>.json`, `pcs/<id>/full.json` (no `pcs/all.json`).

## Implementation Steps

### Step 1 — Add `custom` entries to the dev proxy backend rule
In `proxy/dev_configuration/rules/backend.php`, add a `'custom'` key (sibling of the existing `'clear' => ['collection', 'entity']` line, which must be left untouched) inside the `CacheCleanupMiddleware` block, with exactly these three pattern entries:

```php
'custom' => [
    '/games/:game_slug/npcs.json' => [
        '/games/:game_slug/npcs.json',
        '/games/:game_slug/npcs/all.json',
    ],
    '/games/:game_slug/npcs/:character_id.json' => [
        '/games/:game_slug/npcs.json',
        '/games/:game_slug/npcs/all.json',
        '/games/:game_slug/npcs/:character_id.json',
        '/games/:game_slug/npcs/:character_id/full.json',
    ],
    '/games/:game_slug/pcs/:character_id.json' => [
        '/games/:game_slug/pcs.json',
        '/games/:game_slug/pcs/:character_id.json',
        '/games/:game_slug/pcs/:character_id/full.json',
    ],
]
```

Use `:character_id` (not `:npc_id`/`:pc_id`) so Tent's placeholder matcher restricts it to digits only (mirrors Django's `<int:character_id>` converter, shared by both NPC and PC routes). Do not add a `custom` entry keyed on `/games/:game_slug/pcs.json` — there is no `pcs/all.json` sibling, so the default `entity` clear already covers that route.

### Step 2 — Mirror the change in the prod proxy backend rule
Apply the exact same `CacheCleanupMiddleware` block (identical `custom` content) to `proxy/prod_configuration/rules/backend.php`. The two files intentionally mirror each other (dev uses a hardcoded host, prod uses `$backendHost`); only the `CacheCleanupMiddleware` array changes, nothing else in either file.

### Step 3 — Sanity-check PHP syntax
Since there is no automated CI job that lints or tests these proxy rule files, manually verify both files still parse as valid PHP (e.g. `php -l`, run through the `proxy` docker-compose service, never directly on the host) after editing.

## Files to Change
- `proxy/dev_configuration/rules/backend.php` — add the `custom` key to the `CacheCleanupMiddleware` config.
- `proxy/prod_configuration/rules/backend.php` — add the identical `custom` key to the `CacheCleanupMiddleware` config.

## Notes
- `CacheCleanupMiddleware` and its `custom` pattern/template matching logic live in Tent's own source (a dependency), not in this repo — no vendor code should be touched.
- No behavioral change is expected for any other route; `custom` is strictly additive to the existing `collection`/`entity` clearing.
- No change is needed to `source/games/urls.py` or any Django view/serializer — this is proxy-layer cache invalidation configuration only.
- Since this is a Tent proxy rule change, the architect should invoke the `security` review agent after this change is implemented, per the project's cross-cutting review policy.
