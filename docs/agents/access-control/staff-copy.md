# Staff Copy (game content copy)

> **Planned.** These endpoints do not exist yet: this page records the access rules designed in
> the [Game Content Copy spec](../specs/game-content-copy.md). The implementation issues turn it
> into a description of current behavior.

**[Staff resource](principles.md#resource-categories).** Staff-only endpoints copy game-scoped
content (items, common items, recipes, documents, factions, possessions) from one game to another,
across domains, independently of any game role. Every backend endpoint enforces
**Staff-or-superuser** inline (`require_staff`, backed by `AdminOrStaffCache`), matching every
other `staff/*` endpoint, and every response sets `X-Skip-Cache: true` per the
[`X-Skip-Cache` rule](principles.md#x-skip-cache-rule). There is no `EndpointPermission` /
`permissions.yaml` entry — those are for game resources.

| Action | Who can |
|--------|---------|
| Read the tab index (`GET /staff/copies.json`) | **Staff-or-superuser** |
| List every game, all domains (`GET /staff/copies/games.json`) | **Staff-or-superuser** |
| List a source game's entities (`GET /staff/copies/<type>.json?from=&to=`) | **Staff-or-superuser** |
| Copy one entity (`POST /staff/copies/<type>/<id>.json`) | **Staff-or-superuser** |
| List pending/failed links (`GET /staff/copies/links.json?to=`) | **Staff-or-superuser** |
| Renew a link upload (`POST /staff/copies/links/<upload_id>/renew.json`) | **Staff-or-superuser** |
| Link start/finalize/fail (`PATCH /uploads/<image\|file>/<id>.json`, copy origin) | The upload's `user` with a matching `X-Upload-Token`, **and** Staff-or-superuser (replaces the per-type permission check) |
| Proxy link (`POST /uploads/link/<image\|file>/<id>/submit`) | **Staff-or-superuser** (`StaffAccessGuard`), then the backend checks above |

A DM or game admin **without** staff gets `403` on all of these, even between their own games.

## Check order

`require_staff` runs **before** `<type>`, `<id>`, `from`/`to`/`target` slugs or `<upload_id>`
are resolved: unauthenticated callers get `401` and non-staff callers `403` whether or not the
resource exists, so these endpoints are not an existence oracle.

On `PATCH /uploads/<type>/<id>.json` for a copy upload, the staff check joins the uniform-`403`
group (token, `user`, expiry, not-uploaded) that runs **before** the `upload_type` `404`, keeping
the [no-leak ordering](upload.md#route-shape-and-the-no-leak-ordering-guarantee). For copy
uploads `require_staff` **replaces** the per-type permission check (GameEdit and so on), as for
[staff-origin uploads](upload.md#staff-origin-uploads). Allowed transitions: `pending` →
`uploading` → `uploaded`, and `pending`/`uploading` → `failed`; a `failed` upload accepts no
further `PATCH` until renewed. `status=failed` on a non-copy upload, or with an `error` outside the
fixed choices, is `400`.

Renew resolves `<upload_id>` only after `require_staff`: a non-copy upload is `404`; an
`uploaded` one, or an `uploading` one that has not expired, is `409`.

## Fields

- `GET /staff/copies/games.json` exposes `slug`, `name` and `domain_groups` (group names only — no
  hosts or other domain configuration) of **every** game, including games outside the caller's
  domain and games without a domain group — staff-only.
- Source list rows expose the source entity's fields (per tab, see the spec's tab pages) plus
  `copied_to_target`. Hidden source entities are listed (staff see everything).
- Copy and renew responses expose only `{id}` / `{upload_id, upload_type, token}`: never
  `file_path` or `source_path`. The `token` goes only to the staff member who created or renewed
  the upload.
- `GET /staff/copies/links.json` exposes, per link: the copied entity, `upload_id`,
  `upload_type`, `status` and `error` — no paths, no token.
- `copied_from` (the provenance FK on copyable models) is never exposed by regular or restricted
  game serializers; only the staff `copied_to_target` flag is derived from it.

### Exceptions to [Upload](upload.md#fields)

`upload.md` states that `token` is only returned by the init response and that `status`,
`origin` and `file_path` are never returned. For copy-origin uploads:

- renew returns a fresh `token` to the renewing staff member;
- `links.json` exposes `status` and `error`;
- `PATCH ... status=uploading` returns `source_path` next to `file_path`.

The implementation issue updates `upload.md` (Fields, Read row, plus a "Copy-origin uploads"
section).

## Copy-origin `Upload` rules

See also [Upload](upload.md).

- `origin='copy'` uploads are created only by the copy endpoint, one per copied photo/file row.
- `source_path` and `file_path` are generated server-side, never accepted from a request, and
  returned only by `PATCH ... status=uploading` (proxy-facing; a staff token holder could call it
  directly — accepted, as for the existing `file_path` response).
- `status=failed` (+ `error`) is accepted only for copy-origin uploads.
- Renew (copy-origin only) reissues `token` and `expiration_time`, resets `status` to `pending`,
  clears `error`, and reassigns `user` to the renewing staff member in one save — the old token
  stops working, and any staff member can resume another's copy.
- Finalize (`CopyLinkFinalizer`) marks the copied row `ready=true` and, when `is_cover`, sets its
  owner's cover `photo` FK.

## Cache

Every response sets `X-Skip-Cache: true`. Copy and copy-link finalize clear the target game's
cached paths on **every** domain (see the spec's
[permissions page](../specs/game-content-copy/permissions.md#cache)); until that proxy mode
exists, target-game pages on other domains may serve stale lists — not a data exposure.
