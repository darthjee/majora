# Move photos domain

Move the 5 photos-related flat files from `backend/games/views/game/` into a
new `backend/games/views/game/photos/` package (with an `__init__.py`),
keeping filenames unchanged, then fix up every import that breaks as a result.

No file outside `_character_shared.py` imports these flat files directly (no
consumer files in `pcs/detail/photos/` or `npcs/detail/photos/` import them),
so this is the simplest domain to move. Sibling imports within `photos/` stay
single-dot; imports reaching outside the package (`_decorators`, `_shared`,
`..common`, `...models`, `...serializers`) need one extra `.`.

## Files to Change
- `backend/games/views/game/_photo_deletable.py` → `backend/games/views/game/photos/_photo_deletable.py` (move; update outward imports)
- `backend/games/views/game/_photo_detail.py` → `backend/games/views/game/photos/_photo_detail.py` (move; update outward imports)
- `backend/games/views/game/_photo_set.py` → `backend/games/views/game/photos/_photo_set.py` (move; update outward imports)
- `backend/games/views/game/_photo_upload.py` → `backend/games/views/game/photos/_photo_upload.py` (move; update outward imports)
- `backend/games/views/game/_photos.py` → `backend/games/views/game/photos/_photos.py` (move; update outward imports)
- `backend/games/views/game/photos/__init__.py` (new, empty — makes the folder a package)
- `backend/games/views/game/_character_shared.py` — update its imports of `_photo_deletable`, `_photo_detail`, `_photo_set`, `_photo_upload`, `_photos` to `photos._photo_deletable`, `photos._photo_detail`, `photos._photo_set`, `photos._photo_upload`, `photos._photos`
