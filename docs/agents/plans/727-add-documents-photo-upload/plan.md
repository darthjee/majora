# Plan: Add documents photo upload

Issue: [727-add-documents-photo-upload.md](../../issues/727-add-documents-photo-upload.md)

## Overview

Wire up photo storage/upload/display for `GameDocument`, mirroring the existing PC/NPC
character-photo feature (multiple stored photos, one designated as the display photo) rather
than `GameItem`'s single-always-replace model — the schema already supports it, since
`GameDocumentPhoto` already exists with `related_name='photos'` on `GameDocument`, and the
`GameDocumentPhotoSerializer` already exists too. The backend adds three new endpoints (list,
upload-init, set-display) and a new permission class; the frontend adds `Edit`/`New` variants to
the existing `DocumentPhoto` element (mirroring `ItemPhoto`), wires the shared
`PhotoUploadModal` into the existing show page and the new creation flow, and adds a new,
photo-upload-only `/documents/:id/edit` page since no general document edit page/endpoint
exists yet.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### New endpoints (backend produces, frontend consumes)

| Endpoint | Method | Auth | Request | Response |
|---|---|---|---|---|
| `/games/<game_slug>/documents/<document_id>/photos.json` | GET | AllowAny (hidden-gated like Character's `check_hidden=True`) | — | Paginated `GameDocumentPhotoSerializer` list (`id`, `path`) of `ready=True` photos |
| `/games/<game_slug>/documents/<document_id>/photo_upload.json` | POST | IsAuthenticated + `GameDocumentPhotoUploadPermission` | `PhotoUploadSerializer` shape (`filename`) | `201` `{upload_id, token, document_id}` |
| `/games/<game_slug>/documents/<document_id>/photos/<photo_id>/set.json` | PATCH | IsAuthenticated + `GameDocumentPhotoUploadPermission` | `{"roles": ["display"]}` | `200`, empty body |

No new migration is needed — `GameDocumentPhoto` (`backend/games/models/game/game_document_photo.py`)
and `GameDocumentPhotoSerializer` (`backend/games/serializers/games/documents/game_document_photo.py`)
already exist; only the view/URL/permission layer is missing.

### Permission (flat across list/upload/set, no per-action tiering)

New `GameDocumentPhotoUploadPermission` in `backend/games/permissions.py`, mirroring
`GameItemPhotoUploadPermission` exactly:

```python
class GameDocumentPhotoUploadPermission(_EditPermission):
    @classmethod
    def check(cls, request, game):
        return cls._guarded_check(request, lambda: cls._is_allowed(request.user, game))

    @classmethod
    def _is_allowed(cls, user, game):
        return user.is_staff or game.has_player(user) or game.can_be_edited_by(user)
```

Frontend gating mirrors `GameItemController`'s existing pattern exactly (no new permission flag
needed on `GamePermissionsSerializer`): `canUploadPhoto` is derived from
`AccessStore.ensureGameAccess(gameSlug)` → `Boolean(access.is_superuser || access.is_staff ||
access.is_dm || access.is_player)`.

### `documentConfig.js` — new `POST.single` entry (frontend depends on this path shape)

```js
const photoUploadInit = {
  path: ({ gameSlug, id }) => `/games/${gameSlug}/documents/${id}/photo_upload.json`,
  permission: null,
};
// added under POST: { single: { regular: photoUploadInit, private: photoUploadInit } }
```

The `GET .../photos.json` list endpoint and the `PATCH .../set.json` endpoint have **no**
frontend consumer in this issue (no document-photos browsing page — out of scope), so no
`resourceConfig`/`documentConfig` entries are needed for them; they exist purely as the backend
API surface the issue explicitly asks for, exercised only by backend tests. The upload modal
always uploads a brand-new photo; "first upload becomes the display photo" is applied
server-side (mirroring `_set_profile_photo_if_unset`), so the frontend never needs to call the
`set` endpoint itself in this issue.
