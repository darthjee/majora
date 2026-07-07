# Remove duplications in source/games (but not on tests)

## Context

`source/games` contains duplicated production code that should be reduced by extracting shared classes/utilities. The clearest known instance is a set of near-duplicate view functions for handling Player Characters (PCs) and Non-Player Characters (NPCs), but the sweep should not be limited to that one case — any other duplication found elsewhere in `source/games` (outside tests) is in scope too. Test duplication is intentionally out of scope for this task — it will be addressed in a separate, future task.

`source/games/views/characters/` has 11 pc/npc file pairs (e.g. `game_npc_full.py`/`game_pc_full.py`, `game_npc_access.py`/`game_pc_access.py`, `game_npc_photo_upload.py`/`game_pc_photo_upload.py`, treasure acquire/sell/list, photo set, etc.). Several of these pairs are near byte-for-byte identical, differing only in the `npc=True/False` flag passed down, the serializer class name (e.g. `CharacterAccessSerializer` vs `PcAccessSerializer`), and docstring/URL wording ("NPC" vs "PC").

Some business logic has already been extracted into shared helpers consumed by both variants (`_shared.py`, `_photo_upload.py`, `_photo_set.py`, `_slain_set.py`, `_treasure_exchange.py`), so the remaining duplication here is mostly in the thin view-function wrappers (decorators + serializer selection + docstrings), estimated at roughly 150-250 lines across the 11 pairs.

Not all pairs are symmetric: `game_npcs.py` supports GET+POST (NPC creation) while `game_pcs.py` is GET-only, and `game_npc_slain_set.py` has no PC counterpart at all. Any solution needs to accommodate these asymmetries rather than assuming a 1:1 mirror.

This pc/npc pattern is the clearest confirmed example, but it should be treated as representative rather than exhaustive — other parts of `source/games` (views, serializers, models, etc.) may have similar duplication worth extracting too.

Note: `source/games/tests/views/characters/` mirrors this same pc/npc duplication pattern, at a much larger scale (300+ lines per pair, with no shared test helpers at all). That test duplication is explicitly **not** in scope for this issue — it is intentionally left for a separate, future task.

## What needs to be done

Do a broader sweep of `source/games` (production code only, not tests) to identify duplicated logic, not just the known pc/npc view pairs.

For the pc/npc view pairs specifically: introduce a shared base (e.g. a common class-based view or parameterized wrapper) that both pc and npc variants extend/use, so the repeated decorators/serializer-selection/docstring boilerplate lives in one place. Where a pair is asymmetric (NPC creation, NPC slain-set), extract single-responsibility utility functions/classes as needed rather than forcing a symmetric shared base to cover behavior only one side has.

Apply the same approach (shared base + single-responsibility extraction) to any other duplication found elsewhere in `source/games`.

## Acceptance criteria

- [ ] Duplicated pc/npc view-function boilerplate in `source/games/views/characters/` is extracted into a shared base or parameterized wrapper, accommodating asymmetric pairs (NPC creation, NPC slain-set) without forcing a false symmetry.
- [ ] Any other duplication found in `source/games` production code (outside tests) is similarly extracted.
- [ ] Test files under `source/games/tests/` are left untouched by this issue (no test duplication removal).
- [ ] Existing tests continue to pass, confirming behavior is unchanged.

Tags: :shipit:
