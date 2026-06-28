# Add backend endpoint to finalize photo upload

## Context

The game photo upload flow (#127) requires a backend endpoint that the proxy calls internally during file transfer to advance the upload lifecycle. The `Upload` model currently lacks a link to its target object, making it impossible to check game edit permissions or mark the associated object (e.g. `GamePhoto`) as ready. Extending `Upload` with a generic foreign key and adding a `PATCH /uploads/:id.json` endpoint completes the backend side of this state machine.

## What needs to be done

**Backend — extend `Upload` model (migration required):**
- Add `content_type: ForeignKey(ContentType, on_delete=CASCADE)` — identifies the model class of the connected object
- Add `object_id: PositiveIntegerField` — the id of the connected object
- Add `content_object: GenericForeignKey('content_type', 'object_id')` — accessor for the connected object (e.g. `GamePhoto`)

**Backend — new view `PATCH /uploads/:id.json`:**
- Authenticate the user via `TokenAuthentication` (regular user token)
- Read `X-Upload-Token` from `request.META.get('HTTP_X_UPLOAD_TOKEN')`
- Validate: upload token matches `Upload.token`, user matches `Upload.user`, upload not expired, upload not already `uploaded`, user can edit the game via `upload.content_object.game` + `GameEditPermission`
- Update `Upload.status` to the requested value (`uploading` or `uploaded`)
- On `uploading`: return 200 with `{ file_path }`
- On `uploaded`: set `upload.content_object.ready = True` and return 200
- Register URL as `uploads/<int:upload_id>.json` in `source/games/urls.py`

## Acceptance criteria

- [ ] `Upload` model has `content_type`, `object_id`, and `content_object` generic FK fields, with a corresponding migration
- [ ] `PATCH /uploads/:id.json` returns 404 when the upload does not exist
- [ ] `PATCH /uploads/:id.json` returns 403 when the upload token does not match
- [ ] `PATCH /uploads/:id.json` returns 403 when the authenticated user does not own the upload
- [ ] `PATCH /uploads/:id.json` returns 403 when the upload has expired
- [ ] `PATCH /uploads/:id.json` returns 403 when the upload is already in `uploaded` status
- [ ] `PATCH /uploads/:id.json` returns 403 when the user does not have edit permission for the associated game
- [ ] On `status: uploading`, returns 200 with `{ file_path }`
- [ ] On `status: uploaded`, sets `content_object.ready = True` and returns 200

Tags: :construction:
