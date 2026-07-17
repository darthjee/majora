# Frontend Plan: Allow players and staff to upload PC photos

Main plan: [plan.md](plan.md)

## Shared contracts

- Consume existing access fields — `is_player` and `is_staff` (from
  `/games/:game_slug/pcs/:id/access.json`, already exposed by `BaseAccessSerializer`) and
  `can_edit` (from `/permissions.json`) — to decide whether the photo-upload affordance is
  shown for a PC. No new backend fields are introduced; nothing to wait on from the backend
  agent besides the endpoint itself now accepting these requests (already true via
  `is_player`/`can_edit` combinations it already fetches for other purposes).
- This is upload-eligibility only. Do not widen `can_edit` itself, and do not widen
  "set as profile photo" eligibility (`canSetProfilePhoto`) — that stays exactly
  `character.can_edit`, unaffected by this issue.
- The `is_staff` bonus applies to PCs only in this issue — do not extend it to NPC upload
  gating.

## Implementation Steps

### Step 1 — Character detail page (`/#/games/:game_slug/pcs/:id`)

`frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx`
(line 35):

```jsx
canEdit={character.can_edit || (!character.is_pc && character.is_player)}
```

Change to also grant upload access to any player of the game when it *is* a PC, and to
staff users for PCs specifically:

```jsx
canEdit={character.can_edit || character.is_player || (character.is_pc && character.is_staff)}
```

(`character.is_player` alone now covers both PC and NPC — dropping the `!character.is_pc`
guard is safe because NPC behavior is unchanged: NPCs already got the `is_player` bonus,
and the added `is_staff` branch is explicitly gated to `character.is_pc` so NPC upload
eligibility doesn't change.)

Update the JSDoc on `character.is_player` (lines 19-21) since the "only widens NPC" claim
is no longer accurate, and add a `character.is_staff` param doc entry.

`character.is_staff` must be available on the merged character object for this to work.
In `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js`,
`#mergeAccess` (around line 156-170) currently merges `can_edit`, `is_player`, and
`access_resolved` from the access/permissions stores, but not `is_staff`. Add
`is_staff: access.is_staff` to the merged object.

### Step 2 — PC photos listing page (`/#/games/:game_slug/pcs/:id/photos`)

`BaseCharacterPhotosController.js`'s `#mergeAccess` (around line 113-121) currently only
fetches `AccessStore.ensureCharacterPermissions` (for `can_edit`) — it never fetches
`AccessStore.ensureCharacterAccess`, so `is_player`/`is_staff` aren't available on this page
today. Add the access fetch alongside the permissions fetch and merge `is_player` and
`is_staff` onto the character object too (same pattern
`CharacterController.js#mergeAccess` already uses).

In `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx`,
the single `character.can_edit` value passed into `PhotosHelper.render(...)` (around line
68) currently drives three things: the upload button, `canSetProfilePhoto` per photo card,
and `canSetProfilePhoto` on `PhotoViewModal`. Only the upload button should widen. Compute a
separate value, e.g.:

```js
const canUploadPhoto = character.can_edit || character.is_player
  || (character.is_pc && character.is_staff);
```

and pass `canUploadPhoto` as the upload-button-gating argument to `PhotosHelper.render(...)`
while leaving `character.can_edit` as-is for `canSetProfilePhoto` in both
`PhotoCard`/`PhotoViewModal` call sites. This requires threading a second boolean through
`BaseCharacterPhotosHelper.render(...)` (currently a single `canEdit` param used for both
purposes at `BaseCharacterPhotosHelper.jsx` lines 47-77) — split it into
`canUploadPhoto`/`canSetProfilePhoto` params, updating the JSDoc and the
`#renderUploadButton`/`PhotoCard` call sites accordingly. `NpcCharacterPhotosHelper`/
`PcCharacterPhotosHelper` share this same base class — verify the NPC photos page
(`character.is_pc` false there) keeps its current behavior (`canUploadPhoto` reduces to
`character.can_edit || character.is_player`, same as today, since the `is_staff` branch is
gated to `character.is_pc`).

`character.is_pc` must also be present on the object returned by `#fetchCharacter` in
`BaseCharacterPhotosController.js` for the `character.is_pc && character.is_staff` check to
work — confirm the character detail payload already includes `is_pc` (it should, since
`CharacterAvatarHelper` already relies on it); if not, no extra fetch is needed since it's
part of the base character resource, not the access/permissions endpoints.

### Step 3 — Update specs

Update Jasmine specs mirroring the changed files under `frontend/specs/`:
- `CharacterAvatarHelper` spec — add cases for a PC with `is_player` only, and a PC with
  `is_staff` only (both should render an editable overlay); confirm NPC behavior with
  `is_staff` true but not a player still does *not* get the upload affordance (unaffected
  by this change).
- `BaseCharacterPhotosHelper` spec — add coverage for the split
  `canUploadPhoto`/`canSetProfilePhoto` params (e.g. upload button visible while profile-set
  action stays hidden, and vice versa).
- `CharacterController` / `BaseCharacterPhotosController` specs — assert `is_staff` (and,
  for the photos controller, `is_player`) are now merged onto the character state.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx`
  — broaden PC `canEdit` (upload) condition; update JSDoc.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js`
  — merge `is_staff` from access data.
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterPhotosController.js`
  — also fetch `AccessStore.ensureCharacterAccess`; merge `is_player`/`is_staff`.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx`
  — compute and pass a separate `canUploadPhoto` value.
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterPhotosHelper.jsx`
  — split the single `canEdit` param into `canUploadPhoto`/`canSetProfilePhoto`.
- Corresponding spec files under `frontend/specs/` mirroring the paths above.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)

## Notes

- `CharacterEdit.jsx` (the PC/NPC edit page) already gates page access on
  `character.can_edit || character.is_player` and renders `CharacterAvatarField` with an
  always-true default `canEdit` — so any player of the game reaching that page already sees
  an (now functionally correct, post-backend-change) upload affordance. It does not check
  `is_staff`, so a staff user who is not otherwise a player/DM of that specific game still
  can't reach the Edit page to use its avatar upload widget. The issue only names the
  character detail route (`/#/games/:game_slug/pcs/:id`), not the Edit page, so this is left
  as-is — flag to the architect/requester as a possible follow-up if staff should also reach
  the Edit page's avatar upload affordance.
