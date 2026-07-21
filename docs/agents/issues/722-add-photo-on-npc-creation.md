# Issue: Add photo on NPC creation

## Description
On NPC creation (`/#/games/:game_slug/npcs/new`), users can currently only attach a photo after the NPC already exists, via a separate action on the character edit/show page. This issue adds the ability to select a photo during the creation flow itself, so the photo is uploaded automatically once the NPC is created, with a single redirect at the end.

## Problem
NPC creation and photo upload are two independent backend flows today:
- `POST /games/:game_slug/npcs.json` creates the character record.
- The photo upload flow (`POST /games/:game_slug/npcs/:id/photo_upload.json` to initiate an `Upload` + `CharacterPhoto`, then `POST /uploads/:id/submit` for the multipart file, the latter handled by `PhotoUploadHandler` in the proxy) requires an existing character id — the `CharacterPhoto` storage path and the `Upload`'s target object are only created once the character already exists (the view resolves the character first).

There is currently no way to pick a photo before the NPC exists and have it attached as part of the same creation action. In addition, the existing `PhotoUploadModal` fires the upload immediately when the user clicks Confirm, which assumes the target character (and its `photo_upload` endpoint) already exists.

## Expected Behavior
From the user's point of view:
- User goes to the NPC creation page (`/#/games/:game_slug/npcs/new`).
- User fills the NPC form.
- User clicks on upload photo on the character profile:
  - Opens the upload photo modal.
  - Chooses the photo.
  - Clicks Confirm — this does not send any request yet, it just closes the modal, keeping the photo to be sent later (the NPC does not exist yet at this point).
- User clicks Create.
- The NPC is created, then the photo is uploaded against the newly created NPC.
- User is redirected to the NPC page.

Selecting a photo stays optional — creating an NPC without one must keep working exactly as it does today.

If any individual step of the saga fails (NPC creation, or the photo upload once the NPC exists), the user stays on the page and can retry just that failed step, instead of losing progress on the steps that already succeeded.

## Solution
Recommended approach (confirmed): a client-side saga reusing the existing two-phase upload flow, with **no proxy or backend changes**. Each step of the saga is independently retryable in place on failure, rather than forcing the user to restart the whole flow:

1. On the NPC creation form, the photo picker is the existing `PhotoUploadModal`, extended with a new deferred mode: Confirm keeps the selected file in local state without firing any upload request, since no character id exists yet. This deferred mode is intentionally added to the shared modal (rather than a one-off component) so future creation flows mentioned in the original issue (treasures, etc.) can reuse it.
2. On Create, submit the NPC creation request as today (`CharacterClient.createNpc`). If this step fails, the user stays on the creation form and can retry it directly (current behavior).
3. On success, if a photo was selected, run the same init + submit sequence `PhotoUploadModalController.handleSubmit` already performs on the edit page (`UploadClient.initUpload` then `submitUpload`), targeting the newly created character's `photo_upload` endpoint. If this step fails, the NPC already exists — the user stays on the page and can retry just the photo upload, without recreating the NPC or losing the form data.
4. Redirect to the NPC page once all selected steps complete successfully.

The original issue's "Option B" (a new combined proxy `RequestHandler` for `POST /games/:game_slug/npcs` that would perform the character creation and the multipart upload in a single request) was considered but is not needed: the backend's `Upload`/`CharacterPhoto` creation already depends on the character existing first, since its storage path is derived from the character id. A single combined request would still have to sequence the same steps internally (create character → create `Upload`/`CharacterPhoto` → write the file → finalize), while additionally requiring a brand-new proxy route and handler, refactoring `PhotoUploadHandler`'s currently-private helper methods into a shared base class, and a bumped frontend timeout. It would also collapse the two steps into one request, making per-step retry (as decided above) harder rather than easier. Orchestrating the same steps on the frontend achieves the same user-facing behavior, with independent per-step retry, and no proxy or backend changes.

## Benefits
- Users can create an NPC with a photo in a single action, instead of creating it first and uploading a photo separately afterward.
- Each saga step (create NPC, upload photo) can be retried independently on failure, without losing progress on steps that already succeeded.
- No changes needed to the proxy or backend — reuses the existing `Upload` flow and `PhotoUploadModal`/`UploadClient` code as-is.
- Establishes a deferred-photo-then-create saga pattern that can be reused for other creation flows mentioned in the original issue (treasures, etc.) without proxy changes.
