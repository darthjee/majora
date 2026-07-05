# Issue: Use custom cache cleanup for NPC and PC routes

## Description
The proxy (Tent) already runs `Tent\Middlewares\CacheCleanupMiddleware` on every mutating request (`POST`, `PATCH`, `PUT`, `DELETE`) to any `.json` backend path. This is configured once, generically, in `proxy/dev_configuration/rules/backend.php` and `proxy/prod_configuration/rules/backend.php`:

```php
[
    'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
    'location' => './cache',
    'clear'    => ['collection', 'entity']
]
```

`clear => ['collection', 'entity']` makes the middleware delete two cache directories derived purely from the request path's segments:
- **`collection`**: the cache dir for the path with its last segment dropped (e.g. a write to `/x/y/z.json` clears the `GET` cache of `/x/y.json`).
- **`entity`**: the cache dir for the exact request path itself (e.g. a write to `/x/y/z.json` clears the `GET` cache of `/x/y/z.json`).

Both are computed purely from path *segments* — the middleware has no way to know about a sibling/derived endpoint that isn't a strict prefix of the written path. For that, `CacheCleanupMiddleware` supports an additional, **additive** `custom` option: a map from a `:placeholder` route pattern to an explicit list of cache-path templates to clear when a mutating request's path matches that pattern. `custom` never replaces `clear` — both run for a matching request.

