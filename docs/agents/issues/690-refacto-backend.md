# Issue: Refactor backend: 10 code-quality improvements

## Description
Identify 10 concrete, high-value opportunities to refactor the Django backend (`backend/`) for code quality, without necessarily implementing them in this issue. Focus areas:

- **Code repetition** — logic duplicated across files/classes that could be extracted into a shared helper, mixin, manager method, or base class.
- **Methods that are too big** — methods that should be broken down into smaller methods, or that hint at a missing class to hold the extracted responsibility.
- **Loops with too many steps** — loop bodies doing too much, which could be extracted into a helper class/method to reduce responsibilities.

## Problem
An exploratory pass over the entire `backend/` tree (models, views, serializers, permissions, middleware) found that a prior refactor (#688) already addressed most oversized-method and complex-loop cases — loop bodies across the codebase are now mostly single-line. The remaining quality debt is concentrated in **code repetition**, especially around the parallel PC/NPC structure. 10 concrete candidates were identified:

1. **PC/NPC parallel view trees** — `backend/games/views/game/pcs/` mirrors `backend/games/views/game/npcs/` file-for-file (~15 pairs, e.g. `pcs/detail/game_pc_access.py` vs `npcs/detail/game_npc_access.py`, money/items/photos/treasures subtrees) — every pair differs only by an `npc=True/False` flag and the view/serializer name.
2. **PC/NPC parallel `urls.py` trees** — `backend/games/urls/pcs.py` (79 lines) vs `backend/games/urls/npcs.py` (85 lines) duplicate the same path/name boilerplate wholesale, differing only by the URL prefix and view names.
3. **"Treasure scoped to a game" queryset duplicated 4x** — identical `Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()` in `backend/games/views/game/_treasure_exchange.py:80`, `backend/games/views/games/game_treasures_all.py:30`, `backend/games/views/games/game_treasure_detail.py:49`, `backend/games/views/games/game_treasures.py:36`.
4. **Upload-init flow duplicated 3x** — `backend/games/views/photo_upload.py`, `backend/games/views/treasures/treasure_photo_upload.py`, `backend/games/views/game/_photo_upload.py` each independently validate `PhotoUploadSerializer`, build a file path, create the `Upload`, attach the owning photo record, and return `{upload_id, token, <owner>_id}`.
5. **`HiddenFieldSerializer` double-validation dance duplicated 4x** — `backend/games/views/treasures/treasure_detail.py:47-58`, `backend/games/views/games/game_treasure_detail.py:74-90`, `backend/games/views/games/game_treasures.py:67-84`, `backend/games/views/games/game_treasure_link.py:32-40` each separately validate a main serializer plus `HiddenFieldSerializer` and merge the results.
6. **"Is user a player of this game" check duplicated** — `game.players.filter(user=user...).exists()` reimplemented independently at `backend/games/permissions.py:41,67,89,126,167,236` and again at `backend/games/serializers/base_access.py:70`.
7. **"`*AllSerializer` adds a `hidden` field" pattern repeated 4x** — `CharacterTreasureAllSerializer` (`backend/games/serializers/characters/character_treasure.py:31-46`), `CharacterItemAllSerializer` (`backend/games/serializers/characters/character_item.py:39-47`), `GameItemAllListSerializer` (`backend/games/serializers/games/items/game_item_list.py:19-28`), `TreasureAllListSerializer` (`backend/games/serializers/treasures/treasure_list.py:27-40`) all follow the identical "subclass + add `hidden` `SerializerMethodField` + extend `Meta.fields`" shape.
8. **`_filter_characters` not extracted like its treasure-filter sibling** — `backend/games/views/game/_shared.py:41-68` inlines four independent query-param filters (slain/name/allegiance/hidden) in one function, while the equivalent treasure filtering was already extracted into standalone helpers in `backend/games/views/games/_treasure_filters.py`.
9. **Three near-identical game-session list views** — `backend/games/views/game_sessions/game_sessions_future.py`, `game_sessions_past.py`, `game_sessions_unscheduled.py` differ only in a one-line date filter/order clause around identical `get_object_or_404` + `paginated_list_response` boilerplate.
10. **"Effective value" fallback duplicated** — `value = treasure.value if game_treasure is None else game_treasure.value` reimplemented inline twice in `backend/games/views/game/_treasure_exchange.py:118,165`, despite an existing shared `resolve_treasure_value()` helper in `backend/games/serializers/games/treasures/game_treasure_fields.py:19-21`.

## Solution
Implement all 10 candidates above in this issue, extracting the shared logic in each case (manager/queryset method, mixin, base class, route factory, or helper class/function) and updating call sites to use it, while preserving existing behavior and test coverage. Candidates #1 and #2 (the PC/NPC view and URL trees) are the largest and most systemic, so tackle them first — the pattern established there (an `npc`-parameterized factory) may also simplify how the remaining candidates are approached.

## Benefits
Less duplicated logic to keep in sync, smaller surface area for future bugs, and a more consistent, DRY backend codebase.
