# Frontend Plan: Staff should have access to NPC photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

None — `character.is_staff` and `character.is_pc` are already present on both PC and NPC character
objects returned by the API; this is purely a client-side gating change once the backend (see
[backend.md](backend.md)) allows the request.

## Implementation Steps

### Step 1 — Drop the PC-only guard on the character portrait

In `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx:38`,
change:

```jsx
canEdit={character.can_edit || character.is_player || (character.is_pc && character.is_staff)}
```

to drop the `character.is_pc &&` guard so the staff bypass applies to both PCs and NPCs:

```jsx
canEdit={character.can_edit || character.is_player || character.is_staff}
```

Update the `@param {boolean} [character.is_staff]` JSDoc comment above (currently around line 23) if
it references the PC-only behavior.

### Step 2 — Drop the PC-only guard on the photos page

In `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx:49-50`, apply
the same change to `canUploadPhoto`:

```jsx
const canUploadPhoto = character.can_edit || character.is_player || character.is_staff;
```

This component is already shared between PC and NPC photos pages (via `characterKind` prop), so no
other file needs changing for the photos page itself.

### Step 3 — Specs

- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelperSpec.js`:
  add/adjust a case asserting `canEdit` is `true` for a staff, non-player, non-owning user on an NPC
  (`is_pc: false`) — today this case is expected to assert `false`; find and update it accordingly,
  and add the missing NPC+staff+true case if none exists.
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterPhotosHelperSpec.js`
  and `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterHelper/photoSpec.js`:
  same adjustment for `canUploadPhoto`/upload-button visibility on NPCs.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterAvatarSpec.js`: check
  whether it also asserts on the `is_pc && is_staff` combination and update if so.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx` — drop `is_pc` guard on the staff bypass.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — drop `is_pc` guard on the staff bypass.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelperSpec.js` — update/add NPC+staff case.
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterPhotosHelperSpec.js` — update/add NPC+staff case.
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterHelper/photoSpec.js` — update/add NPC+staff case.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterAvatarSpec.js` — verify/update if it covers this combination.

## CI Checks

- `frontend`: `npm run coverage` (or `npm test` locally) (CI job: `jasmine`).

## Notes

- `canSetProfilePhoto` (`CharacterPhotos.jsx:91`, passed to `PhotoViewModal`) stays gated on
  `character.can_edit` only — out of scope, matching the existing PC behavior where staff can upload
  but not directly set an existing photo as the profile photo via that control.
