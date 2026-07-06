# Hidden-NPC endpoints missing X-Skip-Cache on cache-sensitive responses

## Context

A security review of issue #297 (add character treasures) flagged that `game_npc_treasures.py`'s hidden-NPC gate (`if character.hidden and not character.can_be_edited_by(request.user): raise Http404`) returns per-requesting-user content without setting the `X-Skip-Cache` response header, even though Tent's proxy cache (`CacheStalenessMiddleware`, 10s TTL, see `proxy/prod_configuration/rules/backend.php`) caches all `*.json` responses by URL only, regardless of the requesting user's identity/auth.

This is not a regression introduced by #297: the exact same gap already exists in the two pre-existing sibling endpoints that `game_npc_treasures.py` was written to mirror:
- `source/games/views/characters/game_npc_detail.py`
- `source/games/views/characters/game_npc_photos.py`

None of the three set `X-Skip-Cache: true`, so within the 10-second cache TTL:
- A DM/superuser's successful 200 response for a hidden NPC (including, for `game_npc_detail`, the character's `public_description`/photos/etc.) could be cached and served to a subsequent anonymous or non-editor request for the same URL.
- Conversely, a cached 404 (produced for a non-editor) could incorrectly be served back to the character's own DM shortly after.

## What needs to be done

- Backend: apply the existing `X-Skip-Cache: true` response-header pattern (see `source/games/views/common.py`'s `access_response`, and `source/games/views/auth/status.py` / `staff_user_detail.py` for precedent) to all three hidden-NPC-gated endpoints — `game_npc_detail.py`, `game_npc_photos.py`, and `game_npc_treasures.py` — at least whenever `character.hidden` is `True` (both the 404 branch and the successful editor-only branch). This likely requires refactoring the shared `if character.hidden and not character.can_be_edited_by(...): raise Http404` snippet into a helper that returns a `Response` object (so the header can be attached) instead of raising `Http404`, since DRF's default exception handling for a raised `Http404` does not carry the header.
- Consider extracting a small shared helper (e.g. in `games/views/characters/_shared.py`, alongside the existing `_find_character` helper) so all three endpoints, and any future character sub-resource endpoint, apply the same hidden-NPC cache-bypass behavior consistently, rather than duplicating the logic three times.
- Add/adjust tests asserting `X-Skip-Cache: true` is present on responses affected by the hidden-NPC gate, mirroring the existing tests for `game_npc_access_test.py` / `game_pc_access_test.py`.

## Acceptance criteria

- [ ] `game_npc_detail.py`, `game_npc_photos.py`, and `game_npc_treasures.py` each set `X-Skip-Cache: true` on any response whose content depends on `character.hidden`/`can_be_edited_by` (i.e. both the 404-for-non-editor branch and the 200-for-editor branch when the character is hidden).
- [ ] Non-hidden NPC responses (identical for all callers) remain cacheable as before, no unnecessary loss of caching for the common case.
- [ ] Tests cover the header presence for all three endpoints' hidden-gate branches.

Tags: :shipit:
