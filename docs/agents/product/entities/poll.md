# Poll

A **Poll** is a game-scoped question (`title`, `description`, a `type` of single- or
multiple-choice) with a fixed set of `PollOption`s, belonging to exactly one game via a direct
`game` foreign key — the same "belongs to exactly one game" shape as `Character` and a
game-exclusive `Treasure`. Unlike `Treasure`, a poll has no GM-only administration model: it is
game-scoped collaborative content, closer to a `GameSession`/session message, so its full
audience — the game's GameMaster(s), players, and admins (superuser/staff) — may both view
**and** create polls, with no stricter create-only rule. A poll has no individual "owner"; access
is entirely game-scoped, not per-record. Voting (`PollVote`, linking a `Player` to the option
they chose) exists at the model level but has no endpoint yet — out of scope until a follow-up
issue. See [access-control/poll.md](access-control/poll.md) for the full endpoint and permission
breakdown.
