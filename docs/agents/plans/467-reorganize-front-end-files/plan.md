# Plan: Reorganize front-end files

Issue: [467-reorganize-front-end-files.md](../../issues/467-reorganize-front-end-files.md)

## Overview

Restructure `frontend/assets/js/components/` from the current type-first layout
(`elements/`, `pages/`, each with their own `controllers/`/`helpers/`) into a resource-first
layout under `components/resources/<resource>/`, colocating each resource's pages with the
elements/controllers/helpers used only by that resource. Truly cross-resource pieces stay in
`components/common/`; non-JSX utility classes stay in `components/utils/`. The mirrored spec
tree under `frontend/specs/assets/js/components/` follows the same moves. Migration proceeds
one resource at a time so each step stays small and reviewable.

## Context

Currently:
- `components/pages/*.jsx` — one file per route, with `pages/controllers/*.js` and
  `pages/helpers/*.jsx` alongside.
- `components/elements/*.jsx` — reusable building blocks, with `elements/controllers/*.js`
  and `elements/helpers/*.jsx`.
- Routes are centrally registered in `utils/HashRouteResolver.js` (route pattern → page key)
  and wired to components in `components/helpers/AppHelper.jsx` (page key → `<Component />`,
  via imports from `../pages/*.jsx`). These two files are the map of which page belongs to
  which route/resource, and they are **not** moved — only the import paths inside them change.
- `docs/agents/frontend.md` documents the current type-first tree and must be updated to
  describe the new one once the migration is complete (or per-resource, if that reads better
  incrementally — see Step 6).

Target resources (confirmed during issue discussion), each becoming
`components/resources/<resource>/`:

| Resource | Pages (route key → file) |
|---|---|
| `game` | `games`, `game`, `gameNew`, `gameEdit`, `gamePhotos`, `gameTasks` → `Games.jsx`, `Game.jsx`, `GameNew.jsx`, `GameEdit.jsx`, `GamePhotos.jsx`, `GameTasks.jsx` |
| `game_session` | `gameSessions`, `gameSession`, `gameSessionNew`, `gameSessionEdit` → `GameSessions.jsx`, `GameSession.jsx`, `GameSessionNew.jsx`, `GameSessionEdit.jsx` |
| `character` | `gameNpcs`, `gamePcs`, `gameNpcNew`, `npcCharacter*`, `pcCharacter*` (incl. `Photos`/`Treasures`/`Edit` variants) → `GameNpcs.jsx`, `GamePcs.jsx`, `GameNpcNew.jsx`, `NpcCharacter*.jsx`, `PcCharacter*.jsx`, plus `pages/shared/Character*.jsx` (`CharacterDetail`, `CharacterEdit`, `CharacterPhotos`, `CharacterTreasures` — shared by NPC/PC, not by other resources) |
| `treasure` | `treasures`, `treasure`, `treasureNew`, `treasureEdit`, `gameTreasures`, `gameTreasureNew`, `gameTreasureEdit` → `Treasures.jsx`, `Treasure.jsx`, `TreasureNew.jsx`, `TreasureEdit.jsx`, `GameTreasures.jsx`, `GameTreasureNew.jsx`, `GameTreasureEdit.jsx` |
| `staff_user` | `staffUsers`, `staffUser`, `staffUserEdit` → `StaffUsers.jsx`, `StaffUser.jsx`, `StaffUserEdit.jsx` |
| `account` | `myAccount`, `register`, `recoverPassword` → `MyAccount.jsx`, `Register.jsx`, `RecoverPassword.jsx` |

Each page's `pages/controllers/<Page>Controller.js` and `pages/helpers/<Page>Helper.jsx`
follow the page into its resource folder (e.g. `resources/game/pages/GamesController.js` and
`GamesHelper.jsx` colocated under that page, per the nesting already illustrated in the issue:
`resources/<resource>/pages/elements/`, `.../elements/controllers/`, `.../elements/helpers/`).

