# Frontend Plan: Remove old photos urls

Main plan: [plan.md](plan.md)

## Shared contracts

Once `backend` lands its change, the API no longer returns `game.photo` or
`character.avatar_url` (not even `null`), and rejects nothing extra if a stale client sends
them (the fields are just ignored, since they're no longer declared on the request
serializers) — but this frontend change stops sending them regardless. `cover_photo_path` and
`profile_photo_path` remain the sole photo fields, unchanged in shape (string relative path or
`null`) — `CardPhoto`/`CardAvatar` already render a bundled placeholder image when given a
falsy `url`, so no new placeholder logic is needed.

## Implementation Steps

### Step 1 — Remove the legacy-field fallback in read paths

- `frontend/assets/js/components/elements/helpers/GameCardHelper.jsx` — render
  `<CardPhoto url={game.cover_photo_path} alt={game.name} />` (drop `|| game.photo`); update
  the JSDoc to drop the `game.photo` param and the "takes precedence over"/"fallback" wording.
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — same change for the
  `<CardPhoto url={game.cover_photo_path} .../>` call and its JSDoc.
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — render
  `<CardAvatar url={character.profile_photo_path} alt={character.name} />` (drop
  `|| character.avatar_url`); update the JSDoc.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — same change for the
  `<CardAvatar url={character.profile_photo_path} .../>` call and its JSDoc.

### Step 2 — Remove the game "photo URL" text input (create page)

- `frontend/assets/js/components/pages/helpers/GameNewHelper.jsx` — remove the
  `game-new-photo` `FormField` block entirely; update the `render` JSDoc param list to drop
  `photo`/`onPhotoChange`.
- `frontend/assets/js/components/pages/controllers/GameNewController.js` — stop sending
  `photo: formValues.photo` in `#performCreate`'s `createGame` payload; update the
  `submitForm` JSDoc `formValues` shape.
- `frontend/assets/js/components/pages/GameNew.jsx` — remove the `photo` state
  (`useState('')`), its setter usage in `handleSubmit`'s payload, and the
  `onPhotoChange` handler passed to `GameNewHelper.render`.

### Step 3 — Remove the game "photo URL" text input (edit page)

- `frontend/assets/js/components/pages/helpers/GameEditHelper.jsx` — remove the
  `game-edit-photo` `FormField` block (keep the existing "upload photo" button as-is); update
  the `render` JSDoc.
- `frontend/assets/js/components/pages/controllers/GameEditController.js` — stop sending
  `photo: formValues.photo` in `submitForm`'s `updateGame` payload; update its JSDoc.
- `frontend/assets/js/components/pages/GameEdit.jsx` — remove the `photo` state, the
  `setPhoto(game.photo ?? '')` seeding line, the `onPhotoChange` handler, and its entry in
  the `handleSubmit`/`GameEditHelper.render` payload.

### Step 4 — Remove the character "avatar URL" text field (PC/NPC edit pages)

- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — remove the
  `${idPrefix}-edit-avatar-url` `FormField` block (keep the existing "upload photo" button).
  The `<CardAvatar url={state.avatar_url} .../>` preview at the top of the form needs a
  replacement source now that the raw-URL field is gone — check what field
  `CharacterEdit.jsx` (Step 5) now seeds for the preview (likely the loaded character's
  `profile_photo_path`) and use that key instead of `state.avatar_url` for the `url` prop.
  Update the `render` JSDoc (`state`/`handlers` shapes) accordingly.
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js` —
  `resolveLoadedCharacter` currently seeds `fields.avatar_url` from the loaded character;
  since the update payload no longer needs `avatar_url`, drop it from both `resolveLoadedCharacter`'s
  returned `fields` and from `submitForm`'s `handleSubmit` payload (`avatar_url:
  formValues.avatarUrl`). Update `applyLoadedCharacter`'s setters param and JSDoc
  accordingly — decide whether `setAvatarUrl`/`avatarUrl` plumbing is removed entirely or
  repurposed to carry `profile_photo_path` for the preview (see Step 5's note); pick
  whichever keeps `CharacterEdit.jsx` simplest and update the JSDoc to match.
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` — remove the
  `avatarUrl`/`setAvatarUrl` state and the `onAvatarUrlChange` handler passed to
  `EditHelper.render`; remove `avatarUrl` from `submitForm`'s `formValues` argument. Ensure
  the avatar preview still renders something sensible (pass the loaded character's
  `profile_photo_path` through to the helper's `avatar_url`-equivalent prop, or drop the
  preview reliance on form state and read `character.profile_photo_path` directly from the
  `character` state already held by this component).

### Step 5 — Remove now-unused translation keys wiring (frontend side only)

Do not edit the YAML files (that's `translator`'s job — see `translator.md`), but make sure no
frontend code still references a key that `translator` is about to delete: after Steps 2-4,
`Translator.t('game_new_page.photo_label')`, `Translator.t('game_edit_page.photo_label')`,
`Translator.t('${i18nNamespace}.avatar_url_label')` (for both `npc_edit_page` and
`pc_edit_page`) should no longer appear anywhere in `frontend/assets/js` — this is a natural
side effect of Steps 2-4 removing the `FormField`s that used them, but double-check with
`grep -rn "photo_label\|avatar_url_label" frontend/assets/js` before finishing.

### Step 6 — Update/remove frontend specs

Search `frontend/specs` for any spec covering the removed inputs/props/payload fields (e.g.
specs for `GameCardHelper`, `GameHelper`, `CharacterCardHelper`, `CharacterHelper`,
`GameNewHelper`, `GameNewController`, `GameNew`, `GameEditHelper`, `GameEditController`,
`GameEdit`, `BaseCharacterEditHelper`, `BaseCharacterEditController`, `CharacterEdit`) and
update assertions/fixtures that reference `photo`/`avatar_url` to match the new behavior.

### Step 7 — Run the dev cycle

```bash
docker-compose run --rm majora_fe yarn lint
docker-compose run --rm majora_fe yarn test
```

Fix any failures before committing.

## Files to Change

- `frontend/assets/js/components/elements/helpers/GameCardHelper.jsx`
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx`
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`
- `frontend/assets/js/components/pages/helpers/GameNewHelper.jsx`
- `frontend/assets/js/components/pages/controllers/GameNewController.js`
- `frontend/assets/js/components/pages/GameNew.jsx`
- `frontend/assets/js/components/pages/helpers/GameEditHelper.jsx`
- `frontend/assets/js/components/pages/controllers/GameEditController.js`
- `frontend/assets/js/components/pages/GameEdit.jsx`
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx`
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx`
- Relevant files under `frontend/specs/` (identified in Step 6).

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: frontend lint job)
- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: frontend test job)

## Notes

- The trickiest part is the avatar/photo preview at the top of the character edit form
  (`BaseCharacterEditHelper` + `CharacterEdit.jsx`), since today it previews the *editable
  text field's* live value (`state.avatar_url`), not the persisted `profile_photo_path`. Once
  the text field is gone, the preview should show the character's current uploaded photo
  (`profile_photo_path`) instead — sourced from the `character` state already loaded in
  `CharacterEdit.jsx`, not from any form field. Keep the existing "upload photo" button/modal
  flow untouched; only the raw-URL text input and its live-typed preview go away.
- Coordinate wording with `translator.md` — do not delete the YAML keys yourself.
