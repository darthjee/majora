# Game Content Copy — Permissions

Part of the [Game Content Copy](../game-content-copy.md) spec. Access rules for the copy page and
its endpoints, following the existing staff-photos pattern. The per-endpoint access table lives
in [access-control/staff-copy.md](../../access-control/staff-copy.md).

## Backend

Every new view (`staff/copies*.json`) is:

- `@restricted` as the **outermost** decorator — every response, including
  `400`/`401`/`403`/`404`/`422`, sends `X-Skip-Cache: true`;
- `@permission_classes([AllowAny])` plus an inline `require_staff(request)` (`401`
  unauthenticated, `403` non-staff), as in `staff_photo_replace`;
- `require_staff` runs before any type/id/slug lookup, so the endpoints are not an existence
  oracle.

There is no `EndpointPermission` / `permissions.yaml` entry: those are for game resources.

## Frontend

- A `staffCopy` resource config with `permission: null` and identical `regular`/`private`
  variants, and **no** `RequestPermissionResolvers` entry. The page controller gates on
  `AccessStore.ensureStaffOrSuperUser()`.
- This is the same exception as `staffUser` (listed in the `RequestPermissionResolvers.js` note)
  and `staffPhoto`/`staffStatistics` (documented in their own config files). The implementation
  issue adds `staffCopy` to the `RequestPermissionResolvers.js` note (a code-comment change, not
  part of this docs-only spec).
- Route registration: `['/staff/copies', 'staffCopies']` in `HashRouteResolver.js`'s `ROUTES`,
  `staffCopies: [{ kind: 'staffOrSuperuser' }]` in `accessRouteConfig.js`, and the page mapping
  (resource `staffCopy`, page key `staffCopies`, like `staffPhoto`/`staffPhotos`).
- The header entry uses the `IS_ADMIN` gate.

## Link step

Defense in depth:

- the proxy link handler rejects non-staff early with `StaffAccessGuard`;
- the backend requires staff/superuser for copy-origin uploads on top of the existing
  `X-Upload-Token` / `user` match; for copy uploads `require_staff` replaces the per-type
  permission check (see [hard-links.md](hard-links.md#upload-extension)).

## Game scope

**Any game, across domains.** Staff/superuser status is global
(`AdminOrStaffCache.is_admin_or_staff`) and `Game.game_slug` is globally unique, so any game can
be source or target (never the same one for both), whatever its domain groups. The selectors
therefore cannot use the domain-filtered games list (`DomainGamesCache`); they use the staff
endpoint `GET staff/copies/games.json`, listing **every** game (`[{slug, name, domain_groups}]`,
games without a domain group included).

### Product rule: a new Staff exception

[Ownership and roles](../../product/entities/ownership-and-roles.md) ("Staff Role") gives Staff
no authority over game-scoped editing, with a short list of named exceptions. Copying creates
game-scoped rows in any target game, so it is a **new named exception**: Staff may create copies
of game content in any game. It grants no edit, delete or GameMaster capability over the copied
or source rows. The implementation issue adds it to that list and to the role table.

## Cache

- Every new endpoint is `X-Skip-Cache`, so none is cached nor added to the Navi warm-up chain
  (`navi/navi_config.yaml` and `navi/resources/*.yml` are unchanged). The generic `backend.php`
  rule already honors `X-Skip-Cache`; no new Tent rule is needed for that.
- **Cross-domain invalidation (decided with the `cache` agent).** Cache folders are per domain
  (`DomainHash` of the request's Host) and have no expiry, so clearing only the current domain
  would leave the target game's lists stale on its own domains until a manual
  `DELETE /staff/cache/disk.json`. Therefore: copy (`POST staff/copies/<type>/<id>.json`) and
  copy-link finalize send `X-Cache-Clear` with the target game's stale paths, and the proxy
  clears each listed path in **every** `domain_*` folder under the cache root, not just the
  current request's domain. This needs a `proxy` change — a cross-domain mode for
  `ResponseCacheClearer`, reusing its path validation and `PathTraversalGuard` per folder — done
  before or alongside the backend issue. The backend never lists domain groups or hostnames
  (the cache key is the raw Host, so that would miss aliases/ports and couple the backend to
  proxy hashing); since `game_slug` is globally unique, clearing a game path everywhere is
  correct, and over-clearing only costs a cache miss.
- Side note: staff photo delete/finalize already has the same single-domain gap today; the
  cross-domain mode may cover it too, or it can be tracked as its own issue.

## Security notes

- Both ends of a link are validated against the type root (`<base>/photos` or `<base>/files`);
  the source must be a regular file, not a symlink; `link()` only, never `symlink()`, no
  byte-copy fallback (see [hard-links.md](hard-links.md#proxy-link-handler)).
- `source_path` and `file_path` are generated server-side, never accepted from a request.
- Copy and renew responses carry only `{upload_id, upload_type, token}`; the paths are returned
  only by the proxy-facing `PATCH ... status=uploading`, which a staff token holder could call
  directly — accepted, as for the existing `file_path` response.
- Renew is limited to copy-origin uploads, refused while a link is in flight, and reissues the
  token atomically with the `user` reassignment; the previous token stops working.
- The anchored `/uploads/(image|file)/` regex matcher keeps link requests away from
  `UploadHandler`.
- `copied_from` is never exposed by regular or restricted game serializers (it could leak the id
  of an entity from another domain or a hidden one); only the staff `copied_to_target` flag uses
  it.
- Large document copies run in one transaction that only writes rows (no file I/O).
