# Issue: Fix: NPC creation response is missing X-Skip-Cache, leaking identity-tied fields via Tent cache

## Description
Found during the security review of PR #733 (issue #730). `POST /games/<slug>/npcs.json` (`_create_npc` in `backend/games/views/game/npcs/game_npcs.py`) serializes the newly-created NPC with `CharacterDetailSerializer`, which embeds requester-identity-tied fields (`can_edit`, `can_edit_money`, `can_exchange_treasure`) computed from the creating user's own identity — but the response never sets `X-Skip-Cache: true`.

## Problem
Every other call site that returns a `CharacterDetailSerializer`/`CharacterFullSerializer` body already sets `response['X-Skip-Cache'] = 'true'`:
- `backend/games/views/game/_detail.py:29` (`character_detail`)
- `backend/games/views/game/_money.py:26` (`character_money_update`)
- `backend/games/views/game/_full.py:25` (`character_full`)
- `backend/games/views/game/npcs/_npc_player_update.py:25` (`npc_player_update`)

`_create_npc` (`backend/games/views/game/npcs/game_npcs.py:39-54`) is the one outlier — its `Response(detail.data, status=201)` skips the header entirely.

This is exploitable, not just theoretical: `proxy/prod_configuration/rules/backend.php`'s rule matches any HTTP method (`ends_with '.json'`, no `method` key, so `Tent\Matchers\RequestMatcher::matchRequestMethod` treats a null `requestMethod` as matching everything), and Tent's `DefaultProxyRequestHandler` wires `FileCacheMiddleware` with a `StatusCodeMatcher(['2xx'])`, which includes `201`. `Tent\Content\FileCache` keys on HTTP method + path + query string (not body), so a `201` create response is cached under that POST+path+query key and replayed verbatim to the next POST hitting the same URL — meaning a later NPC-creation request (by the same or a different user, if the path/query line up) can receive a stale, previously-cached response containing another requester's `can_edit`/`can_edit_money`/`can_exchange_treasure` values instead of actually creating a new NPC.

## Expected Behavior
`_create_npc`'s response should set `X-Skip-Cache: true`, matching every other identity-tied `CharacterDetailSerializer`/`CharacterFullSerializer` response in the codebase, with a regression test mirroring `game_pc_detail_test.py::test_response_includes_x_skip_cache_header` (`backend/games/tests/views/game/pcs/game_pc_detail_test.py:93-96`).

## Solution
Add `response['X-Skip-Cache'] = 'true'` to the `_create_npc` return path in `backend/games/views/game/npcs/game_npcs.py`, following the same idiom used in `_detail.py`, `_money.py`, `_full.py`, and `_npc_player_update.py`. Add a regression test to `TestGameNpcsCreate` in `backend/games/tests/views/game/npcs/game_npcs_test.py` (near `test_create_returns_character_detail`, line ~285-295) asserting `response['X-Skip-Cache'] == 'true'`.
