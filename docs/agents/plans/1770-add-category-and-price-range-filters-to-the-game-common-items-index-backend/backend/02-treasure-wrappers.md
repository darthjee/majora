# Treasure helpers as wrappers

Rewrite `filter_by_min_value` / `filter_by_max_value` in
`backend/games/views/games/_treasure_filters.py` as thin wrappers:
`filter_by_min(request, queryset, 'min_value', field)` /
`filter_by_max(request, queryset, 'max_value', field)`, keeping their signatures and the
`field='game_value'` default. Remove `_filter_by_value`. Keep `filter_by_name` unchanged. Point
the module docstring at `common/query_filters.py` as the canonical home of the shared helpers.

None of the 8 callers (`game_treasures.py`, `game_treasures_all.py`,
`game/treasures/_treasures.py`, `treasures/treasures_list.py` and the views using them) change.
Run the existing treasure view tests unmodified to prove the refactor is transparent.

## Files to Change

- `backend/games/views/games/_treasure_filters.py` — wrappers over the shared helpers