`elements/` files are resource-specific only when used by a single resource's pages — verify
with a grep for each candidate's import before moving it (imports won't lie about usage, naming
can). Likely resource-specific by naming convention (verify, don't assume):
- `game`: `GameCard.jsx` (+ `helpers/GameCardHelper.jsx`)
- `character`: `CharacterCard.jsx`, `CharacterInfo.jsx`, `CharacterMoney.jsx`,
  `CharacterPreviewSection.jsx`, `CharacterTreasuresPreview.jsx`, `characterPreviewConstants.js`,
  `NpcFilters.jsx` (+ their `helpers/*Helper.jsx` and `controllers/NpcFiltersController.js`,
  `elements/helpers/CharacterStatusBadges.js`, `SlainSecondaryButtons.js`,
  `SlainConfirmModal.jsx`/`SlainConfirmModalHelper.jsx`/`SlainConfirmController.js`,
  `PlayerSlainConfirmController.js`)
- `treasure`: `TreasureCard.jsx`, `TreasureMoney.jsx`, `TreasureExchangeModal.jsx`,
  `CardTreasureImage.jsx` (+ their helpers/controllers)

Everything else in `elements/` (e.g. `Header.jsx`, `ActionBar.jsx`, `Pagination.jsx`,
`Table.jsx`, `Modal`-style dialogs used from more than one resource, `LoginModal.jsx`,
`LinksEditModal.jsx`, form primitives like `FormField.jsx`/`TextareaField.jsx`) stays under
`components/common/` since it's used across resources or from the app shell. `utils/` is
untouched.

## Implementation Steps

### Step 1 — Scaffold the target skeleton
Create `components/resources/` and, empty for now, one folder per resource listed above
(`game`, `game_session`, `character`, `treasure`, `staff_user`, `account`), each with a `pages/`
subfolder. Create `components/common/` (with `controllers/` and `helpers/` subfolders) if
choosing to move shared elements there in this pass rather than a later one.

### Step 2 — Migrate one resource at a time
For each resource, in this order (simplest/most isolated first, to validate the pattern before
tackling `character`, which is the largest and most cross-linked):
1. `staff_user`
2. `account`
3. `treasure`
4. `game`
5. `game_session`
6. `character`

For each resource:
1. `git mv` the resource's page `.jsx`/controller `.js`/helper `.jsx` files into
   `resources/<resource>/pages/...` (preserving the `controllers/`/`helpers/` split as
   subfolders under `pages/`, matching the issue's example nesting).
2. Grep every `elements/*` candidate file identified above for the resource: confirm (via
   `grep -rn` for its import path) that it's only imported from that resource's pages/other
   resource-specific elements, then `git mv` it into
   `resources/<resource>/pages/elements/` (with `controllers/`/`helpers/` subfolders as
   needed) — matching the issue's example nesting (`resources/game/pages/game/elements/...`
   collapses in practice to `resources/game/pages/elements/...` since there's one `game`
   resource, not a nested `game/game`).
3. Update every import path referencing a moved file — inside the moved files themselves
   (relative imports to `common/`/`utils/`/other resources), in `utils/HashRouteResolver.js`
   (no import changes there, route keys are unaffected), and in
   `components/helpers/AppHelper.jsx` (update the `../pages/*.jsx` import paths for this
   resource's pages to `../resources/<resource>/pages/*.jsx`).
4. Move the mirrored spec files under `frontend/specs/assets/js/components/...` into the same
   new relative locations, updating their import paths the same way.
5. Run lint and the full test suite (see CI Checks) before moving to the next resource —
   don't let broken imports accumulate across resources.

### Step 3 — Move shared/common elements
Any `elements/*` file not claimed by a specific resource in Step 2 moves to
`components/common/` (root, `controllers/`, or `helpers/` as it already sits), with matching
spec moves and import updates. `App.jsx`/`AppController.js` and `helpers/AppHelper.jsx` stay
at `components/` root (per the existing convention documented in `frontend.md`); only their
imports of moved files change.

### Step 4 — Remove now-empty legacy folders
Once every file has moved, delete the now-empty `components/elements/` and `components/pages/`
(and their `controllers/`/`helpers/` subfolders), plus the equivalent empty folders under
`specs/assets/js/components/`.

### Step 5 — Full verification pass
Run the complete lint + test suite once more from a clean tree to catch any import left
pointing at an old path (a stale relative import inside a moved file is the most likely
failure mode, since it silently still resolves as long as both files moved together but breaks
if only one did).

### Step 6 — Update documentation
Update `docs/agents/frontend.md`'s "Directory Structure" and "Pages vs Elements" sections to
describe the new `resources/<resource>/pages/...` + `common/` layout, replacing the current
type-first tree. Update the "Adding a New Page"/"Adding a New Element" instructions to
reference the resource folder instead of the flat `pages/`/`elements/` folders.

## Files to Change

- `frontend/assets/js/components/pages/**` — moved into `resources/<resource>/pages/**` per
  the mapping in Context.
- `frontend/assets/js/components/elements/**` — split between `resources/<resource>/pages/elements/**`
  (resource-specific, per Context) and `components/common/**` (shared).
- `frontend/assets/js/components/helpers/AppHelper.jsx` — import paths updated to new page
  locations; not moved.
- `frontend/assets/js/utils/HashRouteResolver.js` — unaffected (route keys, no file imports of
  moved components).
- `frontend/specs/assets/js/components/**` — mirrored moves of every spec file.
- `docs/agents/frontend.md` — directory structure and page/element instructions updated.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)

## Notes
- The exact resource-vs-common classification of `elements/*` files listed in Context is a
  best-effort read from naming conventions, not a verified grep of every import — the
  implementing agent must confirm each file's actual importers before moving it, since moving
  a file that's secretly used by two resources into just one of them would break the other.
- Migrating one resource per commit/PR (per the issue's confirmed scope) keeps each diff
  reviewable; do not attempt the full move in a single commit.
- `character` is deliberately last: it's the largest resource (NPC + PC variants,
  `pages/shared/Character*.jsx`) and most likely to surface edge cases in the shared-vs-specific
  classification, so the pattern should already be proven on smaller resources first.
