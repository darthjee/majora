# Issue: Fix selling of treasures

## Problem
Selling a treasure fails in production. The request

`POST https://moria.ffavs.net/games/tirania_dos_dragoes/pcs/1/treasures/sell.json`
with body `{"treasure_id":1,"quantity":1}`

returns `404 {"detail":"Not found."}` instead of succeeding.

<details>
<summary>Request</summary>

```
POST /games/tirania_dos_dragoes/pcs/1/treasures/sell.json HTTP/2
Host: moria.ffavs.net
Accept: application/json
Content-Type: application/json
```

Body
```json
{"treasure_id":1,"quantity":1}
```
</details>

<details>
<summary>Response</summary>

```
HTTP/2 404
content-type: application/json
```

Body:
```json
{"detail":"Not found."}
```
</details>

### Investigation

The route, view, and serializer for this endpoint already exist on `main` and look functionally correct, with passing tests (`games/tests/views/characters/game_character_treasure_sell_test.py`):

- Route: `games/urls.py` — `games/<slug:game_slug>/pcs/<int:character_id>/treasures/sell.json` → `game_pc_treasure_sell` (POST).
- View: `games/views/characters/game_pc_treasure_sell.py` resolves the `Game` by `game_slug`, the `Character` by `character_id` (PC only), then delegates to `character_treasure_sell`.
- Serializer (`games/views/characters/_treasure_exchange.py`) validates `treasure_id`/`quantity` from the request **body**, matching the sample request exactly.
- `treasure_id` refers to the catalog `Treasure.id`, resolved scoped to the game (`_find_game_treasure`); there is no separate `character_treasure_id` in the API surface.

None of the three originally hypothesized causes (wrong HTTP method, `treasure_id` expected in path, wrong id field) hold up against the current code.

**Confirmed by the reporter:**
- The production deploy is current (not lagging behind `main`).
- `treasure_id=1` in the sample request is the catalog `Treasure.id` (not a `character_treasure_id`), and the PC does own it.
- The failure is not specific to this game/character/treasure — selling fails the same way for every combination tried.

**Ruled out by investigation of the proxy layer** (`proxy/prod_configuration/`): the PHP "Tent" proxy in front of Django has no per-endpoint allowlist — `backend.php` proxies any `*.json` path to Django regardless of method or path segments, and `CacheCleanupMiddleware`'s invalidation map already explicitly references this exact route (`/games/:game_slug/pcs/:character_id/treasures/sell.json`), confirming the proxy config is aware of and current with this endpoint. `.htaccess` is a blanket rewrite-to-`index.php` rule, not a per-route allowlist. Responses are only cached on `2xx`, so a stale cached 404 is also ruled out.

Given the route/view/serializer read correctly on `main`, the proxy doesn't filter it, and the reporter-confirmed data is valid — the 404 is not explained by static code reading alone. It still returns a DRF-shaped `{"detail":"Not found."}` (not an Apache/proxy error page), so the request does appear to reach the Django app. The next step should be a runtime reproduction: hit the endpoint directly (bypassing the proxy) with this exact game/character/treasure, check Django logs/error tracking for the specific `Http404` raised, and/or add a regression test that reproduces the failure before attempting a fix.

## Expected Behavior
Selling a treasure a PC owns via `POST .../pcs/<id>/treasures/sell.json` with a valid `treasure_id`/`quantity` should succeed (200) and refund money, using the existing endpoint.
