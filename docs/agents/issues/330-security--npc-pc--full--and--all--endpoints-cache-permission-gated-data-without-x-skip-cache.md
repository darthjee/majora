## Description
While reviewing PR #329 (issue #324, custom cache cleanup for NPC/PC routes), the security agent found a pre-existing gap unrelated to that PR's proxy-config-only diff:

`GET /games/:game_slug/npcs/all.json`, `GET /games/:game_slug/npcs/:character_id/full.json`, and `GET /games/:game_slug/pcs/:character_id/full.json` are gated by `GameEditPermission`/`CharacterEditPermission` (DM/owner-only, may include private-description content or hidden NPCs) in:
- `source/games/views/characters/game_npcs_all.py`
- `source/games/views/characters/game_npc_full.py`
- `source/games/views/characters/game_pc_full.py`

None of these views set the `X-Skip-Cache` response header (only `access_response()` in `source/games/views/common.py` does that today). Since the Tent reverse proxy caches `.json` GET responses (`CacheStalenessMiddleware`, `maxAgeSeconds => 10`) keyed purely on URL, not per-user identity, a permission-gated response served once to an authorized user (e.g. a DM's private NPC description) can be served from the shared proxy cache to a different, lower-privileged requester hitting the same URL within the cache window, bypassing the Django permission check entirely, since a cache hit never reaches Django.

`source/games/views/characters/game_npc_detail.py` and `game_pc_detail.py` should also be re-checked, since their hidden-NPC 404-vs-200 branching is user-dependent.

## Suggested fix
Add `response['X-Skip-Cache'] = 'true'` (mirroring `access_response()`) to the affected views, and confirm the corresponding frontend requests send `X-Skip-Cache` on the way in so the proxy actually skips caching for these responses.

## Reference
Found during security review of #324 / PR #329. See docs/agents/security-guidelines.md section 6 ("Insecure Proxy Rules", X-Skip-Cache bullet).
