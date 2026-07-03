# Frontend Plan: Add photos to characters

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on the backend producing (see [plan.md](plan.md)):
- `profile_photo_path` (string or `null`) on every character payload returned by
  `GET /games/<slug>/pcs.json`, `GET /games/<slug>/npcs.json`,
  `GET /games/<slug>/pcs/<id>.json`, `GET /games/<slug>/npcs/<id>.json`, and their
  `/full.json` variants.

This agent does not call any new upload endpoint — no upload UI is wired in this issue (see
"Shared contracts" in [plan.md](plan.md) for why). Scope here is limited to display
precedence: prefer `profile_photo_path` over `avatar_url`, same pattern as
`cover_photo_path` vs `photo` on `Game` (see `GameCardHelper.jsx` / `GameHelper.jsx`, changed
in issue #254).

## Implementation Steps

### Step 1 — `CharacterCardHelper.jsx`

In `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`, change:
```jsx
<CardAvatar url={character.avatar_url} alt={character.name} />
```
to:
```jsx
<CardAvatar url={character.profile_photo_path || character.avatar_url} alt={character.name} />
```
Update the JSDoc `@param` block to document `character.profile_photo_path` (optional,
nullable, takes precedence over `avatar_url`) alongside the existing `avatar_url` param,
mirroring the JSDoc change made to `GameCardHelper.jsx` in issue #254.

### Step 2 — `CharacterHelper.jsx`

In `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`, change:
```jsx
<CardAvatar url={character.avatar_url} alt={character.name} />
```
to:
```jsx
<CardAvatar url={character.profile_photo_path || character.avatar_url} alt={character.name} />
```
Update the JSDoc `@param` block the same way as Step 1, mirroring the `GameHelper.jsx` change
in issue #254.

### Step 3 — Specs

- `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js` — add a
  test "prefers profile_photo_path over avatar_url when both are provided", mirroring the
  `GameCardHelperSpec.js` case added in issue #254 (assert the rendered HTML contains the
  `profile_photo_path` value and does not contain the `avatar_url` value).
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` — add the
  equivalent case, mirroring the `GameHelperSpec.js` change in issue #254.

### Step 4 — Local verification

Run inside the container (never on the host):
```bash
docker-compose run --rm majora_fe yarn test
docker-compose run --rm majora_fe yarn lint
```

## Files to Change

- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — prefer
  `profile_photo_path`
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — prefer
  `profile_photo_path`
- `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js` — new spec
  case
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` — new spec case

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- `character.photos` (the gallery, rendered via `CharacterPhotos.jsx`) is unaffected by this
  plan on the frontend side: it already renders `photo.url`, and after the backend change
  `CharacterPhotoSerializer` (like `GamePhotoSerializer` since #254) no longer returns `url`.
  This is a pre-existing gap carried over unchanged from `GamePhoto`/issue #254 — fixing the
  gallery display is out of scope for this issue, exactly as it was out of scope for #254.
