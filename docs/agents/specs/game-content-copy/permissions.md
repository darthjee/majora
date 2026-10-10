# Game Content Copy — Permissions

Part of the [Game Content Copy](../game-content-copy.md) spec. Access rules for the copy page and
its endpoints, following the existing staff-photos pattern. The per-endpoint access table lives
in [access-control/staff-copy.md](../../access-control/staff-copy.md).

## Backend

Every new view (`staff/copies*.json`) is:

- `@restricted` — every response sends `X-Skip-Cache: true`;
- `@permission_classes([AllowAny])` plus an inline `require_staff(request)` (`401`
  unauthenticated, `403` non-staff), as in `staff_photo_replace`;
- `require_staff` runs before any type/id/slug lookup, so the endpoints are not an existence
  oracle.

There is no `EndpointPermission` / `permissions.yaml` entry: those are for game resources.

## Frontend

- A `staffCopy` resource config with `permission: null` and identical `regular`/`private`
  variants, and **no** `RequestPermissionResolvers` entry. The page controller gates on
  `AccessStore.ensureStaffOrSuperUser()`.
- This is the same documented exception as `staffPhoto`/`staffUser`: the implementation issue
  adds `staffCopy` to the exception note in `RequestPermissionResolvers.js` (a code-comment change,
  not part of this docs-only spec).
- The header entry uses the `IS_ADMIN` gate.

## Link step

Defense in depth:

- the proxy link handler rejects non-staff early with `StaffAccessGuard`;
- the backend still requires staff/superuser for copy-origin uploads on top of the existing
  `X-Upload-Token` / `user` match.

## Game scope

**Any game, across domains.** Staff/superuser status is global
(`AdminOrStaffCache.is_admin_or_staff`) and `Game.game_slug` is globally unique, so any game can
be source or target (never the same one for both), whatever its domain groups. The selectors
therefore cannot use the domain-filtered games list (`DomainGamesCache`); they use the staff
endpoint `GET staff/copies/games.json`, listing **every** game (`[{slug, name, domain_groups}]`,
games without a domain group included).

## Cache

- Every new endpoint is `X-Skip-Cache`, so none is cached nor added to the Navi warm-up chain.
- **Open question — cross-domain cache invalidation.** The proxy response cache is keyed per
  domain (`DomainHash`), so an `X-Cache-Clear` on copy/finalize may only refresh the target
  game's paths on the current domain, not on the target game's own domain groups. Options:
  clearing the target game's paths for every domain group of the target game
  (`ResponseCacheClearer`), or relying on cache expiry. To be settled with the `cache` agent
  before the implementation issues.

## Security notes

- Both ends of a link are validated (same root, inside the base path, source exists); `link()`
  only, never `symlink()`, no byte-copy fallback.
- No server path (`file_path`, `source_path`) is ever returned to the client: the copy and renew
  responses carry only `{upload_id, upload_type, token}`; the start response goes to the proxy
  only.
- Renew reissues the token and reassigns `user` to the retrying staff member; the previous token
  stops working.
- The narrowed `/uploads/(image|file)/` matcher keeps link requests away from `UploadHandler`.
- Large document copies run in one transaction that only writes rows (no file I/O).
