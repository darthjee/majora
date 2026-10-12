# Serializer and cache paths

Add `StaffCopyFactionSerializer` (`backend/staff/serializers/staff_copy_faction.py`) with fields
`id, name, photo, copied_to_target, name_taken_in_target`; `photo` returns the cover path only
when the cover is `ready`; `copied_to_target` and `name_taken_in_target` are read-only booleans
read from queryset annotations. Export it from `backend/staff/serializers/__init__.py`.

In `backend/staff/copy_cache_paths.py` add `_FACTIONS = GameResourceCachePaths('factions')`,
`_AVAILABLE_FACTIONS = GameCharactersAvailableCachePaths('factions')` and
`factions_copy_cache_paths(faction)` returning the faction family
(`/games/<t>/factions.json`, `/games/<t>/factions/<id>.json`) plus one
`/games/<t>/{pcs|npcs}/<id>/factions/available.json` per target character (none when the game has
no characters).

## Files to Change
- `backend/staff/serializers/staff_copy_faction.py` — new serializer
- `backend/staff/serializers/__init__.py` — export
- `backend/staff/copy_cache_paths.py` — `factions_copy_cache_paths`
