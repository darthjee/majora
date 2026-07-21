# Plan: Add photo on NPC creation

Issue: [722-add-photo-on-npc-creation.md](../issues/722-add-photo-on-npc-creation.md)

## Overview

Let a user pick a photo on the NPC creation page (`/#/games/:game_slug/npcs/new`)
before the NPC exists, then attach it automatically once the NPC is created —
entirely client-side, no proxy or backend changes. `CharacterAvatarField` on the
creation page switches from a static placeholder (`canEdit={false}`) to an
editable overlay that opens `PhotoUploadModal` in a new **deferred mode**: Confirm
just keeps the picked `File` in local state (and shows a local preview) instead of
firing the existing init+submit upload request, since no character id exists yet.

`GameNpcNewController.submitForm` becomes a two-step saga: create the NPC first
(as today), then — only if a photo was picked — run the same init+submit sequence
`PhotoUploadModalController.handleSubmit` already performs on the edit page,
targeting the newly created character's `photo_upload` endpoint. Each step is
independently retryable in place on failure: a failed NPC creation leaves the form
as-is (current behavior, unchanged); a failed photo upload (NPC already created)
switches the page into a small "retry/skip" state so the user can retry just the
upload or skip it and continue to the NPC page, without re-creating the NPC or
losing form data.

Two new translation keys are needed: `photo_upload_modal.confirm` (deferred mode
reuses the existing modal chrome but needs a "Confirm" label instead of "Upload")
and two `game_npc_new_page` keys for the retry/skip state.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New translation keys (translator produces, frontend consumes)

| Namespace.key | English copy | Used for |
|---|---|---|
| `photo_upload_modal.confirm` | `Confirm` | `PhotoUploadModalHelper`'s submit button label in deferred mode (vs. the existing `photo_upload_modal.submit` = `Upload` in the immediate/edit-page mode) |
| `game_npc_new_page.photo_upload_failed` | `Failed to upload the photo. The NPC was created — you can retry the upload or skip it for now.` | Shown on the NPC creation page when the deferred photo-upload saga step fails after NPC creation already succeeded |
| `game_npc_new_page.retry_photo_upload` | `Retry photo upload` | Retry button in the same failure state |
| `game_npc_new_page.skip_photo_upload` | `Skip and continue` | Secondary button letting the user proceed to the NPC page without the photo |

Frontend code calls `Translator.t('<namespace>.<key>')` exactly as it already does
elsewhere (e.g. `photo_upload_modal.submit`, `game_npc_new_page.error`) — see
`frontend.md` for exact call sites.

### No backend/proxy changes

Confirmed during issue discussion: the existing endpoints are reused as-is —
`POST /games/:slug/npcs.json` (NPC creation) and the existing photo-upload pair
(`POST /games/:slug/npcs/:id/photo_upload.json` to init, `POST /uploads/:id/submit`
to submit the multipart file). No new routes, serializer fields, or proxy handlers.
