# Issue: Game content copy: global spec

## Description

Staff and superusers need to copy game-scoped content from one game to another. A new entry in
the header's **Admin** menu (staff/superuser only, like `staff/photos`) leads to a page with a
source-game and a target-game selector above one tab per content type — Items (`GameItem`),
Common items (`GameCommonItem`), Recipes (`GameRecipe`), Documents (`GameDocument`), Factions
(`GameFaction`), Possessions (`GamePossession`). Nothing attached to a character
(`CharacterItem`, `CharacterTreasure`, …) is copyable, nor `GameTreasure`/`Treasure`,
`GamePhoto`, `GameLink`, `Task`, `Poll`, `GameSession`, `Player`.

This issue writes the **global** spec. Per-tab specs are separate issues and reference these
pages.

Part of epic #1550. The per-tab spec issues (#1552–#1557) depend on this one; #1558 removes all these specs once the feature is implemented.

## Problem

There is no way for staff to reuse content across games: every item, common item, recipe,
document, faction or possession has to be recreated by hand, uploads included. Before the
feature is implemented, its shared design (page, copy flow, hard-link mechanism, `Upload`
changes, API, permissions) must be written down once so the per-tab specs and the later
implementation issues build on the same contracts.

## Expected Behavior

A docs-only PR that adds:

- `docs/agents/specs/game-content-copy.md` (index) and its entry under "Active specs" in the
  `docs/agents/specs.md` hub;
- a one-time `Specs` row in `AGENTS.md`'s documentation table pointing to the hub;
- `docs/agents/specs/game-content-copy/page.md`, `copy-flow.md`, `hard-links.md`,
  `permissions.md`, covering every decision below;
- `docs/agents/access-control/staff-copy.md`, linked from `docs/agents/access-control.md`;
- reviewed by the agents listed under "Agent consultation", with unresolved points recorded as
  open questions in the spec.

## Solution

### Specs hub

- Create `docs/agents/specs/game-content-copy.md`, a short index linking to every page under
  `docs/agents/specs/game-content-copy/` (the global pages below now; the per-tab pages as their
  issues land).
- Register it under "Active specs" in `docs/agents/specs.md`. `specs.md` is the single hub for
  feature spec entrypoints; feature specs are never listed directly in `AGENTS.md`.
- `AGENTS.md`'s documentation table has no row for `specs.md` today: add it once, permanently
  (e.g. `| [Specs](docs/agents/specs.md) | Hub of active feature specs (design docs removed once
  the feature is implemented). |`).

### `game-content-copy/page.md`

- Admin menu entry (`HeaderNavHelper` `adminItem`, `IS_ADMIN` gate), route, i18n keys.
- Source and target game selectors above the tabs, kept in the URL (e.g.
  `#/staff/copies?type=items&from=<slug>&to=<slug>`); same game for both is rejected.
- Tabs, one per content type, modeled on `StaffPhotoTabs`.
- Source list with checkboxes; multi-select, but **each selected entity is copied by its own
  request**, then its file links; one failing entity never affects others; per-entity result
  and per-file progress.
- Entities already copied to the selected target (via `copied_from`) are flagged; copying again
  asks for confirmation.
- A list of pending/failed links (copied photos/files not yet linked) that staff can resume or
  retry.

### `game-content-copy/copy-flow.md`

- DB copy phase: one request per entity, one transaction, creating the copy and every associated
  row; photo/file rows created `ready=false` (already hidden by every listing, which filter on
  `ready=True`). Response lists pending links by record type/id only — never server paths.
- `copied_from` FK on each copyable model, `on_delete=SET_NULL`.
- Name clashes are allowed except where a unique constraint exists (factions:
  `unique_faction_name_per_game` → validation error).
- `hidden` is kept from the source.
- Cover `photo` FK of the copy stays null until the matching photo is linked; that photo's
  finalize sets it.

### `game-content-copy/hard-links.md`

- Uploads live under two separate proxy mounts (`/var/www/html/photos`,
  `/var/www/html/files`); a photo is linked within the photos root, a file within the files root.
- Reuse `uploads.Upload` with the new `copy` origin and a `source_path` (see "`Upload` extension"
  below); the copy's new `path` (`Upload.file_path`) is built by `PhotoPathBuilder` under the
  **target** game (new uuid-suffixed name).
- Proxy endpoint `POST /uploads/link/<image|file>/<id>/submit`, gated by `StaffAccessGuard`: start
  the link on the backend (`PATCH uploads/<type>/<id>.json` `status=uploading`, which for a link
  `Upload` returns `{source_path, file_path}`), validate both ends
  (`PathTraversalGuard`/`SecurePhotoStorage`: same root, inside the base path, source exists),
  create the target directory, PHP `link()` (never `symlink()`), finalize (`uploaded` →
  `ready=true`, cover FK). Paths never reach the client.
