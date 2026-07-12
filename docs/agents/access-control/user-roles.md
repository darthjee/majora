# User Roles

| Role | Description |
|------|-------------|
| **Anonymous** | Unauthenticated request (no `Authorization` header or session token) |
| **Authenticated user** | Valid token or session, but no special game-level role |
| **GameMaster** | Authenticated user with a `GameMaster` row linking them to a specific game |
| **Player** | Authenticated user whose `Player` record has `user` set and is linked to a character |
| **Superuser** | Django `is_superuser=True` — full access, no restrictions |
| **Staff** | Django `is_staff=True` — global (not game-scoped); grants access to the User-management endpoints below only, nothing else |

A user may simultaneously be a GameMaster for one game and a Player for another. The
"GameMaster" and "Player" roles are always scoped to a specific game. "Staff" and
"Superuser" are global roles, not scoped to any game.
