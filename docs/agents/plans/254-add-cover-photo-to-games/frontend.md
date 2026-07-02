# Frontend Plan: Add cover photo to games

Main plan: [plan.md](plan.md)

## Shared contracts

- `GameListSerializer` and `GameDetailSerializer` (backend) both gain a
  read-only field `cover_photo_path`: `string | null`. It equals
  `game.cover_photo.path` when the game has a cover photo, else `null`. It is
  additive — the existing `photo` field on both endpoints keeps working
  exactly as before, so the frontend must fall back to it when
  `cover_photo_path` is absent/null.

## Implementation Steps

### Step 1 — Prefer `cover_photo_path` in the game card

In `frontend/assets/js/components/elements/helpers/GameCardHelper.jsx`,
change the `CardPhoto` `url` prop from `game.photo` to
`game.cover_photo_path || game.photo`. Update the JSDoc `@param` block to
document the new optional `game.cover_photo_path` field alongside the
existing `game.photo` one.

### Step 2 — Prefer `cover_photo_path` in the game detail page

In `frontend/assets/js/components/pages/helpers/GameHelper.jsx`, apply the
same change to the `CardPhoto` `url` prop (currently `game.photo`, becomes
`game.cover_photo_path || game.photo`). Update the JSDoc `@param` block the
same way.

Do not touch any other usage of `game.photo` in this file or elsewhere
(e.g. the game edit form keeps using `game.photo` directly, per the issue).

### Step 3 — Update/add specs

In `frontend/specs/assets/js/components/elements/helpers/GameCardHelperSpec.js`:
- Add a test asserting that when `game.cover_photo_path` is set, its value
  is rendered as the `<img>` src, taking precedence over `game.photo` (e.g.
  set both fields to different URLs and assert only the
  `cover_photo_path` one appears).
- Add a test asserting the existing fallback still works: when
  `cover_photo_path` is null/absent and `photo` is set, `photo`'s value is
  rendered (this is effectively the existing "renders an image when photo
  is provided" test — keep it, since `game` in that spec has no
  `cover_photo_path`, so it exercises the fallback branch already; just
  confirm this reasoning holds once the code changes, no need to duplicate).

Apply the equivalent two additions to
`frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js`
(currently `game.photo` is `null` by default in that spec's shared `game`
fixture, so the fallback path is already implicitly covered — add only the
"prefers cover_photo_path over photo" case).

### Step 4 — Run the full frontend suite and checks

```bash
docker-compose run vite_majora npm run coverage
docker-compose run vite_majora npm run lint
```

(confirm exact service name via `docker-compose.yml` / the `jasmine` and
`frontend-checks` jobs in `.circleci/config.yml` before running — the
commands there run from a merged `frontend/` + repo root context, so if
`npm run coverage`/`npm run lint` fail to find files when run directly from
`frontend/`, mirror however the existing local dev workflow documented in
`docs/agents/architecture.md` or `README.md` invokes them instead.)

## Files to Change
- `frontend/assets/js/components/elements/helpers/GameCardHelper.jsx` — use `game.cover_photo_path || game.photo` as the `CardPhoto` url.
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — use `game.cover_photo_path || game.photo` as the `CardPhoto` url.
- `frontend/specs/assets/js/components/elements/helpers/GameCardHelperSpec.js` — add coverage for the `cover_photo_path` precedence.
- `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` — add coverage for the `cover_photo_path` precedence.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No new component is introduced — `CardPhoto` itself is unchanged; only the
  value passed into its existing `url` prop changes at the two call sites.
- This depends on the backend agent's `cover_photo_path` field existing on
  both the game list and game detail JSON responses; no frontend API client
  changes are needed since both endpoints are already consumed as plain JSON
  objects passed straight through as `game`.
