# Game Content Copy

Design notes for letting staff and superusers copy game-scoped content from one game to another
(epic #1550). A staff-only **Admin** menu entry opens a page with a source-game and a target-game
selector above one tab per content type: Items (`GameItem`), Common items (`GameCommonItem`),
Recipes (`GameRecipe`), Documents (`GameDocument`), Factions (`GameFaction`) and Possessions
(`GamePossession`). Each selected entity is copied by its own request (one DB transaction), and
its photos/files are then shared with the copy through filesystem **hard links**, never byte
copies.

Out of scope (never copyable): anything attached to a character (`CharacterItem`,
`CharacterTreasure`, ...), `GameTreasure`/`Treasure`, `GamePhoto`, `GameLink`, `Task`, `Poll`,
`GameSession`, `Player`. A copy is created with no character links and no history of its
source.

This spec is removed once the feature is implemented (#1558) and its knowledge has moved into
the permanent docs (`access-control/`, `architecture/`, ...).

## Global pages

- [Page (Admin menu, selectors, tabs, progress)](game-content-copy/page.md)
- [Copy flow (DB copy phase, copy rules, backend copy API)](game-content-copy/copy-flow.md)
- [Hard links (`Upload` extension, proxy link handler, link API)](game-content-copy/hard-links.md)
- [Permissions (staff gate, cross-domain scope, cache, security notes)](game-content-copy/permissions.md)

Access rules for the planned endpoints: [Staff Copy](../access-control/staff-copy.md).

## Tab pages

Pending — each is written by its own issue and builds on the global pages above:

- Items — #1552
- Common items — #1553
- Recipes — #1554
- Documents — #1555
- Factions — #1556
- Possessions — #1557

## Backward compatibility and testing (summary)

- Every schema change is an **additive** migration (new nullable/defaulted fields, new choice
  values); regular and staff uploads behave exactly as today. See
  [hard-links.md](game-content-copy/hard-links.md#backward-compatibility).
- Testing strategy:
  - **backend** (pytest) — per content type: copy endpoint (transaction, associated rows,
    `copied_from`, 404/422), list `copied_to_target`, pending-links list, renew; `Upload` link flow
    (`uploading` returning `source_path`, `failed` + `error`, `CopyLinkFinalizer`, cover FK),
    copy-upload cleanup on delete, staff gate (401/403) and a `returns_skip_cache_header` test on
    every endpoint;
  - **proxy** (PHPUnit) — the link handler (staff guard, path validation of both ends, symlink
    rejection, `link()`, same-inode retry, each failure mapped to its `error` code), the narrowed
    `UploadHandler` matcher, and the cross-domain cache-clear mode;
  - **frontend** (Jasmine) — page controller staff gate, selectors and URL state, tabs, source
    list, per-entity and per-file progress, re-copy confirmation, pending-links list and retry.
