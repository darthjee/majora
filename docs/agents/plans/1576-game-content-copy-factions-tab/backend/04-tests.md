# Tests

Cover the spec's backend "Testing" cases:

- New `backend/staff/tests/staff_copies_factions_test.py` (modelled on
  `staff_copies_possessions_test.py`, using `GameFactionFactory`): list row fields (`photo` only
  when ready), `name_taken_in_target` true/false, `copied_to_target`; copy sets `name`,
  `copied_from`, target `game`, `photo` null; one `is_cover=true` link at the fixed
  `photo<ext>` path with source extension; no link for no photo / not-ready cover; non-cover
  `GameFactionPhoto` ignored; `CharacterFaction` rows not copied; `422`
  `{"errors": {"name": ["unique"]}}` on a name clash and on a re-copy, with no faction, photo or
  `Upload` created and no `X-Cache-Clear`; `X-Cache-Clear` contains the faction family plus one
  `factions/available.json` per target PC/NPC, and only the family when the target has no
  characters.
- `backend/staff/tests/copy_types_test.py` — registration order and unit tests for the type.
- `backend/staff/tests/staff_copies_index_test.py` — include factions in the asserted order.
- `backend/staff/tests/copy_links_test.py` — faction cover hook and pending-links reach via `faction__game`.
- `backend/uploads/tests/views_finalize_copy_test.py` — cover finalize sets the copy's `photo` and clears the faction caches.

## Files to Change
- `backend/staff/tests/staff_copies_factions_test.py` — new
- `backend/staff/tests/copy_types_test.py`
- `backend/staff/tests/staff_copies_index_test.py`
- `backend/staff/tests/copy_links_test.py`
- `backend/uploads/tests/views_finalize_copy_test.py`