- Any failure (missing source, rejected path, `EXDEV`, permission) is reported with
  `PATCH ... status=failed` + `{error}`, keeping the record retryable with its error reason; **no** fallback to a byte copy. Interrupted runs are resumable; nothing
  is auto-deleted.
- Idempotent retry: an existing target with the same inode as the source → skip linking, just
  finalize; any other existing file → error.
- Copies are independent: `DeleteHandler` deletion or `UploadStorageResolver`'s atomic `rename()`
  replace only touches one directory entry.
- `DirectorySizeCalculator` (`du`) counts a hard-linked file once per scan; storage stats report
  real disk usage — intended.

### API (baseline — documented in `copy-flow.md` / `hard-links.md`)

The spec documents this structure; the writer may refine details but keeps it.

Backend (all `.json`, staff/superuser only, `X-Skip-Cache`):

| Method & path | Purpose |
|---|---|
| `GET staff/copies.json` | Tab index: available content types (like `staff/photos.json`). |
| `GET staff/copies/games.json` | Every game across all domains, for the source/target selectors: `[{slug, name, domain_groups}]`. |
| `GET staff/copies/<type>.json?from=<slug>&to=<slug>` | Paginated source list for a tab; each row has `copied_to_target`. |
| `POST staff/copies/<type>/<id>.json` `{target: <slug>}` | Copy one entity (one transaction). `201` → new entity id + pending links `[{upload_id, upload_type, token}]`, never paths. `404` source gone, `422` faction name clash. |
| `GET staff/copies/links.json?to=<slug>` | Pending/failed links of the target game, with error reasons. |
| `POST staff/copies/links/<upload_id>/renew.json` | Retry: re-issue a pending/failed/expired link `Upload` (new token + expiry, `user` = the retrying staff member); returns `{upload_id, upload_type, token}`. |
| `PATCH uploads/<image\|file>/<id>.json` (existing) | Link start/finalize reusing the existing statuses: for a link `Upload`, `status=uploading` also returns `source_path` next to `file_path`; `status=uploaded` finalizes (`ready=true`, cover FK). New `status=failed` + `{error}` records a failure and keeps it retryable. |

Proxy:

| Method & path | Purpose |
|---|---|
| `POST /uploads/link/<image\|file>/<id>/submit` | New link handler (staff guard → `PATCH uploading` → validate → `link()` → `PATCH uploaded` / `PATCH failed`). |

Route collision: the existing `UploadHandler` rule matches every `POST` beginning with `/uploads/`
(`proxy/*_configuration/rules/uploads.php`). Narrow it to `/uploads/(image|file)/` so
`/uploads/link/...` reaches the new handler regardless of rule order.

### `Upload` extension (documented in `hard-links.md`)

Current model (`backend/uploads/models.py`): `user`, `token` (checked against `X-Upload-Token`),
`status` (`pending`/`uploading`/`uploaded`, immutable once `uploaded`), `upload_type`
(`image`/`file`), `file_path`, `expiration_time`, generic `content_object`, `origin`
(`regular`/`staff`, dispatching staff finalizes to `StaffUploadFinalizer`).

- **Link kind**: new `ORIGIN_COPY = 'copy'`; finalize dispatches copy uploads to a new
  `CopyLinkFinalizer`, like it does for `StaffUploadFinalizer`.
