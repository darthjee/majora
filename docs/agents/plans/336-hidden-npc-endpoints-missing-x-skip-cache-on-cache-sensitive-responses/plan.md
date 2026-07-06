# Plan: Hidden-NPC endpoints missing X-Skip-Cache on cache-sensitive responses

Issue: [336-hidden-npc-endpoints-missing-x-skip-cache-on-cache-sensitive-responses.md](../issues/336-hidden-npc-endpoints-missing-x-skip-cache-on-cache-sensitive-responses.md)

## Overview

Three NPC endpoints (`game_npc_detail`, `game_npc_photos`, `game_npc_treasures`) gate hidden NPCs with `if character.hidden and not character.can_be_edited_by(request.user): raise Http404`. Because this raises `Http404` (handled by DRF's default exception handler), the resulting 404 response never gets `X-Skip-Cache: true` attached, even though its content depends on the requesting user's identity. `game_npc_detail` and `game_npc_treasures` already set the header on their *successful* (editor) branch, but not on the 404 branch; `game_npc_photos` sets it on neither. Tent's proxy cache (`CacheStalenessMiddleware`, 10s TTL) keys purely by URL, so within that window a DM's 200 response could leak to an anonymous follow-up request, or a cached 404 could incorrectly be served back to the owning DM.

The fix replaces the raise with a shared helper that returns a `Response` (so the header can be attached) and ensures all three endpoints set `X-Skip-Cache: true` whenever `character.hidden` is `True`, on both branches.

## Context

- `source/games/views/characters/_shared.py` already holds `_find_character`, a small helper shared across character view modules — the natural home for a new shared helper.
- `source/games/views/common.py`'s `access_response` shows the established pattern: build a `Response`, set `response['X-Skip-Cache'] = 'true'`, return it — used by `game_npc_access.py`.
- `source/games/views/auth/status.py` and `source/games/views/staff/staff_user_detail.py` show the same "build a `Response`, not raise, then attach the header" pattern for conditional/error branches.
- `game_npc_detail.py` and `game_npc_treasures.py` already set `X-Skip-Cache: true` on their success path (after the hidden-gate check) — that part must be preserved, not duplicated.
- No existing test asserts on the *body* of these 404s, only `response.status_code == 404`, so a hand-built `Response(status=404)` is a safe, contract-preserving replacement for the raised `Http404`.

## Implementation Steps

### Step 1 — Add a shared hidden-NPC gate helper

In `source/games/views/characters/_shared.py`, add a helper, e.g.:

```python
from rest_framework.response import Response


def _hidden_gate_response(character, request):
    """Return a 404 Response with X-Skip-Cache set if `character` is hidden and the
    requesting user may not edit it, else None."""
    if character.hidden and not character.can_be_edited_by(request.user):
        response = Response(status=404)
        response['X-Skip-Cache'] = 'true'
        return response
    return None
```

Keep the existing `_find_character` helper as-is; this is a new, separate helper in the same module.

### Step 2 — Update `game_npc_detail.py`

Replace:
```python
if character.hidden and not character.can_be_edited_by(request.user):
    raise Http404
```
with:
```python
error_response = _hidden_gate_response(character, request)
if error_response:
    return error_response
```
Import `_hidden_gate_response` from `._shared`; drop the now-unused `django.http.Http404` import. Keep the existing `response['X-Skip-Cache'] = 'true'` line on the success path unchanged — when `character.hidden` is `True` this means the header is set on both the 404 and the 200 branches; when `character.hidden` is `False` the cheap early-return is skipped and the existing behavior for non-hidden NPCs is untouched (still always sets `X-Skip-Cache`, matching current behavior — this endpoint already skips caching unconditionally today, so no regression in cacheability here).

### Step 3 — Update `game_npc_photos.py`

Same replacement as Step 2. Additionally, since this endpoint currently sets no `X-Skip-Cache` header at all, only set it when the character is actually hidden, to preserve caching for the common (non-hidden) case per the issue's acceptance criteria:
```python
error_response = _hidden_gate_response(character, request)
if error_response:
    return error_response

photos = character.photos.filter(ready=True)
response = paginated_list_response(request, photos, CharacterPhotoSerializer)
if character.hidden:
    response['X-Skip-Cache'] = 'true'
return response
```
Drop the now-unused `django.http.Http404` import.

### Step 4 — Update `game_npc_treasures.py`

Same pattern as Step 3 — replace the raise, and only force `X-Skip-Cache` on the success path when `character.hidden` is `True` (currently it's set unconditionally regardless of hidden status; narrow it to match the "no unnecessary loss of caching for the common case" acceptance criterion):
```python
error_response = _hidden_gate_response(character, request)
if error_response:
    return error_response

treasures = character.character_treasures.select_related('treasure').filter(quantity__gt=0)
response = paginated_list_response(request, treasures, CharacterTreasureSerializer)
if character.hidden:
    response['X-Skip-Cache'] = 'true'
return response
```
Drop the now-unused `django.http.Http404` import.

### Step 5 — Add/adjust tests

For each of the three test files below, add a test to the existing `*Hidden` test class asserting `X-Skip-Cache: true` is present on the 404 branch (anonymous and/or non-editor), mirroring the existing `test_hidden_npc_response_includes_x_skip_cache_header_for_dm`-style tests already present for the success branch:

- `source/games/tests/views/characters/game_npc_detail_test.py` (`TestGameNpcDetailHidden`) — add a test for the anonymous/non-editor 404 case (the DM success case is already covered by `test_hidden_npc_response_includes_x_skip_cache_header_for_dm`).
- `source/games/tests/views/characters/game_npc_photos_test.py` (`TestGameNpcPhotosHidden`) — add tests for both the 404 branch and the DM/superuser success branch (neither currently exists), plus a test confirming a *visible* NPC's photos response does **not** carry `X-Skip-Cache` (to lock in the "no unnecessary loss of caching" criterion).
- `source/games/tests/views/characters/game_npc_treasures_test.py` (`TestGameNpcTreasuresHidden`) — add a test for the 404 branch (the DM success case is already covered by `test_hidden_npc_treasures_response_includes_x_skip_cache_header_for_dm`), plus a test confirming a *visible* NPC's treasures response does **not** carry `X-Skip-Cache`.

Use the existing `response['X-Skip-Cache'] == 'true'` assertion style already used in these files; for the "absence" tests, assert `'X-Skip-Cache' not in response` (Django's `HttpResponse` supports `in` for header-name membership checks).

## Files to Change

- `source/games/views/characters/_shared.py` — add `_hidden_gate_response(character, request)` helper.
- `source/games/views/characters/game_npc_detail.py` — use the new helper instead of raising `Http404`.
- `source/games/views/characters/game_npc_photos.py` — use the new helper; set `X-Skip-Cache` only when hidden.
- `source/games/views/characters/game_npc_treasures.py` — use the new helper; narrow `X-Skip-Cache` to only when hidden.
- `source/games/tests/views/characters/game_npc_detail_test.py` — add 404-branch `X-Skip-Cache` test.
- `source/games/tests/views/characters/game_npc_photos_test.py` — add 404-branch and success-branch `X-Skip-Cache` tests, plus a visible-NPC "no header" test.
- `source/games/tests/views/characters/game_npc_treasures_test.py` — add 404-branch `X-Skip-Cache` test, plus a visible-NPC "no header" test.

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest games/tests/views/` (CI job: `pytest_views`)

## Notes

- `game_npc_detail.py`'s success path currently sets `X-Skip-Cache: true` unconditionally (even for non-hidden NPCs), which already forfeits caching for the common case on this endpoint. The issue's acceptance criteria only requires *not introducing new* loss of caching for the common case, so this plan leaves that pre-existing behavior on `game_npc_detail` untouched to keep the change minimal and focused; only `game_npc_photos` and `game_npc_treasures` (which currently have no such regression) are narrowed to hidden-only. If reviewers want full consistency, `game_npc_detail` could be narrowed to `if character.hidden: response['X-Skip-Cache'] = 'true'` too as a follow-up — flagging this trade-off rather than silently changing more than the issue asks for.
- `game_npc_access.py` already fully handles this pattern correctly via `access_response` and needs no change; it's referenced here only as precedent.
