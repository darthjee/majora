# Frontend Plan: Add photo index pages for games and characters

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes three new backend endpoints (paginated, `AllowAny`):
  `/games/:slug/photos.json`, `/games/:slug/pcs/:id/photos.json`,
  `/games/:slug/npcs/:id/photos.json`. Each photo item is
  `{ id, path }`; use `photo.path` directly as an `<img src>`, exactly like
  `cover_photo_path`/`profile_photo_path` are used elsewhere (`GameCardHelper.jsx`,
  `CharacterCardHelper.jsx`).
- Adds three new hash routes/page keys: `gamePhotos`, `pcCharacterPhotos`,
  `npcCharacterPhotos` (paths given in `plan.md`).
- Reuses the existing upload endpoints/paths already wired in
  `Game.jsx`/`PcCharacter.jsx`/`NpcCharacter.jsx` — no new upload endpoint.
- Needs new translation keys from the `translator` agent (see `translator.md`
  for the exact key names) — reference them via `Translator.t('<key>')`
  following the existing convention; do not hardcode English strings.

## Implementation Steps

### Step 1 — Register the new routes

In `frontend/assets/js/utils/HashRouteResolver.js`, add (ordered before the
existing, less-specific `:character_id`/`:character_id/edit` routes so the
router's first-match-wins resolution doesn't swallow `/photos` into
`pcCharacter`/`npcCharacter`):
```
this.#router.register('/games/:game_slug/pcs/:character_id/photos', 'pcCharacterPhotos');
this.#router.register('/games/:game_slug/npcs/:character_id/photos', 'npcCharacterPhotos');
this.#router.register('/games/:game_slug/photos', 'gamePhotos');
```
Check `Router`'s matching order/specificity rules (`frontend/assets/js/utils/Router.js`)
before finalizing placement — mirror how `edit` variants are already ordered
ahead of their non-edit counterparts.

In `frontend/assets/js/components/helpers/AppHelper.jsx`, import and add the
three new page components (`GamePhotos`, `PcCharacterPhotos`,
`NpcCharacterPhotos`) to the `PAGES` map under the matching keys.

### Step 2 — `PhotoCard` element (mirrors `TreasureCard`/`TreasureCardHelper`)

- `frontend/assets/js/components/elements/PhotoCard.jsx` — thin wrapper
  delegating to `PhotoCardHelper.render(photo, onClick)`.
- `frontend/assets/js/components/elements/helpers/PhotoCardHelper.jsx` —
  renders a Bootstrap card (same grid classes as `TreasureCardHelper`:
  `col-6 col-sm-4 col-md-3 col-lg-2 mb-4`) using the existing `CardPhoto`
  element for the thumbnail (`<CardPhoto url={photo.path} alt={alt} />`), but
  wrapped in a `<button>`/clickable `<div>` calling `onClick(photo)` instead
  of an `<a>` navigating away (per the issue: clicking opens a modal, it does
  not navigate).

### Step 3 — `PhotoViewModal` lightbox

- `frontend/assets/js/components/elements/PhotoViewModal.jsx` +
  `helpers/PhotoViewModalHelper.jsx`, following the same
  component/helper split and `react-bootstrap` `Modal` usage as
  `PhotoUploadModal.jsx`/`PhotoUploadModalHelper.jsx`. Props:
  `{ show, photo, alt, onClose }`. Body renders a single full-size
  `<img src={photo?.path} alt={alt} className="img-fluid" />` with no footer
  actions beyond a close button. No controller needed — this component has
  no async logic, just show/hide state owned by the parent page.

### Step 4 — Three page components (mirrors `GameTreasures.jsx` trio)

For each of the three pages, add a `<Name>.jsx` + `controllers/<Name>Controller.js`
+ `helpers/<Name>Helper.jsx` trio:

- `GamePhotos.jsx` / `GamePhotosController.js` / `GamePhotosHelper.jsx` —
  copy the `GameTreasures`/`GameTreasuresController`/`GameTreasuresHelper`
  shape exactly, swapping the endpoint to `/games/${gameSlug}/photos.json`,
  the card to `PhotoCard`, and adding local `showViewModal`/`selectedPhoto`
  state (in the page component, not the controller — same split
  responsibility as `showUploadModal` in `Game.jsx`) to drive
  `PhotoViewModal`. Also render the upload button (only when `can_edit`) and
  `PhotoUploadModal` wired to `POST /games/${gameSlug}/photo_upload.json` —
  `can_edit` isn't present on the photos endpoint response itself, so fetch
  it the same way `GameController.#mergeAccess` does (via `GameClient.fetchGameAccess`),
  or simplest: reuse `GameController`'s pattern by having `GamePhotosController`
  also fetch `/games/${gameSlug}.json` merged with access to get
  `can_edit`/`game_slug`, since the photos list endpoint has no such field.
