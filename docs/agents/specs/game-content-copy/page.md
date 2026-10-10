# Game Content Copy — Page

Part of the [Game Content Copy](../game-content-copy.md) spec. Describes the staff page: its
entry point, selectors, tabs and the copy/link execution as seen by the user. The API it calls is
defined in [copy-flow.md](copy-flow.md) and [hard-links.md](hard-links.md); its access rules in
[permissions.md](permissions.md).

## Entry point

- A new `adminItem` in `HeaderNavHelper` (frontend header), shown under the **Admin** menu with
  the `IS_ADMIN` gate — same as the existing `staff/photos` entry. Visible only to staff and
  superusers.
- Route: `#/staff/copies`, with the page state kept in the query string:

  ```text
  #/staff/copies?type=<tab>&from=<source-slug>&to=<target-slug>
  ```

  `type` is one of the tab slugs below (default: the first tab). Reloading or sharing the URL
  restores the same tab and selected games.
- New i18n keys (all languages, key parity kept): menu label, page title, selector labels, tab
  labels, column headers, "copy" / "retry" actions, re-copy confirmation, per-entity and per-file
  status labels, and one label per link `error` code (see
  [hard-links.md](hard-links.md#upload-extension)).

## Game selectors

- Two selectors, **source** (`from`) and **target** (`to`), above the tabs. Both are fed by
  `GET staff/copies/games.json`, which lists **every** game across all domains (see
  [permissions.md](permissions.md#game-scope)); each option shows the game name and its domain
  groups so staff can tell same-named games apart.
- Choosing the same game for both is rejected (the page shows a validation message and does not
  load the list; the backend also rejects it, see [copy-flow.md](copy-flow.md#api)).
- Both selections persist in the URL across tab switches.

## Tabs

One tab per content type, modeled on `StaffPhotoTabs`; the list of tabs comes from
`GET staff/copies.json`:

| Tab slug | Label | Model |
|---|---|---|
| `items` | Items | `GameItem` |
| `common_items` | Common items | `GameCommonItem` |
| `recipes` | Recipes | `GameRecipe` |
| `documents` | Documents | `GameDocument` |
| `factions` | Factions | `GameFaction` |
| `possessions` | Possessions | `GamePossession` |

Per-tab columns and details are defined by the tab pages (#1552–#1557).

## Source list

- Once both games are selected, the active tab loads
  `GET staff/copies/<type>.json?from=<slug>&to=<slug>` (paginated) and shows the source game's
  entities with a checkbox each (multi-select, plus select-all on the current page).
- Rows with `copied_to_target: true` (already copied into the selected target, see
  [copy-flow.md](copy-flow.md#copied_from)) are flagged. Copying a flagged row again asks for
  confirmation first; confirming creates another, independent copy.

## Execution and progress

- **Each selected entity is copied by its own request**, sequentially:
  1. `POST staff/copies/<type>/<id>.json` `{target}` — creates the copy and its associated rows
     (one transaction). The response lists the pending links.
  2. For each pending link of that entity, `POST /uploads/link/<image|file>/<upload_id>/submit`
     (proxy) with its token.
- One failing entity (or one failing link) never affects the others: the page keeps going.
- The page shows a per-entity result (copied / failed with reason, e.g. "source gone" on `404`,
  "name already used" on `422`) and a per-file progress (pending / linked / failed with its error
  reason).
- When an entity copy returns `404` (source gone), the page reports it as failed and refreshes
  the source list.
- Leaving the page mid-run leaves the remaining links pending; they appear in the pending-links
  list below and can be resumed.

## Pending and failed links

- Below the tabs (independent of the active tab), the page lists the target game's links that
  are not linked yet: `GET staff/copies/links.json?to=<slug>`. Each row shows the copied entity,
  the file kind (photo/file), its status (pending/failed) and, for failures, the translated
  `error` reason.
- **Retry / resume**: `POST staff/copies/links/<upload_id>/renew.json` (new token), then the
  proxy link request. Available for every row, whoever started the copy.
- There is no discard action: a pending/failed link stays until it is linked (or until its
  copied row or the target game is deleted, see [copy-flow.md](copy-flow.md#edge-cases)).
- A link request answering `404` (copied row or game deleted meanwhile) drops the row from the
  list.

## Frontend structure

A `staffCopy` resource config and page controller gated on `AccessStore.ensureStaffOrSuperUser()`
(see [permissions.md](permissions.md#frontend)). The selectors, tabs, source list, per-entity /
per-file progress and pending-links list are separate components so each tab page only adds its
own row rendering.
