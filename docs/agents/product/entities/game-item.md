# GameItem / CharacterItem

A **GameItem** is a special magic item belonging to exactly one game (`name`, `description`,
optional photo, `hidden`) — simpler than `Treasure`: there is no shared cross-game registry, so
`GameItem` itself is the top of the item hierarchy rather than a per-game link to a separately
owned catalog row. A **CharacterItem** links a `GameItem` to a PC or NPC, with its own optional
`name`/`description`/`photo` overrides that fall back to the linked `GameItem`'s values when
`null`, and its own independent `hidden` flag. `GameItem` gained a photo upload endpoint (issue
#749); `CharacterItem` gained both a create endpoint (issue #714) and a photo upload endpoint
(issue #750) — there is still no update/delete endpoint for either — see
[access-control/game-item.md](access-control/game-item.md) and
[access-control/character-item.md](access-control/character-item.md) for the full endpoint and
permission breakdown.