Pattern/template mechanics (important for whoever implements this, since it lives in Tent's source, not in this repo):
- A pattern like `/games/:game_slug/npcs.json` is compiled into an **anchored, exact-match** regex against the full request path — including the literal `.json` suffix. It is not a prefix match and does not know about `.json` as an "extension"; it's just literal text in the pattern.
- `:name` segments are placeholders. The character class used depends on the name: `:slug`/`:xxx_slug` → `[A-Za-z0-9_-]+`, `:id`/`:xxx_id` → digits only, `:uuid`/`:xxx_uuid` → canonical UUID shape. Any other placeholder name throws a config error.
- When a pattern matches, the captured values are substituted into every target template's `:name` tokens (e.g. `game_slug=space-invaders` turns `/games/:game_slug.json` into `/games/space-invaders.json`) before that concrete path's cache is cleared.
- More than one `custom` pattern can match the same request path; all matching entries' targets are cleared.

## Problem
The real backend routes for NPCs (see `source/games/urls.py`) are:
- `POST /games/<game_slug>/npcs.json` — create an NPC (collection endpoint)
- `PATCH /games/<game_slug>/npcs/<character_id>.json` — update an NPC (entity endpoint)

And the related read endpoints are:
- `GET /games/<game_slug>/npcs.json` — list
- `GET /games/<game_slug>/npcs/all.json` — a separate "all NPCs" listing endpoint
- `GET /games/<game_slug>/npcs/<character_id>.json` — single NPC
- `GET /games/<game_slug>/npcs/<character_id>/full.json` — a separate "full" detail endpoint for a single NPC

Given the generic `collection`/`entity` cleanup already in place:
- `POST /games/<slug>/npcs.json` → `entity` clears `GET /games/<slug>/npcs.json` (the list) already. It does **not** touch `npcs/all.json`, since that's a sibling path, not a path-segment prefix/suffix relationship.
- `PATCH /games/<slug>/npcs/<id>.json` → `collection` clears `GET /games/<slug>/npcs.json` and `entity` clears `GET /games/<slug>/npcs/<id>.json` already. It does **not** touch `npcs/all.json` or `npcs/<id>/full.json`.

So today, after creating or updating an NPC, the `npcs/all.json` and `npcs/<id>/full.json` GET responses stay cached with stale data until they separately expire/are cleared by something else.

The same problem exists for PCs, with one difference confirmed by reading `source/games/urls.py`: there is **no `pcs/all.json` route** — only NPCs have that "all" listing endpoint. So the real PC routes are:
- `POST /games/<game_slug>/pcs.json` — create a PC (collection endpoint)
- `PATCH /games/<game_slug>/pcs/<character_id>.json` — update a PC (entity endpoint)

And the related read endpoints are:
- `GET /games/<game_slug>/pcs.json` — list
- `GET /games/<game_slug>/pcs/<character_id>.json` — single PC
- `GET /games/<game_slug>/pcs/<character_id>/full.json` — a separate "full" detail endpoint for a single PC

Given the generic `collection`/`entity` cleanup:
- `POST /games/<slug>/pcs.json` → `entity` already clears `GET /games/<slug>/pcs.json`. There is no PC equivalent of `npcs/all.json`, so nothing else needs custom handling for the create case.
- `PATCH /games/<slug>/pcs/<id>.json` → `collection` already clears `GET /games/<slug>/pcs.json` and `entity` already clears `GET /games/<slug>/pcs/<id>.json`. It does **not** touch `pcs/<id>/full.json`.

So today, after updating a PC, the `pcs/<id>/full.json` GET response stays cached with stale data.

## Expected Behavior
After a `POST` to `/games/:game_slug/npcs.json` or a `PATCH` to `/games/:game_slug/npcs/:character_id.json`, the cache for every NPC read endpoint affected by that write should be cleared, so the next `GET` to any of them returns fresh data:
- `POST /games/:game_slug/npcs.json` should additionally clear the cache of:
  - `/games/:game_slug/npcs.json`
  - `/games/:game_slug/npcs/all.json`
- `PATCH /games/:game_slug/npcs/:character_id.json` should additionally clear the cache of:
  - `/games/:game_slug/npcs.json`
  - `/games/:game_slug/npcs/all.json`
  - `/games/:game_slug/npcs/:character_id.json`
  - `/games/:game_slug/npcs/:character_id/full.json`

(The `npcs.json` and `npcs/:character_id.json` entries above are already covered by the existing `collection`/`entity` clearing — they're listed here because the issue that motivated this asked for them explicitly and being explicit costs nothing; the two entries that actually change behavior are `npcs/all.json` and `npcs/:character_id/full.json`.)

Analogously, after a `PATCH` to `/games/:game_slug/pcs/:character_id.json`, the cache for every PC read endpoint affected by that write should be cleared:
- `PATCH /games/:game_slug/pcs/:character_id.json` should additionally clear the cache of:
  - `/games/:game_slug/pcs.json`
  - `/games/:game_slug/pcs/:character_id.json`
  - `/games/:game_slug/pcs/:character_id/full.json`

(As with NPCs, `pcs.json` and `pcs/:character_id.json` are already covered by `collection`/`entity`; the entry that actually changes behavior is `pcs/:character_id/full.json`. There is no `custom` entry needed for `POST /games/:game_slug/pcs.json`, since — unlike NPCs — there is no `pcs/all.json` sibling endpoint to reach.)

## Solution
Add a `custom` key to the existing `CacheCleanupMiddleware` configuration in **both**:
- `proxy/dev_configuration/rules/backend.php`
- `proxy/prod_configuration/rules/backend.php`

(These two files mirror each other — one uses a hardcoded host, the other a `$backendHost` variable — but the `CacheCleanupMiddleware` block itself should be identical in both.)

```php
[
    'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
    'location' => './cache',
    'clear'    => ['collection', 'entity'],
    'custom'   => [
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
]
```

Notes for implementation:
- `:character_id` (not `:npc_id`/`:pc_id`) was chosen to mirror the parameter name used in `source/games/urls.py` (`<int:character_id>`, shared by both NPC and PC routes). It must end in `_id` so Tent's placeholder matcher restricts it to digits only, matching Django's `<int:...>` converter.
- Do not remove or change the existing `'clear' => ['collection', 'entity']` line — `custom` is additive, not a replacement.
- This middleware instance is shared by every `.json` backend route (the rule matches `['uri' => '.json', 'type' => 'ends_with']`), so `custom` entries for unrelated resources can coexist here later; this change should only add the NPC- and PC-related entries above.
- There is intentionally no `custom` entry keyed on `/games/:game_slug/pcs.json` (the PC collection/create route) — since `pcs/all.json` doesn't exist, the default `entity` clear on that route already does everything needed.
- No behavioral change is expected for any other route, and no change is needed to `source/games/urls.py` or any Django view — this is proxy-layer cache invalidation only.

## Benefits
- Prevents `GET /games/:game_slug/npcs/all.json`, `GET /games/:game_slug/npcs/:character_id/full.json`, and `GET /games/:game_slug/pcs/:character_id/full.json` from serving stale character data after a create or update, without weakening or restructuring the existing generic `collection`/`entity` cache cleanup used by every other backend endpoint.
