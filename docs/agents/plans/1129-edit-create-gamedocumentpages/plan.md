# Plan: Edit/Create GameDocumentPages

Issue: [1129-edit-create-gamedocumentpages.md](../../issues/1129-edit-create-gamedocumentpages.md)

## Overview
Adds create/edit for `GameDocumentPage`s. Backend gets a `version` column on `GameDocumentPage`, a new history table that archives pre-save content, and new regular/restricted-paired mutation endpoints (create, per-page update, bulk trim, bulk version-bump). Frontend gets an opt-in "pages edit mode" on the existing `GameDocumentEdit` page, built around a reusable pages-editing component (infinite `MarkdownEditor` textarea, live page-count estimate, smart save-time splitting, and its own save saga), plus a matching entry-point/permission surface on the CharacterDocument show page. Translator adds the new UI strings across all locales.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

`data-access`/`security` have no implementation work here (they're read-only reviewers) — flag the new endpoints for their usual review pass during the fix/PR pipeline, same as any other issue touching auth/permission logic.

## Shared contracts

### New endpoints (all under `/games/:game_slug/documents/:document_id/...`)

Every mutation gets a **regular**/**restricted** pair, mirroring the existing `pages.json` (regular, 404s on a hidden document) / `pages/all.json` (restricted, DM/admin only, `X-Skip-Cache: true`) read pair already shipped:

| Action | Method | Regular path | Restricted path | Body |
|---|---|---|---|---|
| Create page | POST | `pages.json` | `pages/all.json` | `{content, order, version}` |
| Update page | PATCH | `pages/:page_id.json` | `pages/:page_id/all.json` | `{content, version}` |
| Trim excess pages | DELETE | `pages.json` | `pages/all.json` | `{keep: <int>}` |
| Batch version bump | PATCH | `pages/bump_version.json` | `pages/bump_version/all.json` | `{version, exclude_ids: [<page id>, ...]}` |

Exact URL names are backend's call within this shape — frontend just needs the four regular/restricted pairs and their bodies as specified.

- **Regular** permission: `EndpointPermission(request.user, game=game).check(request, 'game_document', 'regular', 'page_edit')` — a new `page_edit` action added to `backend/permissions/config/game_document/endpoints.yml`'s `regular` block, alongside the existing `edit`/`create` entries (`[staff, player]`, dm/admin pass automatically via the admin/dm shortcut `EndpointPermission` already applies). Queryset excludes hidden documents (404), mirroring `game_document_pages.py`.
- **Restricted** permission: reuse `check_game_edit` (`backend/games/views/common.py`) exactly as `game_document_pages_all.py` already does — no new permission config needed for this side. Queryset includes hidden documents. Response carries `X-Skip-Cache: true`.
- Frontend variant selection goes through `RequestPermissionResolvers`/`RequestStore.mutate`'s `variantName` param (per `docs/agents/issue-enhancement.md`'s documented convention), keyed off the same `can_edit` permission flag `gameDocumentPageConfig.js`'s existing `private` GET variant already uses — no new permission flag needed on the frontend side either.

### `version` field

Client-supplied, not server-computed. When entering pages edit mode, the frontend fetches the document's current full content (also learning its current `version`). The save saga's target version is `current + 1`, sent explicitly as `version` in every one of the four endpoint calls above for that save. The backend archives each touched page's *pre-save* `(content, version)` into the history table before applying the new value — the client never talks to history directly (no API surface for it in this issue).

### `GameDocumentPageListSerializer`

Gains a `version` field (already exists as a model column change, just needs adding to `fields`) — read endpoints are otherwise unaffected, so this is the only change on the existing (already-shipped) read side.

## Notes
- No `cache`/`infra`/`proxy` work: no new GET/paginated endpoints, no CI/deployment changes.
- `data-access` and `security` should review the new endpoints' permission wiring (regular hidden-document rejection, restricted `X-Skip-Cache`) during the normal fix/PR review pass — not part of this plan's implementation steps since those agents are read-only.
