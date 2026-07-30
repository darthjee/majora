# Player

A **Player** is a human participant in a game. Each Player record has a display name and
may be linked to a Django `User` account (`player.user`). A `Player` without a linked
`User` is a named participant with no login identity.

A Player belongs to exactly one game (`Player.game` FK). Within a game, a Player owns
zero or one characters — enforced at the database level by a plain `UniqueConstraint` on
`Character.player` (`unique_player_character`, issue #589), narrowed from the previous
"zero or more" since nothing else in the model ever assumed a Player could own more than
one PC. No `condition=` clause is used (unlike a typical "partial unique" pattern) since
MySQL, this project's database, doesn't support Django's conditional unique constraints —
a plain constraint already suffices here, since MySQL's standard unique-index semantics
already treat every `NULL` as distinct, so any number of NPCs/unowned PCs sharing
`player=None` remain unaffected. A Player's `is_dm` flag marks them as that game's
DM/GameMaster — see [GameMaster Role](#gamemaster-role) below.

A game's full roster (its DM(s) and players, alongside each player's owned PC and linked
`User`, if any) is exposed via `GET /games/:game_slug/players.json` — see
[access-control/player.md](access-control/player.md) (issue #589). A single player of that
roster is likewise exposed via `GET /games/:game_slug/players/:id.json` (issue #695, same
serializer shape).

