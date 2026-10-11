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

`GameDocument` has a nullable, self-referencing `copied_from` FK (issue #1568): a provenance link to
the entity it was copied from when Staff copied it from another game (see
[Staff Copy](../../access-control/staff-copy.md)). It is the one allowed cross-game reference.
When the source is deleted, directly or through its game's deletion, it is set to null
(`on_delete=SET_NULL`) and the copy survives. A copy of a copy points to its immediate source,
not to the original. It is staff-only provenance and is never exposed by regular or restricted
game serializers. It is not a character link and carries no edit rights.
