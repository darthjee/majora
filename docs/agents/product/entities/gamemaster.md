# GameMaster (DM / Dungeon Master)

A **GameMaster** (DM) is a `Player` of a game with `is_dm=True`, granting that user full
editorial authority over all characters in that game. `Player.is_dm` is the single source
of truth for DM status — there is no separate GameMaster model or table. A user may be a
GameMaster in multiple games simultaneously (one `Player` row per game), and a game may
have multiple GameMasters.

