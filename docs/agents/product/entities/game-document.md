# GameDocument / CharacterDocument

A **GameDocument** is a special document belonging to exactly one game (`name`, `description`,
optional photo, `hidden`) — field-for-field a mirror of `GameItem`. A **CharacterDocument**
links a `GameDocument` to a PC or NPC, with its own optional `name`/`description`/`photo`
overrides that fall back to the linked `GameDocument`'s values when `null`, and its own
independent `hidden` flag — field-for-field a mirror of `CharacterItem`. `GameDocument` gained a
create endpoint (issue #758) and multi-photo storage/upload/display (issue #727, following the
PC/NPC `CharacterPhoto` multi-photo model rather than `GameItem`'s single-always-replace one) —
there is still no update/delete endpoint for `GameDocument`, and `CharacterDocument` remains
entirely read-only (no create, update, or photo upload flow) — see
[access-control/game-document.md](access-control/game-document.md) and
[access-control/character-document.md](access-control/character-document.md) for the full
endpoint and permission breakdown.

