# Issue: Copy content between games (staff/admin)

## Description

Add a new entry to the header's **Admin** menu, visible to staff and superusers only, leading to a
page for copying game-scoped content from one game to another (`#/staff/copies`). Like the staff
photos page, it has one tab per content type, with a source-game and a target-game selector shared
by every tab.

Each selected entity is copied by its own request (one DB transaction) together with its
associated entities (photos, document pages and files, …). Uploads are shared with the copy
through filesystem **hard links** created by the proxy (PHP `link()`, never `symlink()`, never a
byte copy), so deleting or replacing one copy never affects the other.

Only game-scoped content is in scope. Anything attached to a character (`CharacterItem`,
`CharacterTreasure`, `CharacterDocument`, `CharacterPhoto`, …) is out of scope, as are
`GameTreasure`/`Treasure`, `GamePhoto`, `GameLink`, `Task`, `Poll`, `GameSession`,
`GameSessionMessage` and `Player`.

| Tab | Model | Associated entities copied with it |
|---|---|---|
| Items | `GameItem` | `GameItemPhoto` (+ cover `photo` FK) |
| Common items | `GameCommonItem` | `GameCommonItemPhoto` (+ cover `photo` FK) |
| Recipes | `GameRecipe` | its `GameCommonItem` (reused if already copied to the target, else copied with photos) |
| Documents | `GameDocument` | `GameDocumentPage`, `GameDocumentFile` (+ `GameDocumentFilePhoto`), `GameDocumentPhoto` (+ cover `photo` FK); no page history |
| Factions | `GameFaction` | `GameFactionPhoto` (+ cover `photo` FK) |
| Possessions | `GamePossession` | `GamePossessionPhoto` (+ cover `photo` FK) |

## Design (source of truth: the specs)

The detailed design lives in the written specs, not in this issue. Implementation issues follow
them; if the specs and this issue ever disagree, the specs win.

- Index: `docs/agents/specs/game-content-copy.md` (registered in the `docs/agents/specs.md` hub).
- Global pages under `docs/agents/specs/game-content-copy/`:
  - `page.md` — Admin menu entry, route and URL state, cross-domain game selectors, tabs, source
    list, per-entity and per-file progress, pending/failed links list and retry.
  - `copy-flow.md` — DB copy phase, `copied_from` (`SET_NULL`), same-game references, names
    (faction `(game, name)` clash → `422`), `hidden`, cover photo, `staff/copies*` API, edge cases.
  - `hard-links.md` — `Upload` copy origin (`source_path`, `is_cover`, `error`, `failed` status,
    `CopyLinkFinalizer`, renew, cleanup), proxy link handler
    `POST /uploads/link/<image|file>/<id>/submit`, narrowed `UploadHandler` route, failures and
    same-inode retry, backward compatibility.
  - `permissions.md` — staff/superuser gate, cross-domain Staff exception, `X-Skip-Cache`,
    cross-domain cache clearing, security notes.
- Tab pages: `items.md`, `common-items.md`, `recipes.md`, `documents.md`, `factions.md`,
  `possessions.md` — copied fields, per-type rules, API, cache (including clearing every target
  character's `available.json` lists, #1565), frontend and tests.
- Access rules: `docs/agents/access-control/staff-copy.md`.

## Progress

### Phase 1 — Specs (done)

| # | Sub-issue | Status |
|---|---|---|
| #1551 | Game content copy: global spec | done |
| #1552 | Game content copy spec: Items tab | done |
| #1553 | Game content copy spec: Common items tab | done |
| #1554 | Game content copy spec: Recipes tab | done |
| #1555 | Game content copy spec: Documents tab | done |
| #1556 | Game content copy spec: Factions tab | done |
| #1557 | Game content copy spec: Possessions tab | done |
| #1565 | Game content copy spec: clear characters' available lists on copy | done |

### Phase 2 — Implementation (to be split)

Proposed breakdown, to be created with `/arcanum-split-issue` as sub-issues of this epic. Each
issue implements the matching spec pages, including tests, access-control/cache review and
translations.

| # | Proposed sub-issue | Implements | Agents | Depends on |
|---|---|---|---|---|
| A | Backend foundation: `copied_from` FKs on the six models, `staff/copies.json`, `staff/copies/games.json`, staff gate | `copy-flow.md`, `permissions.md` | backend | — |
| B | Backend: `Upload` copy origin (fields, `failed` status, `CopyLinkFinalizer`, cleanup hook, pending-links list, renew) | `hard-links.md` | backend | A |
| C | Proxy: link handler, narrowed `UploadHandler` matcher, cross-domain cache-clear mode | `hard-links.md`, `permissions.md` | proxy | B (contract) |
| D | Frontend: Admin menu entry, `#/staff/copies` page, selectors, tabs, progress engine, pending/failed links list | `page.md` | frontend, translator | A, B |
| E | Items tab (backend copy/list endpoints + frontend tab) — reference implementation for the per-tab pattern | `items.md` | backend, frontend | A–D |
| F | Common items tab | `common-items.md` | backend, frontend | E |
| G | Recipes tab | `recipes.md` | backend, frontend | F |
| H | Possessions tab | `possessions.md` | backend, frontend | E |
| I | Factions tab | `factions.md` | backend, frontend | E |
| J | Documents tab | `documents.md` | backend, frontend | E |

- **Sequencing**: A → B → C/D in parallel → E → F–J (G after F; F, H, I, J in parallel).
- **Reviews**: every issue adding endpoints runs the `data-access` and `security` reviewers; the
  `cache` agent confirms whether any new endpoint needs a Navi resource (all `staff/copies*`
  endpoints send `X-Skip-Cache`, so none is expected).

### Phase 3 — Cleanup

| # | Sub-issue | Depends on |
|---|---|---|
| #1558 | Remove the game content copy specs (spec files + `specs.md` hub entry; `AGENTS.md` untouched), once their knowledge has moved into the permanent docs | all Phase 2 issues |
