# Frontend Plan: Unify photo url

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the backend's renamed API fields:
- `Game.photo_path` (was `cover_photo_path`)
- `Character.photo_path` (was `profile_photo_path`)

Behavior/nullability is unchanged — only the key name in the JSON response changes. Land this after (or together with) the backend change, since it depends on the new field names being present in responses.

## Implementation Steps

### Step 1 — Simplify the list-item `photoUrl` getters

`BaseListItem.photoUrl` (`assets/js/components/common/list_types/BaseListItem.js:23-25`) already reads `this.data.photo_path`. Once the backend rename lands, the following subclass overrides become redundant and should be deleted so they fall back to the base getter:
- `GameListItem.js:14-16` (`cover_photo_path`)
- `MyGameListItem.js:15-17` (`data.game.cover_photo_path`)
- `NpcListItem.js:19-21` (`profile_photo_path`)
- `PcListItem.js:15-17` (`profile_photo_path`)

Remove the override methods and their explanatory comments (the ones noting "games/characters have no `photo_path` field") since that's no longer true.

### Step 2 — Rename remaining literal field references

Update the literal `cover_photo_path` / `profile_photo_path` string usages (object keys, destructured props, JSDoc `@param` types) to `photo_path` in:
- `assets/js/components/resources/game/pages/GameEdit.jsx:66`
- `assets/js/components/resources/game/pages/elements/show/GameCoverPhoto.jsx:12,20`
- `assets/js/components/resources/game/pages/helpers/GameHelper.jsx:18`
- `assets/js/components/resources/game/pages/helpers/GameEditHelper.jsx:11`
- `assets/js/components/resources/character/pages/GameNpcNew.jsx:87`
- `assets/js/components/resources/character/pages/shared/CharacterEdit.jsx:136`
- `assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx:25,32`
- `assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx:17,44`
- `assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx:23`
- `assets/js/components/resources/character/pages/helpers/PcCharacterEditHelper.jsx:11`
- `assets/js/components/resources/character/pages/helpers/NpcCharacterEditHelper.jsx:11`
- `assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx:14,28`
- `assets/js/components/common/cards/CharacterPreviewCard.jsx:11`
- `assets/js/components/common/cards/helpers/CharacterPreviewCardHelper.jsx:19,50`

### Step 3 — Update specs and factories

Update mock/fixture data and assertions in:
- `specs/assets/js/components/common/cards/helpers/CharacterPreviewCardHelperSpec.js`
- `specs/assets/js/components/common/list_types/GameListItemSpec.js`
- `specs/assets/js/components/common/list_types/listTypeConfig/myGamesSpec.js`
- `specs/assets/js/components/common/list_types/MyGameListItemSpec.js`
- `specs/assets/js/components/common/list_types/NpcListItemSpec.js`
- `specs/assets/js/components/common/list_types/PcListItemSpec.js`
- `specs/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelperSpec.js`
- `specs/assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlotSpec.js`
- `specs/assets/js/components/resources/character/pages/helpers/CharacterEditHelperSpec.js`
- `specs/assets/js/components/resources/character/pages/helpers/CharacterHelper/photoSpec.js`
- `specs/assets/js/components/resources/character/pages/helpers/GameNpcNewHelperSpec.js`
- `specs/assets/js/components/resources/character/pages/shared/CharacterEditSpec.js`
- `specs/assets/js/components/resources/game/pages/elements/show/GameCoverPhotoSpec.js`
- `specs/assets/js/components/resources/game/pages/helpers/GameEditHelperSpec.js`
- `specs/assets/js/components/resources/game/pages/helpers/GameHelper/coverPhotoAndUploadSpec.js`
- `specs/assets/js/components/resources/game/pages/helpers/GameHelper/support.js`
- `specs/support/factories.js`

Since `GameListItem`/`MyGameListItem`/`NpcListItem`/`PcListItem` lose their `photoUrl` override, also check whether any spec asserted on that override behavior directly (as opposed to just supplying fixture data) and adjust the assertion to exercise the inherited `BaseListItem.photoUrl` instead.

### Step 4 — Sanity sweep

Re-run `grep -rn "cover_photo_path\|profile_photo_path" frontend/` to confirm nothing was missed.

## Files to Change

See the file lists in Steps 1–3 above.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No behavior change is expected anywhere in this plan — this is a pure rename. If any spec fails after the rename, treat it as a signal the rename missed a spot rather than adjusting expected behavior.
