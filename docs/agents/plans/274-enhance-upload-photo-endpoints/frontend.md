# Frontend Plan: Enhance Upload Photo Endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

The backend agent is changing the photo-upload init response shape for all three endpoints (game, PC, NPC) from `{"id": <int>, "token": "<str>"}` to `{"upload_id": <int>, "token": "<str>", "game_id"|"character_id": <int>}`. This agent only needs `upload_id` and `token` from that response; `game_id`/`character_id` are not consumed today.

## Implementation Steps

### Step 1 — Update PhotoUploadModalController to read `upload_id`
In `frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js`, `handleSubmit` currently does:
```js
const { id, token: uploadToken } = await initResponse.json();
const submitResponse = await this.client.submitUpload(id, uploadToken, file);
```
Change the destructure to read `upload_id` instead of `id` (e.g. `const { upload_id: uploadId, token: uploadToken } = await initResponse.json();`) and pass `uploadId` to `submitUpload` in place of `id`.

### Step 2 — Update the Jasmine spec
In `frontend/specs/assets/js/components/elements/controllers/PhotoUploadModalControllerSpec.js`, update any mocked `initUpload`/`initResponse.json()` return values from `{ id: ..., token: ... }` to `{ upload_id: ..., token: ... }`, and update any assertion on `submitUpload` being called with the old `id` value to use the same value under the new key.

## Files to Change
- `frontend/assets/js/components/elements/controllers/PhotoUploadModalController.js` — destructure `upload_id` instead of `id`.
- `frontend/specs/assets/js/components/elements/controllers/PhotoUploadModalControllerSpec.js` — update mocked response shape and assertions.

## CI Checks
- `frontend`: `docker-compose run majora_fe npm run coverage` (CI job: `jasmine`)

## Notes
- No change needed to `UploadClient.js` itself — `submitUpload`'s first parameter is just renamed conceptually (upload id), its call signature is unchanged.
- Double-check no other frontend file (e.g. a page component passing `onSuccess`) reads the init response's `id`/`game_id`/`character_id` directly; per the issue, no current caller needs the new fields.