- `PcCharacterPhotos.jsx` / controller / helper and
  `NpcCharacterPhotos.jsx` / controller / helper — same shape, fetching
  `/games/${gameSlug}/pcs/${id}/photos.json` /
  `/games/${gameSlug}/npcs/${id}/photos.json`, uploading to the existing
  `/games/${gameSlug}/pcs/${id}/photo_upload.json` /
  `.../npcs/${id}/photo_upload.json`, and getting `can_edit` from the
  existing character detail endpoint (mirrors `PcCharacterController`'s
  fetch of `/games/${gameSlug}/pcs/${character_id}.json`).
- Each `<Name>Helper.render` renders: a `BackButton`/`PageActions` back to
  the owning game/character page, an upload button (only when `can_edit`,
  opening `PhotoUploadModal` — same pattern as `PhotoUploadOverlay`'s
  `onClick={handlers.onOpenUploadModal}` in `GameHelper.jsx`), the `PhotoCard`
  grid inside a `.row`, the `Pagination` component, and the `PhotoViewModal`
  driven by the page's local state.

### Step 5 — Replace the inline gallery with a "see all photos" link

- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — remove the
  `<CharacterPhotos photos={game.photos} alt={game.name} />` line and the
  now-unused `CharacterPhotos` import; add a "see all photos" link
  (`<a href={`#/games/${game.game_slug}/photos`}>`) near the existing
  treasures link, using a new translation key (see `translator.md`).
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — same
  change: remove `<CharacterPhotos photos={character.photos} .../>` and its
  import, add a "see all photos" link to
  `#/games/${character.game_slug}/${segment}/${character.id}/photos`
  (reuse the existing `segment` local var already computed for the edit
  link).
- Delete the now-dead `CharacterPhotos.jsx`, `CharacterPhoto.jsx` elements
  and their specs (`specs/.../CharacterPhotosSpec.js`,
  `specs/.../CharacterPhotoSpec.js`) — confirm with a repo-wide grep that
  nothing else references them before deleting.
- The backend detail serializers' `photos` field (now carrying a real
  `path`) is no longer consumed by the show pages after this change, but
  keep it — the issue's Solution section doesn't ask to remove it from the
  API, only to stop rendering the broken gallery inline.

### Step 6 — Specs

Add Jasmine specs for every new file (component, helper, controller),
following the existing naming/location convention
(`specs/assets/js/components/...`), mirroring the `GameTreasures`* specs for
structure. Update `GameHelperSpec.jsx`/`CharacterHelperSpec.jsx` (or
equivalent) to assert the new link renders and the old gallery no longer
does.

## Files to Change

- `frontend/assets/js/utils/HashRouteResolver.js` — register 3 new routes
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register 3 new page keys
- `frontend/assets/js/components/elements/PhotoCard.jsx` — new
- `frontend/assets/js/components/elements/helpers/PhotoCardHelper.jsx` — new
- `frontend/assets/js/components/elements/PhotoViewModal.jsx` — new
- `frontend/assets/js/components/elements/helpers/PhotoViewModalHelper.jsx` — new
- `frontend/assets/js/components/pages/GamePhotos.jsx` — new
- `frontend/assets/js/components/pages/controllers/GamePhotosController.js` — new
- `frontend/assets/js/components/pages/helpers/GamePhotosHelper.jsx` — new
- `frontend/assets/js/components/pages/PcCharacterPhotos.jsx` — new
- `frontend/assets/js/components/pages/controllers/PcCharacterPhotosController.js` — new
- `frontend/assets/js/components/pages/helpers/PcCharacterPhotosHelper.jsx` — new
- `frontend/assets/js/components/pages/NpcCharacterPhotos.jsx` — new
- `frontend/assets/js/components/pages/controllers/NpcCharacterPhotosController.js` — new
- `frontend/assets/js/components/pages/helpers/NpcCharacterPhotosHelper.jsx` — new
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — replace inline gallery with link
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — replace inline gallery with link
- `frontend/assets/js/components/elements/CharacterPhotos.jsx` — delete
- `frontend/assets/js/components/elements/CharacterPhoto.jsx` — delete
- `frontend/specs/assets/js/components/elements/CharacterPhotosSpec.js` — delete
- `frontend/specs/assets/js/components/elements/CharacterPhotoSpec.js` — delete
- New spec files mirroring every new file above, under `frontend/specs/...`

## CI Checks

- `frontend/`: `docker-compose run --rm frontend npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm frontend npm run lint` (CI job: `checks`)
- `frontend/`: `docker-compose run --rm frontend npm run check_i18n` (CI job: `frontend-checks`) — will fail until the `translator` agent's keys land in every locale file.

## Notes

- Order of route registration matters — verify against `Router.js`'s actual
  matching algorithm rather than assuming; get it wrong and `/photos` could
  resolve to the character detail page instead.
- `can_edit` is not part of the new photos list response — each page needs
  a secondary fetch (game/character detail or access endpoint) purely to
  gate the upload button, same as the existing show pages already do.
- Coordinate with `translator.md` for exact key names before wiring
  `Translator.t()` calls, to avoid churn.
