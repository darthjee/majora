# Frontend Plan: Character photo gallery

Main plan: [plan.md](plan.md)

## Shared contracts

- Call `Translator.t('character_page.photos_title')` for the section heading and
  `Translator.t('character_photos_preview.empty')` for the empty state — do not hardcode the
  English strings. `translator` owns adding these keys; a missing key falls back to the key
  itself, so this work is not blocked on translator's.
- `character.photos` is already present on the character object returned by the existing
  character-detail fetch (`CharacterDetailSerializer` already serializes it as `{id, path}[]`,
  confirmed in `source/games/serializers/character_detail.py`). No new fetch, no controller
  change, and no merge step (unlike the existing `fetchAndMergeTreasures` pattern for treasures)
  are needed — the field is already on the `character` object passed into
  `CharacterHelper.render()`.

## Implementation Steps

### Step 1 — Preview count constant

Add `MAX_PREVIEW_PHOTOS` to
`frontend/assets/js/components/common/characterPreviewConstants.js`, following the existing
`MAX_PREVIEW_TREASURES = 6` style (same value, `6`, unless a different count is preferred —
no functional reason to diverge).

### Step 2 — Preview component + helper

Add `frontend/assets/js/components/resources/character/pages/elements/CharacterPhotosPreview.jsx`
and
`frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx`,
mirroring `CharacterTreasuresPreview.jsx` /
`pages/elements/helpers/CharacterTreasuresPreviewHelper.jsx` structure exactly:

- Props: `photos` (list of `{id, path}`), `title`, `seeAllHref`.
- `render(photos, title, seeAllHref)`: slice to `MAX_PREVIEW_PHOTOS`, render a heading, a body
  (card grid or the empty message), and the "See all" link
  (`Translator.t('character_preview_section.see_all').replace('{{title}}', title)`).
- Empty state: `<p className="text-muted">{Translator.t('character_photos_preview.empty')}</p>`
  when the preview list is empty.
- Card grid: reuse `CardPhoto` (`frontend/assets/js/components/common/CardPhoto.jsx`, the plain
  image element used inside `PhotoCard`) wrapped in a plain
  `<div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4"><div className="card h-100">...`
  wrapper — **do not** reuse `PhotoCard.jsx` as-is, since it wraps its card in a `<button
  onClick={...}>` that opens the full-gallery lightbox; wiring a no-op `onClick` there would
  render a clickable-looking control that silently does nothing, which the issue's "static, no
  click behavior" requirement explicitly rules out.

### Step 3 — Wire into the show page

In `CharacterHelper.render()` (`pages/helpers/CharacterHelper.jsx`), add the new preview section
right after the existing `CharacterTreasuresPreview` (or right before it — either ordering is
fine, just keep both preview sections together), passing:

```jsx
<CharacterPhotosPreview
  photos={character.photos ?? []}
  title={Translator.t('character_page.photos_title')}
  seeAllHref={`#/games/${character.game_slug}/${segment}/${character.id}/photos`}
/>
```

Update the class-level JSDoc `@param` list to document the new `character.photos` field the
same way `character.treasures` is already documented.

## Files to Change

- `frontend/assets/js/components/common/characterPreviewConstants.js` — add
  `MAX_PREVIEW_PHOTOS`.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterPhotosPreview.jsx`
  (new).
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterPhotosPreviewHelper.jsx`
  (new).
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` — render
  the new preview section, update JSDoc.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterPhotosPreviewSpec.js`
  (new) and
  `.../elements/helpers/CharacterPhotosPreviewHelperSpec.js` (new) — mirror the existing
  `CharacterTreasuresPreviewSpec.js` / `CharacterTreasuresPreviewHelperSpec.js` coverage (empty
  state, under-the-limit list, over-the-limit list, "See all" href).
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterHelper/photosPreviewSpec.js`
  (new) — mirror `.../CharacterHelper/treasuresPreviewSpec.js`.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)

Run through the containerized toolchain, never `npm`/`yarn` directly on the host.

## Notes

- Confirm during implementation whether `character.photos` items need any filtering (e.g. a
  `ready` flag) before display — the serializer only exposes `{id, path}` (no `ready` field), so
  no such filtering is currently possible client-side; if unready photos should be excluded from
  the preview, that would require a backend serializer change out of this plan's scope — flag it
  back to the architect if it turns out to matter.