- **New fields**: `source_path` (the source row's path; null for non-copy uploads), `is_cover`
  (boolean — the source row was its owner's cover), `error` (nullable, fixed choices:
  `source_missing`, `path_rejected`, `cross_device`, `target_exists`, `permission`, `unknown`,
  translated in the UI).
- **Statuses**: new `STATUS_FAILED = 'failed'`, accepted by `PATCH uploads/<type>/<id>.json` only
  for copy uploads (together with `error`); regular/staff uploads keep accepting only
  `uploading`/`uploaded`.
- **Start**: for a copy upload, `status=uploading` returns `{file_path, source_path}`.
- **Finalize** (`CopyLinkFinalizer`): sets `ready=true` on the copied row and, when `is_cover`,
  sets its owner's cover `photo` FK to it. The regular "first photo becomes cover"
  (`_set_game_photo_if_unset`-style) logic does not apply to copies.
- **Renew** (retry): issues a new `token` and `expiration_time`, resets `status` to `pending` and
  clears `error`, and reassigns `user` to the retrying staff member, so any staff member can resume
  another's copy. `UploadQuerySet.active()` ignores failed/expired uploads, so the pending-links
  list uses its own query (copy origin, not `uploaded`, by target game).
- **Backward compatibility**: additive migration (new choice values, nullable/defaulted fields);
  regular and staff uploads behave exactly as today.

### `game-content-copy/permissions.md`

Follow the existing staff-photos pattern:

- **Backend**: every new view is `@restricted` (`X-Skip-Cache`) + `@permission_classes([AllowAny])`
  + an inline `require_staff(request)` (401 unauthenticated / 403 non-staff), as in
  `staff_photo_replace`.
- **Frontend**: a `staffCopy` resource config with `permission: null` and identical
  `regular`/`private` variants, no `RequestPermissionResolvers` entry; the page controller gates on
  `AccessStore.ensureStaffOrSuperUser()`. This is the same documented exception as
  `staffPhoto`/`staffUser` — add `staffCopy` to the exception note in
  `RequestPermissionResolvers.js`. Header entry uses the `IS_ADMIN` gate.
- **Link step (defense in depth)**: the proxy link handler rejects non-staff early with
  `StaffAccessGuard`; the backend still requires staff for copy-origin uploads on top of the
  existing `X-Upload-Token`/`user` match.
- **Game scope — any game, across domains**: staff/superuser status is global
  (`AdminOrStaffCache.is_admin_or_staff`) and `Game.game_slug` is globally unique, so any game can
  be source or target (never the same one for both), whatever its domain groups. The selectors
  cannot use the domain-filtered games list (`DomainGamesCache`); they use a new staff endpoint
  `GET staff/copies/games.json` listing **every** game (`[{slug, name, domain_groups}]`, games
  without a domain group included).
- **Open question — cross-domain cache invalidation**: the proxy response cache is keyed per
  domain (`DomainHash`), so `X-Cache-Clear` on copy/finalize may only refresh the target game's
  paths on the current domain, not on the target's own domain groups. The spec writer decides,
  with the `cache` agent (and `ResponseCacheClearer`), how copied content becomes visible there
  (e.g. clearing for every domain group of the target game, or relying on expiry).
- **Docs**: a new `docs/agents/access-control/staff-copy.md` page, linked from
  `access-control.md`, listing every new endpoint and the `Upload` copy-origin rules.
- **Security notes**: path validation of both link ends, no server path returned, large document
  copies in one transaction.

### Edge cases (decided)

Document these in `copy-flow.md` / `hard-links.md`:

- **Source upload not ready**: source photos/files with `ready=false` are skipped — only
  `ready=true` ones are copied.
- **Source entity gone**: the copy reads the source inside its transaction (copying its current
  state); if it no longer exists the request returns 404, the page reports that entity as failed
  and refreshes the list.
- **Source file gone before its link**: handled like any link failure — the copied row stays
  pending with an error reason (source missing), visible on the copy page for retry.
- **Target game / copied entity deleted while links are pending**: cascade deletes remove the
  copied rows and their `Upload` records; a later link request returns 404 and the page drops it.
  No file was ever written for unlinked rows.
- **`Upload` expiry**: link-kind `Upload`s keep the normal `expiration_time`; resuming/retrying a
  pending row from the copy page renews (re-issues) its `Upload`, so a pending row is never stuck.
- **`Upload` cleanup**: `Upload` points to its row through a `GenericForeignKey` and no model
  declares a `GenericRelation` today, so deletes don't cascade. The copyable photo/file models
  declare a `GenericRelation` to `Upload` so deleting them (or their game) deletes their `Upload`s.
- **No discard**: staff cannot discard a pending/failed link; it stays until linked (retry only).

### Also cover

Backward compatibility (additive migrations only), and the testing strategy (backend per type +
link flow, proxy PHPUnit for the link handler, frontend Jasmine for page/tabs/selectors/progress).

### Notes

- No code changes: this issue only writes docs. Code-comment updates such as the exception note
  in `RequestPermissionResolvers.js` belong to the implementation issues; the spec just says so.
- One issue, one PR on purpose: every decision is made and the pages cross-reference each other
  heavily (copy flow ↔ hard links ↔ API ↔ `Upload`), so a single writer keeps them consistent.

### Agent consultation (required review before the PR)

The writer dispatches these agents on the draft pages and folds their findings in before opening
the PR; any unresolved disagreement is listed as an open question in the spec.

- `product-owner` — entities and ownership (`copied_from`, the cross-domain staff scope).
- `data-access` — access control of every new endpoint and serializer field, and the
  `access-control/staff-copy.md` page.
- `security` — hard-link path validation (both ends), token/`user` reassignment on renew, no
  server path reaching the client, the narrowed uploads matcher.
- `proxy` — the link handler, `StaffAccessGuard`, the `/uploads/(image|file)/` matcher change.
- `cache` — the cross-domain cache invalidation open question, `X-Skip-Cache` on the new
  endpoints, and any Navi config impact.
- `backend` — feasibility of the `Upload` extension, `CopyLinkFinalizer`, `GenericRelation`s and
  `copied_from` migrations.
- `frontend` — feasibility of the `staffCopy` page structure (selectors, tabs, per-entity and
  per-file progress, pending-links list).

## Benefits

- One source of truth for the shared contracts, so the six tab specs only add per-type details.
- Implementation issues can be split straight from the specs with every product decision made.
- The `specs.md` hub keeps `AGENTS.md` stable as feature specs come and go.
