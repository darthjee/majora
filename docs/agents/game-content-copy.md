# Game Content Copy

The staff-only **game content copy page** (`#/staff/copies`, epic #1550) copies game-scoped
content from one game to another, across domains: Items (`GameItem`), Common items
(`GameCommonItem`), Recipes (`GameRecipe`), Documents (`GameDocument`), Factions
(`GameFaction`) and Possessions (`GamePossession`). Each selected entity is copied by its own
request (one DB transaction), and its photos/files are then shared with the copy through
filesystem **hard links**, never byte copies. This page holds the lasting knowledge about the
feature; per-tab specifics live in the [tab pages](#tabs).

Related docs:

- [Staff Copy (endpoint access)](access-control/staff-copy.md): the authoritative
  per-endpoint access rules, check order, exposed fields and copy-origin `Upload` rules.
- [Upload](access-control/upload.md#copy-origin-uploads): copy-origin uploads within the
  generic upload lifecycle.
- [Tent proxy: link handler](architecture/proxy.md#link-handler-linkhandler): the proxy side
  of the hard links and the cross-domain cache clear.
- [Ownership and roles](product/entities/ownership-and-roles.md#staff-role): the Staff
  exception that allows copying.

## Page

### Entry point and URL state

- The **Admin** menu entry (`adminItem('staff-copies', 'staff/copies', ...)` in
  `HeaderNavHelper`, under the `IS_ADMIN` gate like `staff/photos`) is visible only to staff
  and superusers.
- Route: `#/staff/copies`, with the selection kept in the hash query:

  ```text
  #/staff/copies?type=<tab>&from=<source-slug>&to=<target-slug>
  ```

  Reloading or sharing the URL restores the same tab and games. A stale `type` falls back to
  the first tab; unknown game slugs are dropped. Changing any selector rewrites the hash
  (keeping the other selectors, dropping pagination), which reloads the page.
- `from`/`to` are also generic filter keys (staff statistics date ranges), so
  `StaffCopyUrl` reads them straight from the hash query instead of through
  `HashRouteResolver#getFilterParams`.

### Game selectors

Two selectors, **source** (`from`) and **target** (`to`), are fed by
`GET staff/copies/games.json`, which lists **every** game across all domains (ordered by
name, unpaginated, games without a domain group included); each option carries the game's
domain group names so staff can tell same-named games apart. Choosing the same game twice
shows a validation message and loads no list; the backend rejects it too (`400`
`same_game`).

### Tabs and source list

- The tab list comes from `GET staff/copies.json` (`{types}`, in registry order, see
  [Tabs](#tabs)). Tab links keep `from`/`to`.
- Once both games are selected and differ, the active tab loads
  `GET staff/copies/<type>.json?from=<slug>&to=<slug>` (paginated) and lists the source game's
  entities, hidden ones included, with a checkbox each (multi-select, plus select-all on the
  current page). Each tab renders its own row columns.
- Rows with `copied_to_target: true` (some entity of the target game has `copied_from` = this
  row) are flagged. When the selection contains a flagged row, the page asks for a re-copy
  confirmation first: confirming runs the whole selection (creating another, independent copy
  of each flagged row); cancelling aborts the whole run.

### Execution and progress

- `StaffCopyRunner` copies the selected rows **strictly one at a time**:
  1. `POST staff/copies/<type>/<id>.json` `{target}` creates the copy and its associated rows;
     the `201` lists the pending links `[{upload_id, upload_type, token}]`.
  2. For each of that entity's links, one at a time,
     `POST /uploads/link/<image|file>/<upload_id>/submit` (proxy, `UploadClient#linkUpload`)
     with the token in `X-Upload-Token`.
- A failing entity or link never stops the run. Each entity shows
  `pending → copying → copied | failed`, with the failure reason mapped from the status
  (`404` source gone, `422` name already used, `400` invalid request, anything else unknown).
  Each file shows `pending → linking → linked | failed`.
- While running, a `beforeunload` guard warns before leaving; leaving anyway leaves the
  remaining links pending. Once the run ends, the page purges its cached `staffCopy` requests
  and refreshes both the source list and the pending-links list.

### Pending and failed links

- Below the tabs (independent of the active tab), the page lists the target game's links that
  are not linked yet: `GET staff/copies/links.json?to=<slug>` (unpaginated). Each row shows the
  copied entity, the file kind, its status and, for failures, the translated `error` reason.
- **Retry / resume** (any row, whoever started the copy):
  `POST staff/copies/links/<upload_id>/renew.json` issues a new token, then the proxy link
  request runs with it. A linked row, or one whose renew or link answers `404` (copied row or
  game gone), is dropped; a renew `409` shows an "in flight" error; a link failure refetches
  the list so the backend's error code shows.
- There is no discard action: a pending/failed link stays until it is linked, or until its
  copied row or the target game is deleted.

### Frontend structure

- `utils/requests/config/staffCopyConfig.js`: the `staffCopy` resource (`GET.index`,
  `GET.games`, `GET.collection`, `GET.links`, `POST.copy`, `POST.renew`), `permission: null`,
  identical `regular`/`private` variants.
- `components/resources/staff_copy/pages/`: `StaffCopies.jsx` and `StaffCopiesHelper.jsx`;
  `controllers/` (`StaffCopiesController` for gating, loading and the run,
  `StaffCopyLinksController` for the links list, `StaffCopyRunner` for the sequential run,
  `StaffCopyActions` for outcome-returning requests); `elements/` (selectors, tabs, source
  list, progress, links list, confirmation modal) with one row component per tab under
  `elements/rows/`; `helpers/` (`StaffCopyUrl`, `StaffCopyErrors`, `StaffCopyRows`); `hooks/`.
- i18n keys live under `staff_copies_page.*` (including `entity_error.*` and
  `link_error.*`), plus the `header.nav_staff_copies` menu label.

## Copy flow

### DB copy phase

- One `POST staff/copies/<type>/<id>.json` `{target: <slug>}` per entity, run in **one
  transaction**: the source is re-read inside the transaction (its current state is copied),
  and the copy plus every associated row is created, or nothing is.
- The backend registry is `staff/copy_types.py` (one `CopyType` per tab, in tab order;
  `games` and `links` are reserved slugs). The shared list/copy behavior is `ModelCopyType`
  in `staff/copy_type_base.py`; each tab declares its copied fields, list serializer and
  hooks (`copy_associations`, `cache_paths`, `copy_result`).
- Copied photo/file rows are created with `ready=false`. Every listing already filters on
  `ready=True`, so they stay invisible until linked. Only source rows with `ready=true` are
  copied; not-ready ones are skipped.
- For each copied photo/file row, one copy-origin `Upload` is created: `origin='copy'`,
  `status='pending'`, `user` = the requesting staff member, `source_path` = the source row's
  path, `file_path` = the copy's new path, `is_cover` = whether it becomes its owner's cover.
- The `201` answers `{id, links: [{upload_id, upload_type, token}]}`: **never server paths**.

`POST staff/copies/<type>/<id>.json` responses:

| Status | When |
|--------|------|
| `201` | Copied. Carries `X-Cache-Clear` (see [Cache](#cache)). |
| `400` | `target` missing/invalid/unknown (`required`, `invalid`, `not_found`), or the source's own game (`same_game`). |
| `404` | Unknown `<type>`, or the source entity does not exist (also when it vanishes before the transaction re-reads it). |
| `422` | Faction name already used in the target game (`{"errors": {"name": ["unique"]}}`). |

The list endpoint answers `400` with the same codes for `from`/`to`, and `to: same_game`
when both are the same game.

### `copied_from`

- Each copyable model has a nullable self-FK `copied_from` (`on_delete=SET_NULL`,
  `related_name='copies'`): the copy survives the deletion of its source, including through
  the source game's deletion.
- The list's `copied_to_target` flag is an `Exists` annotation over it. Copying a flagged row
  again (after confirmation) is allowed and creates another copy.
- `copied_from` is staff-visible provenance only: it is never exposed by regular or
  restricted game serializers (it could leak the id of an entity from another domain, or a
  hidden one). The product entity pages document it.

### Copy rules

- **Same-game references**: apart from `copied_from`, a copy never references a row of
  another game. In-game FKs are resolved in the target (see the recipes'
  [common item](game-content-copy/recipes.md#common-item)).
- **No character links, no history**: `CharacterItem`, `CharacterFaction`,
  `CharacterRecipe`, `CharacterDocument` and `CharacterPossession` rows pointing to the
  source are never copied or re-pointed, and the source's historical (`versioning`) records
  are not copied: the copy starts a fresh history.
- **Characters' available lists**: copying adds a candidate to every target character's
  "available" list of that family (items, documents, factions, possessions), so the copy and
  its finalize clear each character's `<family>/available.json` (#1565, see
  [Cache](#cache)).
- **Names**: name clashes with existing target entities are allowed, except for factions
  (`unique_faction_name_per_game`): `422`, nothing created (see
  [factions](game-content-copy/factions.md#names)).
- **`hidden`**: the copy keeps the source's `hidden` value (every copyable model except
  `GameFaction`, which has none).
- **Cover photo**: for models with a cover `photo` FK (all but recipes), the copy's cover FK
  stays null at copy time. It is set by the finalize of the photo link flagged `is_cover`. The
  per-type `mark_ready` cover handlers do not apply to copies.

### Edge cases

- **Source entity gone**: the copy answers `404`; the page reports that entity as failed.
- **Source file gone before its link**: a regular link failure (`source_missing`); the
  copied row stays pending in the links list, retryable.
- **Target game or copied entity deleted while links are pending**: the cascade deletes the
  copied rows and, through the `pre_delete` cleanup (see
  [Hard links](#hard-links)), their copy uploads. A later link request answers `404` and the
  page drops it. No file was ever written for unlinked rows.
- **Large documents**: a document with many files is still copied in one transaction; it only
  writes rows (no file I/O), so its duration stays bounded by the row count.

## Hard links

### Storage roots and paths

- The proxy's `photos_path` and `files_path` are both the shared base path (`/var/www/html`).
  The `photos/` and `files/` prefixes come from the backend path itself
  (`PhotoPathBuilder.build(root=...)`). Both ends of a link must carry the type prefix of the
  upload (`photos/` for `image`, `files/` for `file`) and resolve inside `<base>/photos` or
  `<base>/files`: never across roots.
- The copy's path is built with the same `PhotoPathBuilder` segments as that record type's
  regular upload, under the **target** game and the copy's id. Cover photos (items, common
  items, factions, possessions) and document file photos use a fixed `photo<ext>` name
  without uuid; document photos and files keep the source file name (its `_<uuid>` suffix
  stripped) and get a fresh uuid; document files use `root='files'`.
- `source_path` and `file_path` are always generated server-side; they are never accepted
  from a request.
- Files are shared with PHP `link()` only: never `symlink()`, never a byte copy.

### `Upload` copy origin

`Upload` (`backend/uploads/models.py`) gained, through additive migrations:

- `origin='copy'` (`ORIGIN_COPY`, `is_copy_origin`);
- `source_path` (nullable), `is_cover` (default false), and `error` (nullable, choices
  `source_missing`, `path_rejected`, `cross_device`, `target_exists`, `permission`,
  `unknown`);
- `status='failed'` (`STATUS_FAILED`), accepted on `PATCH uploads/<type>/<id>.json` only for
  copy uploads.

On `PATCH uploads/<type>/<id>.json`, copy uploads dispatch to `CopyLinkFinalizer`
(`backend/uploads/copy_link_finalizer.py`), whose `require_staff` **replaces** the per-type
permission check, as for staff-origin uploads. Token, `user`, expiry and the
not-`uploaded`/not-`failed` checks still run first:

- **Start** (`status=uploading`): returns `{file_path, source_path}` (regular uploads return
  only `file_path`).
- **Failure** (`status=failed` + `{error}`): records the reason; an `error` outside the
  choices is `400 invalid_error`. A `failed` upload accepts no further `PATCH` until renewed.
- **Finalize** (`status=uploaded`): locks the copied row (`404` if it was deleted, the upload
  staying mutable), sets `ready=true` and, when `is_cover`, points its owner's cover `photo`
  FK at it. The `200` carries `X-Cache-Clear` (see [Cache](#cache)).

### Renew (retry)

`POST staff/copies/links/<upload_id>/renew.json`, resolved only after `require_staff`, in one
locked transaction:

- `404` unless `<upload_id>` is a copy-origin upload: staff can never take over a regular or
  staff upload's token;
- `409` when it is `uploaded`, or `uploading` and not expired (a link in flight);
- otherwise (pending, failed or expired), `Upload.renew` issues a new `token` (the old one
  stops working) and `expiration_time`, resets `status` to `pending`, clears `error` and
  reassigns `user` to the retrying staff member. Returns `{upload_id, upload_type, token}`.

### Pending-links query

`UploadQuerySet.active()` ignores failed and expired uploads, so
`staff/copy_link_query.py` (`PendingCopyLinks`) builds its own: copy origin, status not
`uploaded`, content object among the target game's rows of a copyable photo/file model. The
`staff/copy_links.py` registry (`COPY_LINKS`) declares, per model, how a row reaches its game
(`GameDocumentFilePhoto` only through `GameDocumentFile.photo`), how it is described, how it
becomes a cover and which cache paths its finalize clears. Uploads whose copied row is gone
drop out of the list.

### Copy upload cleanup

`Upload` points to its row through a `GenericForeignKey`, so deletes do not cascade. A
`pre_delete` receiver (`uploads/signals.py`, connected to every `COPY_LINKS` model) deletes a
row's copy-origin uploads when the row (or its game) is deleted. A `GenericRelation` is
deliberately not used: it would also delete regular and staff uploads, which
`StaffUploadFinalizer` needs to answer `404 {cleanup_path}`.

### Proxy link handler

`POST /uploads/link/<image|file>/<id>/submit` (`LinkHandler`) checks staff access, starts the
link, validates both ends, hard-links the file, then finalizes it or reports
`status=failed` + `{error}`. It answers `200 {"status":"uploaded"}` or
`422 {"status":"failed","error":"<code>"}`, never paths; backend `403`/`404` are relayed as-is.
A target that is already the same inode is an idempotent retry; any other existing target is
`target_exists`. There is no byte-copy fallback and nothing is ever deleted. Details:
[architecture/proxy.md](architecture/proxy.md#link-handler-linkhandler).

### Independence of copies

- Deleting one copy's file (`DeleteHandler`) or replacing it (`UploadStorageResolver`'s
  atomic `rename()`) only touches its own directory entry: the other hard links keep the old
  content.
- `DirectorySizeCalculator` (`du`) counts a hard-linked file once per scan, so storage stats
  report real disk usage.

### Backward compatibility

Every schema change is additive: new `origin`/`status`/`error` choice values, nullable or
defaulted `source_path`/`is_cover`/`error` on `Upload`, and the nullable `copied_from` on the
copyable models (`games` migration `0105_copied_from` plus `versioning` migration
`0041_copied_from` for their `HistoricalRecords`). Regular and staff uploads behave as before.

## Permissions

- **Backend**: every `staff/copies*.json` view is `@restricted` (outermost, so every response
  sends `X-Skip-Cache: true`), `@permission_classes([AllowAny])` plus an inline
  `require_staff` (`401` unauthenticated, `403` non-staff) that runs before any type, id or
  slug lookup, so the endpoints are not an existence oracle. There is no
  `EndpointPermission` / `permissions.yaml` entry.
- **Frontend**: the `staffCopy` resource has no `RequestPermissionResolvers` entry (listed in
  that file's exception note). The route is `['/staff/copies', 'staffCopies']` in
  `HashRouteResolver.js`, gated by `staffCopies: [{ kind: 'staffOrSuperuser' }]` in
  `accessRouteConfig.js`, and the controller calls `AccessStore.ensureStaffOrSuperUser()`.
- **Link step** (defense in depth): the proxy rejects non-staff early with
  `StaffAccessGuard`; the backend then requires the token, `user` match and staff.
- **Game scope**: any game, across domains. Staff status is global and `Game.game_slug` is
  globally unique, so any game can be source or target (never both), whatever its domain
  groups; the selectors therefore use `staff/copies/games.json`, not the domain-filtered games
  list.
- **Product rule**: copying is a named Staff exception in
  [Ownership and roles](product/entities/ownership-and-roles.md#staff-role): it grants only
  the creation of copies in any game, no edit, delete or GameMaster capability over the source
  or copied rows.

Security notes:

- Both link ends are validated against the type root; the source must be a regular file, not
  a symlink; `link()` only.
- Paths are generated server-side and returned only by the proxy-facing
  `PATCH ... status=uploading`, which a staff token holder could call directly: accepted, as
  for the existing `file_path` response. Copy, renew and links-list responses carry no paths.
- Renew is limited to copy-origin uploads, refused while a link is in flight, and reissues the
  token atomically with the `user` reassignment.
- The anchored upload matchers keep link requests away from `UploadHandler`.

## Cache

- Every `staff/copies*` endpoint sends `X-Skip-Cache: true`, so none is cached nor part of the
  Navi warm-up chain.
- Cache folders are per domain and have no expiry, so clearing only the request's domain
  would leave the target game's pages stale on its own domains. The copy `201` and the link
  finalize `200` therefore send `X-Cache-Clear` with the target game's stale paths, and the
  proxy clears each path in the cache root and in **every** `domain_*` folder under it:
  - the copy goes through the `staff_copies` rule (`proxy/*/rules/staff_copies.php`), a
    backend proxy rule whose `ResponseCacheClearMiddleware` runs in `cross_domain` mode
    (#1570);
  - the link finalize is cleared by `LinkHandler` with `ResponseCacheClearer::forRoot` (#1570);
    staff photo delete/finalize (`DeleteHandler`/`UploadHandler`) use the same cross-domain
    mode (#1580).
- The backend never lists domains or hostnames: since `game_slug` is globally unique,
  clearing a game path everywhere is correct, and over-clearing only costs a cache miss.
- The copy and its link finalize send the same per-tab paths
  (`staff/copy_cache_paths.py`), including every target character's
  `<family>/available.json` where that family has one. Each tab page lists its paths in its
  own `## Cache` section.

## Out of scope

Never copied: anything attached to a character (`CharacterItem`, `CharacterTreasure`,
`CharacterFaction`, ...), `GameTreasure`/`Treasure`, `GamePhoto`, `GameLink`, `Task`, `Poll`,
`GameSession` and `Player`.

## Tabs

| Slug | Label | Model | Page |
|------|-------|-------|------|
| `items` | Items | `GameItem` | [items.md](game-content-copy/items.md) |
| `common_items` | Common items | `GameCommonItem` | [common-items.md](game-content-copy/common-items.md) |
| `recipes` | Recipes | `GameRecipe` | [recipes.md](game-content-copy/recipes.md) |
| `documents` | Documents | `GameDocument` | [documents.md](game-content-copy/documents.md) |
| `factions` | Factions | `GameFaction` | [factions.md](game-content-copy/factions.md) |
| `possessions` | Possessions | `GamePossession` | [possessions.md](game-content-copy/possessions.md) |
