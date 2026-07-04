# Frontend Plan: Add update of character photo

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend exposes (see [backend.md](backend.md)):
  - `PATCH /games/<slug>/pcs/<character_id>/photos/<photo_id>/set.json`
  - `PATCH /games/<slug>/npcs/<character_id>/photos/<photo_id>/set.json`
  - Body `{"roles": ["profile"]}` → `200` on success (also `200`, no-op, if `roles` doesn't
    contain `"profile"`); `401`/`403` per `CharacterEditPermission`; `404` if not found.
- `CharacterDetailSerializer` (already fetched by `CharacterClient.fetchPc`/`fetchNpc` on the
  character photos pages) now includes `profile_photo_id` (nullable integer) alongside the
  existing `profile_photo_path`. Use it to decide whether the currently viewed photo is already
  the profile photo.

## Implementation Steps

### Step 1 — Client method

In `frontend/assets/js/client/CharacterClient.js`, add a method to set a photo's roles,
following the existing `#fetchCharacter`/`#updateCharacter` private-helper pattern:

```js
setPcPhotoRoles(gameSlug, characterId, photoId, token, roles) {
  return this.#setPhotoRoles('pcs', gameSlug, characterId, photoId, token, roles);
}

setNpcPhotoRoles(gameSlug, characterId, photoId, token, roles) {
  return this.#setPhotoRoles('npcs', gameSlug, characterId, photoId, token, roles);
}

#setPhotoRoles(segment, gameSlug, characterId, photoId, token, roles) {
  return this.request(`/games/${gameSlug}/${segment}/${characterId}/photos/${photoId}/set.json`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({ roles }),
  });
}
```

### Step 2 — Extend `PhotoViewModal` / `PhotoViewModalHelper`

`PhotoViewModal` is shared across `GamePhotos` (game cover photo, not a character), and
`PcCharacterPhotos`/`NpcCharacterPhotos` (character photos). Only the latter two should ever
show the "Set as profile photo" button, so extend the component with new **optional** props that
default to "no button" when omitted (keeping `GamePhotos`'s usage unchanged):

- `canSetProfilePhoto` (boolean, default `false`) — whether the button should render at all
  (true only when the current user can edit the character).
- `isProfilePhoto` (boolean, default `false`) — whether the currently displayed photo is already
  the character's profile photo; when true, the button is disabled (or hidden — hidden is
  simpler and matches "disabled or hidden" in the issue).
- `onSetProfilePhoto` (function, optional) — handler invoked on click.

Update `PhotoViewModalHelper.render` to accept and thread through these values, rendering a
`Button` (reuse `react-bootstrap`'s `Button`, consistent with other modals in this codebase) in
`Modal.Body` beneath the image, only when `canSetProfilePhoto` is true and `isProfilePhoto` is
false.

### Step 3 — Wire up `PcCharacterPhotos` and `NpcCharacterPhotos`

In both `PcCharacterPhotos.jsx` and `NpcCharacterPhotos.jsx`:
- Pass `canSetProfilePhoto={character.can_edit}` to `PhotoViewModal`.
- Pass `isProfilePhoto={selectedPhoto?.id === character.profile_photo_id}`.
- Pass `onSetProfilePhoto={() => handleSetProfilePhoto(selectedPhoto.id)}`, where
  `handleSetProfilePhoto` calls `characterClient.setPcPhotoRoles(gameSlug, characterId,
  photoId, AuthStorage.getToken(), ['profile'])` (or `setNpcPhotoRoles` for the NPC page), and
  on success re-fetches the character (`controller`'s existing character-fetch effect, or a new
  small controller method) so `character.profile_photo_id` reflects the change and the button
  updates/disables immediately. On failure, leave state untouched (no error UI required by the
  issue, but do not silently throw — swallow via `.catch(() => {})` at minimum, matching this
  codebase's existing lightweight error handling for secondary actions).
- Do **not** touch `GamePhotos.jsx` — leave its `PhotoViewModal` usage as-is, relying on the new
  props' defaults.

### Step 4 — Specs

- `frontend/specs/assets/js/components/elements/helpers/PhotoViewModalHelperSpec.js` — add cases
  for: button renders when `canSetProfilePhoto` is true and `isProfilePhoto` is false; button
  absent when `canSetProfilePhoto` is false; button absent/disabled when `isProfilePhoto` is
  true; clicking the button invokes `onSetProfilePhoto`; existing `GamePhotos`-style call with no
  new props still renders with no button (backwards compatibility).
- `frontend/specs/assets/js/client/CharacterClientSpec.js` (or equivalent) — add cases for
  `setPcPhotoRoles`/`setNpcPhotoRoles` verifying method, URL, headers, and body.
- `frontend/specs/assets/js/components/pages/PcCharacterPhotosSpec.js` and the NPC equivalent —
  add a case that selecting a photo and clicking "Set as profile photo" calls the client method
  with the right ids/roles and refreshes character state.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add `setPcPhotoRoles`/`setNpcPhotoRoles`
- `frontend/assets/js/components/elements/PhotoViewModal.jsx` — thread new optional props
- `frontend/assets/js/components/elements/helpers/PhotoViewModalHelper.jsx` — render the button
- `frontend/assets/js/components/pages/PcCharacterPhotos.jsx` — wire up the new props/handler
- `frontend/assets/js/components/pages/NpcCharacterPhotos.jsx` — wire up the new props/handler
- `frontend/specs/assets/js/components/elements/helpers/PhotoViewModalHelperSpec.js` — new cases
- `frontend/specs/assets/js/client/CharacterClientSpec.js` — new cases (adjust path/name if the
  actual spec file differs)
- `frontend/specs/assets/js/components/pages/PcCharacterPhotosSpec.js` /
  `NpcCharacterPhotosSpec.js` — new cases

## CI Checks

- `frontend`: `docker-compose run majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- Add an i18n key for the button label (e.g. `photos.setProfilePhoto` or similar, matching
  existing key naming under `frontend/assets/i18n/*.yaml`) — this touches translation files, so
  if the `frontend` agent isn't confident about key-parity conventions, hand this specific
  sub-step to the `translator` agent rather than guessing at the YAML structure.
- Keep `GamePhotos.jsx` fully untouched — it must keep working with `PhotoViewModal` exactly as
  it calls it today, since the new props all default to "button absent."
