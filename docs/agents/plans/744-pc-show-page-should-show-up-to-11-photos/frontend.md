# Frontend Plan: PC show page should show up to 11 photos

Main plan: [plan.md](plan.md)

## Shared contracts

Must fetch and slice at exactly `11`, matching the `per_page=11` URL infra will warm in
`.circleci/navi_config.yaml` (`short_pc_photos`/`short_npc_photos`). The two frontend cap
points (fetch default and display slice) must stay equal to each other.

## Implementation Steps

### Step 1 — Raise the display slice constant

In `frontend/assets/js/components/common/cards/characterPreviewConstants.js:16`, change:

```js
export const MAX_PREVIEW_PHOTOS = 6;
```

to `11`.

### Step 2 — Raise the fetch's default page size

In `frontend/assets/js/client/CharacterClient.js:123`, change the default parameter:

```js
fetchCharacterPhotos(characterKind, gameSlug, characterId, token, perPage = 6) {
```

to `perPage = 11`. This also changes the built URL's `per_page=6` to `per_page=11` in the
default (no explicit `perPage` argument) case — `CharacterListsController#fetchCharacterPhotos`
(`frontend/assets/js/components/resources/character/pages/controllers/CharacterListsController.js:56-57`)
calls it without an explicit `perPage`, so it always uses this default.

### Step 3 — Update existing specs

- `frontend/specs/assets/js/components/common/cards/characterPreviewConstantsSpec.js` — the
  `'caps preview photos at 6'` test must assert `11` instead (and update its description).
- `frontend/specs/assets/js/client/CharacterClient/fetchCharacterPhotosSpec.js` — every
  `per_page=6` URL (the `itSendsAuthHeader` calls for PC/NPC, and the `'defaults per_page to 6
  when not provided'` test, including its description and body) must become `per_page=11`. The
  `'requests a custom per_page value when provided'` test is unaffected (it already passes an
  explicit `10`).
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelperSpec.js`
  — the `'slices the photos to the max preview count'` test currently uses `buildPhotos(8)` and
  asserts `/photos/6.jpg` is kept while `/photos/7.jpg`/`/photos/8.jpg` are dropped. Update it to
  a count safely above 11 (e.g. `buildPhotos(13)`), asserting `/photos/11.jpg` is kept and
  `/photos/12.jpg`/`/photos/13.jpg` are dropped.
- Search for any other `per_page=6`, `perPage = 6`, or hardcoded `6`/`MAX_PREVIEW_PHOTOS`
  references tied to the photo preview under `frontend/specs/` and `frontend/assets/js/` beyond
  the ones listed above, and update them consistently. (Some grep hits under
  `CharacterListsControllerSpec.js`, `CharacterController/fetchAndMergePhotosSpec.js`,
  `CharacterDetailController/*`, and `CharacterController/support.js` mention `per_page=6` too —
  check whether each is actually about the photo preview default or an unrelated `per_page`
  value/mock before changing it.)

## Files to Change

- `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — `MAX_PREVIEW_PHOTOS` 6 → 11.
- `frontend/assets/js/client/CharacterClient.js` — `fetchCharacterPhotos` default `perPage` 6 → 11.
- `frontend/specs/assets/js/components/common/cards/characterPreviewConstantsSpec.js` — update assertion.
- `frontend/specs/assets/js/client/CharacterClient/fetchCharacterPhotosSpec.js` — update URLs/assertions.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelperSpec.js` — update slice test.
- Any other spec found in Step 3's search that hardcodes the old `6` limit for this feature.

No layout change is needed: `CharacterPhotosPreviewHelper.jsx`'s grid
(`col-6 col-sm-4 col-md-3 col-lg-2`) already wraps responsively, and per product decision, 11
photos plus the "see more" card fitting into 2 rows on the intended breakpoint is the desired
behavior — do not touch the grid column classes.

## CI Checks

- `frontend`: `npm test` (Jasmine specs) (CI job: frontend test job in `.circleci/config.yml`)
- `frontend`: `npm run lint` (CI job: frontend lint job in `.circleci/config.yml`)

## Notes

- No backend change needed — `backend/games/paginator.py` has no `per_page` cap, so the API
  already serves `per_page=11` without modification.
- Double check no other UI (e.g. a "quantity of photos shown" hint text, if any) references the
  literal `6`.
