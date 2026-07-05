# Backend Plan: Security: NPC/PC 'full' and 'all' endpoints cache permission-gated data without X-Skip-Cache

Main plan: [plan.md](plan.md)

## Shared contracts

Set the response header `X-Skip-Cache: true` (mirroring `access_response()` in
`source/games/views/common.py`) on:

- `GET /games/:slug/npcs/all.json` — `source/games/views/characters/game_npcs_all.py`
- `GET /games/:slug/npcs/:id/full.json` — `source/games/views/characters/game_npc_full.py`
- `GET /games/:slug/pcs/:id/full.json` — `source/games/views/characters/game_pc_full.py`
- `GET /games/:slug/npcs/:id.json` — `source/games/views/characters/game_npc_detail.py`
  (only this one needs the fix on the backend side; `game_pc_detail.py` is unaffected —
  see plan.md's Notes)

## Implementation Steps

### Step 1 — `game_npcs_all.py`

`paginated_list_response()` (in `common.py`) returns a plain `Response` with no
skip-cache header, and it is shared by other (non-gated) list views, so do not modify the
shared helper. Instead, in `game_npcs_all`, capture the returned response and set the
header before returning:

```python
response = paginated_list_response(request, npcs, CharacterListSerializer)
response['X-Skip-Cache'] = 'true'
return response
```

### Step 2 — `game_npc_full.py` and `game_pc_full.py`

Both already build the `Response` manually. Add `response['X-Skip-Cache'] = 'true'`
before `return response`, mirroring `access_response()`.

### Step 3 — `game_npc_detail.py`

The hidden-NPC gate (`if character.hidden and not character.can_be_edited_by(request.user): raise Http404`)
means the same URL can return 404 to most requesters and 200 with full character data to
the DM/owner. Because Tent decides whether to *read* from cache purely from the
request's headers (before Django ever runs), a conditional/partial fix on the response
side alone is not sufficient — pair this with the frontend always sending the request
header for this endpoint (see `frontend.md`). On the backend, always set
`X-Skip-Cache: true` on the response returned by this view (for both the GET and PATCH
branches — PATCH responses are not cached by Tent anyway, so this is harmless there):

```python
response = detail_or_update(
    request,
    character,
    CharacterEditPermission,
    CharacterUpdateSerializer,
    CharacterDetailSerializer,
    detail_context={'request': request},
)
response['X-Skip-Cache'] = 'true'
return response
```

Do **not** touch `game_pc_detail.py` or the shared `detail_or_update`/`_serialize_detail`
helpers in `common.py` — `hidden` has no gating effect for PCs today (see plan.md's
Notes), and changing the shared helper would silently disable caching for
`game_detail`, `game_session_detail`, and `treasure_detail` too, which is out of scope.

### Step 4 — Tests

Add a regression test to each of the following files asserting
`response['X-Skip-Cache'] == 'true'` on a successful (200) authorized request, following
the existing pattern in `source/games/tests/views/characters/game_npc_access_test.py`
(`test_..._x_skip_cache_header` style) and `source/games/tests/views/common_test.py`:

- `source/games/tests/views/characters/game_npcs_all_test.py`
- `source/games/tests/views/characters/game_npc_full_test.py`
- `source/games/tests/views/characters/game_pc_full_test.py`
- `source/games/tests/views/characters/game_npc_detail_test.py` — add the assertion for
  both a normal (non-hidden) authorized GET and, in the existing `TestGameNpcDetailHidden`
  (or equivalent) class, for a hidden NPC accessed by its DM/owner.

## Files to Change

- `source/games/views/characters/game_npcs_all.py` — set `X-Skip-Cache` on the response
- `source/games/views/characters/game_npc_full.py` — set `X-Skip-Cache` on the response
- `source/games/views/characters/game_pc_full.py` — set `X-Skip-Cache` on the response
- `source/games/views/characters/game_npc_detail.py` — set `X-Skip-Cache` on the response
- `source/games/tests/views/characters/game_npcs_all_test.py` — add header assertion
- `source/games/tests/views/characters/game_npc_full_test.py` — add header assertion
- `source/games/tests/views/characters/game_pc_full_test.py` — add header assertion
- `source/games/tests/views/characters/game_npc_detail_test.py` — add header assertion(s)

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_views`)
- `source/`: `docker-compose run --rm majora_tests ruff check --fix .` (CI job: `checks`)

## Notes

- Keep the fix minimal and targeted — do not add `X-Skip-Cache` to `game_pc_detail.py` or
  to the shared `detail_or_update`/`_serialize_detail` helpers (see plan.md's Notes for
  rationale).
