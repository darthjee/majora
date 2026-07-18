# Player

Players have no dedicated public endpoint. They are read indirectly through character data.
The `Player` model (`name`, `game` FK, `is_dm`) is not exposed in any list or detail endpoint
as a standalone resource; no write endpoint exists.

## GameMaster (DM) role

`Player.is_dm` is the single source of truth for whether a player is that game's DM/
GameMaster — there is no separate `GameMaster` model or table. A user may hold `is_dm=True`
on at most one `Player` row per game (one row per game, per the model's constraints), and
may be a DM on multiple games simultaneously via separate `Player` rows. See
[Common Rules](common-rules.md) for how `is_dm` feeds into `Game.can_be_edited_by` /
`Character.can_be_edited_by` and the `access.json` `is_dm` field.
