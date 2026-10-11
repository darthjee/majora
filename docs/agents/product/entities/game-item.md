# GameItem / CharacterItem

A **GameItem** is a special magic item belonging to exactly one game (`name`, `description`,
optional photo, `hidden`) — simpler than `Treasure`: there is no shared cross-game registry, so
`GameItem` itself is the top of the item hierarchy rather than a per-game link to a separately
owned catalog row. A **CharacterItem** links a `GameItem` to a PC or NPC, with its own optional
`name`/`description`/`photo` overrides that fall back to the linked `GameItem`'s values when
`null`, and its own independent `hidden` flag. `GameItem` gained a photo upload endpoint (issue #749);
`CharacterItem` gained both a create endpoint (issue #714) and a photo upload endpoint
(issue #750) — there is still no update/delete endpoint for either — see
[access-control/game-item.md](access-control/game-item.md) and
[access-control/character-item.md](access-control/character-item.md) for the full endpoint and
permission breakdown.

`GameItem` has a nullable, self-referencing `copied_from` FK (issue #1568): a provenance link to
the entity it was copied from when Staff copied it from another game (see
[Staff Copy](../../access-control/staff-copy.md)). It is the one allowed cross-game reference.
When the source is deleted, directly or through its game's deletion, it is set to null
(`on_delete=SET_NULL`) and the copy survives. A copy of a copy points to its immediate source,
not to the original. It is staff-only provenance and is never exposed by regular or restricted
game serializers. It is not a character link and carries no edit rights.
