# Plan: Fix: NPC creation response is missing X-Skip-Cache, leaking identity-tied fields via Tent cache

Issue: [734_fix--npc-creation-response-is-missing-x-skip-cache--leaking-identity-tied-fields-via-tent-cache.md](../issues/734-fix--npc-creation-response-is-missing-x-skip-cache--leaking-identity-tied-fields-via-tent-cache.md)

## Overview
`_create_npc` in `backend/games/views/game/npcs/game_npcs.py` returns a `CharacterDetailSerializer` body without setting `X-Skip-Cache: true`, unlike every other view that returns this serializer's requester-identity-tied fields (`can_edit`, `can_edit_money`, `can_exchange_treasure`). Add the missing header, matching the exact idiom already used in `_detail.py`, `_money.py`, `_full.py`, and `_npc_player_update.py`, and add a regression test mirroring the existing `test_response_includes_x_skip_cache_header` pattern.

## Context
This was found during the security review of PR #733 (issue #730), which added `X-Skip-Cache: true` to `_detail.py`'s `character_detail` response for the same reason. `_create_npc` is the one remaining call site that serializes a full `CharacterDetailSerializer` (with `can_edit`/`can_edit_money`/`can_exchange_treasure`) without the header. Because Tent's `backend.php` proxy rule matches `.json` paths regardless of HTTP method, and `FileCacheMiddleware` caches any `2xx` response (including `201`) keyed on method+path+query, a cached NPC-creation response can be replayed to a later POST hitting the same URL, leaking the original requester's identity-tied permission flags.

## Implementation Steps

### Step 1 — Add the missing header in `_create_npc`
In `backend/games/views/game/npcs/game_npcs.py`, change the final two lines of `_create_npc` from:
```python
detail = CharacterDetailSerializer(character, context={'request': request})
return Response(detail.data, status=201)
```
to:
```python
detail = CharacterDetailSerializer(character, context={'request': request})
response = Response(detail.data, status=201)
response['X-Skip-Cache'] = 'true'
return response
```
This matches the exact idiom in `backend/games/views/game/_detail.py:27-30`, `_money.py`, `_full.py`, and `npcs/_npc_player_update.py`. Optionally add a one-line comment/docstring note referencing issue #730's rationale (why the header is required), consistent with `_detail.py`'s docstring — use judgment on whether the existing docstring already conveys enough context or a short addition is warranted.

### Step 2 — Add a regression test
In `backend/games/tests/views/game/npcs/game_npcs_test.py`, inside `TestGameNpcsCreate` (after `test_create_returns_character_detail`, around line 285-295), add:
```python
def test_response_includes_x_skip_cache_header(self, client):
    """Test that the response includes the X-Skip-Cache: true header."""
    response = self._post(client, {'name': 'Villain'}, token=self.dm_token)
    assert response['X-Skip-Cache'] == 'true'
```
This mirrors `game_pc_detail_test.py::test_response_includes_x_skip_cache_header` (`backend/games/tests/views/game/pcs/game_pc_detail_test.py:93-96`), adapted to `TestGameNpcsCreate`'s existing `_post` helper and `dm_token` fixture already used by sibling tests in this class.

## Files to Change
- `backend/games/views/game/npcs/game_npcs.py` — set `response['X-Skip-Cache'] = 'true'` before returning from `_create_npc`.
- `backend/games/tests/views/game/npcs/game_npcs_test.py` — add `test_response_includes_x_skip_cache_header` to `TestGameNpcsCreate`.

## CI Checks
- `backend`: `poetry run pytest games/tests/views/game/` or `docker-compose run --rm majora_tests pytest games/tests/views/game/` (CI job: `backend-tests-game-views`, matches `pytest games/tests/views/game/ --cov ...` in `.circleci/config.yml`)
- `backend`: `poetry run ruff check .` (CI job: `backend-checks` lint step)

## Notes
- No serializer, model, or migration changes are needed — this is a response-header-only fix plus its test, scoped entirely to `backend/`.
- The proxy/Tent cache-keying behavior itself (method+path+query) is not being changed; this fix relies on the existing `X-Skip-Cache` mechanism already respected by the proxy layer (established in #730), so no `proxy/` changes are required.
