# Repoint and de-stale access-control and product docs

- `docs/agents/access-control/staff-copy.md`:
  - Line 4: replace the "spec ... The implementation issues turn it ..." intro with a link
    to `../game-content-copy.md`. The endpoints are implemented, not planned.
  - Line 56: `../specs/game-content-copy/factions.md#names` becomes
    `../game-content-copy/factions.md#names`.
  - `## Cache` (~line 94): link `../game-content-copy.md#cache`. Drop the "until that proxy
    mode exists, target-game pages on other domains may serve stale lists" caveat, since
    #1570 and #1580 implemented it.
  - Remove any other "planned" wording in the file.
- `docs/agents/access-control.md` line 45: drop "**planned**:" from the Staff Copy entry.
- `docs/agents/product/entities/ownership-and-roles.md`: the Staff exception text is already
  as-implemented. Optionally add a link to `../../game-content-copy.md`. Do not change the
  rules.
- Run `grep -rn "game-content-copy" docs` and fix any other referrer outside `issues/` and
  `plans/`.

## Files to Change

- `docs/agents/access-control/staff-copy.md`: repoint three links, drop planned and stale
  wording.
- `docs/agents/access-control.md`: drop "planned".
- `docs/agents/product/entities/ownership-and-roles.md`: optional link.
