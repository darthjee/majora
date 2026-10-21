# Issue: Client: photo upload wrappers

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Add photo uploads to the resource wrappers delivered by #1609 (split out of #1609 by #1598). Dependencies #1608 (core multipart support) and #1609 (wrappers) are closed.

## Problem

The client library cannot attach photos to PCs, NPCs, factions, items or documents, nor pick the main photo or delete a character photo. The upload flow is two-step and its second step does not fit the current `HttpClient` path convention (every request targets `<baseUrl>/<path>.json`, while the submit is `POST /uploads/image/<upload_id>/submit`, with no `.json`).

## Expected Behavior

- A photo can be uploaded to a PC, NPC, faction, item or document through the library.
- For families that support it (PCs, NPCs, documents), a photo can be set as main.
- A character (PC/NPC) photo can be deleted.
- Tested with the `specs/support/` fetch stub; lint passes; docs updated.

## Solution

### Routes (verified in `backend/games/urls/`)

| Family | Upload init | Set main | Delete |
|---|---|---|---|
| `pcs`, `npcs` | `POST <id>/photo_upload.json` | `PATCH <id>/photos/<photo_id>/set.json` | `DELETE <id>/photos/<photo_id>.json` (proxy `DeleteHandler`) |
| `documents` | `POST <id>/photo_upload.json` | `PATCH <id>/photos/<photo_id>/set.json` | — |
| `factions`, `items` | `POST <id>/photo_upload.json` (single photo, replaced in place) | — | — |

No family has a restricted variant for these actions (`restricted: null`); asking for one, or for an action a family lacks, throws `UsageError` locally.

### Two-step upload

1. `POST …/<id>/photo_upload.json` returns `upload_id` and `token`.
2. `POST /uploads/image/<upload_id>/submit` with the file as `multipart/form-data` (field `file`), built with native `FormData` / `Blob`, and the upload token in the `X-Upload-Token` header (checked by `backend/uploads/views.py`). See `docs/agents/architecture/proxy.md` ("Photo uploads"). The proxy answers `{"file_path": ...}`.

`HttpClient` needs a way to send a request to a path without the `.json` suffix for step 2.

### Public API

- `uploadPhoto(id, file, options)` on the `pcs`, `npcs`, `factions`, `items` and `documents` wrappers runs both steps in one call and returns the submit response (`{ file_path }`). The two steps are not exposed separately.
- `file` is a `Blob` / `File`, or a `Buffer` / `Uint8Array` with a required `filename` option (and an optional `contentType`). The library never reads the filesystem.
- The submit step uses a 120 s timeout by default, overridable with `{ timeout }`; the init step keeps the configured timeout.
- `setMainPhoto(id, photoId)` on `pcs`, `npcs` and `documents`; `deletePhoto(id, photoId)` on `pcs` and `npcs`.

### Rules

- Upload 422s come from the proxy `UploadHandler` as `{"error": "Unprocessable Entity", "reason": "<code>", ...}`; the core maps them to an `ApiError` with `codes`.
- Both `POST`s and the `PATCH` are never retried. Neither the API token nor the upload token appears in any error.
- Scopes: an upload follows the scope of its resource (an NPC photo needs `npcs:write`). The wrapper never checks scopes. Finalize enforcement is tracked by #1639; until it lands the submit step refuses scoped tokens with `403 token_not_allowed`. #1639's finalize map does not list `GameFactionPhoto`, so faction uploads stay refused for scoped tokens until #1639 covers it (raised there as a comment).
- Follow the existing wrapper shape (`docs/agents/client/library.md#resource-wrappers`): methods on the family wrapper, plain parsed JSON returned, static `variants` map.

### Docs

- `docs/agents/client/library.md` (remove photo uploads from "Not yet wrapped", document methods and variants);
- `client/README.md` (usage, "Work in progress" note);
- `docs/guides/client.md` if user-facing usage changes.

## Benefits

Automations using scoped tokens can manage character, faction, item and document photos without the web UI, completing the first set of resource wrappers of epic #1592.
