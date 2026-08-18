# Treasure

A **Treasure** is a named, valued item (`name`, `value`, optional photo) that is either
**global** or **exclusive to one game** (issue #296). Exclusive ownership is a direct,
nullable `game` foreign key on `Treasure` — parallel to how a `Character` belongs to
exactly one game — and is distinct from the pre-existing, non-exclusive `Game.treasures`
many-to-many relationship, which merely lists a treasure under any number of games without
implying ownership. A treasure can simultaneously be M2M-linked to several games *and*
exclusively owned (via the `game` FK) by at most one of them, or none. Only that owning
game's GameMaster (or a superuser) may create or edit a game-exclusive treasure through the
game-scoped endpoints; the pre-existing global treasure endpoints remain superuser-only
regardless of a treasure's `game`. See [access-control/treasure.md](access-control/treasure.md) for the full
endpoint and permission breakdown.
