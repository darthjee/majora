# Plan: Game pages overhauling

Issue: [553-game-pages-overhauling.md](../../issues/553-game-pages-overhauling.md)

## Overview

Restructure the game show page (`GameHelper.render()`) into a two-column layout anchored to
the cover photo's width, matching the character show page's pattern: photo, Next Session,
Polls widget, and a new treasures button in the left column; name, description, and the
PCs/NPCs previews in the right column. Also swap the PCs/NPCs previews' trailing "See all"
text link for an icon card, matching how the character treasures/photos previews already
work. This is a self-contained frontend change — no new translation keys are needed (all
labels reuse existing i18n keys), so there is no agent split.

## Context

Today `GameHelper.render()` only puts the photo/name/description in a `row` with
`col-md-4`/`col-md-8`; the Next Session section, `OpenPollsWidget`, and the PCs/NPCs
previews (`CharacterPreviewSection`) all render full-width below that row, and there is no
link to the game's treasures page at all. The character show page (`CharacterHelper.render()`)
already anchors everything to the photo-sized left column. The PCs/NPCs previews currently
end with a plain `<a>{Translator.t('character_preview_section.see_all')...}</a>` link, unlike
`CharacterTreasuresPreviewHelper`/`CharacterPhotosPreviewHelper`, which already append a
`SeeAllCard` instead.

## Implementation Steps

### Step 1 — Add the two new PC/NPC icons

Add `filePerson: 'bi-file-earmark-person'` and `filePersonFill: 'bi-file-earmark-person-fill'`
to `frontend/assets/js/utils/ui/Icons.js`, next to the existing `viewAs: 'bi-file-person-fill'`
entry for discoverability.

### Step 2 — Swap the PCs/NPCs previews' trailing link for a `SeeAllCard`

- `frontend/assets/js/components/common/helpers/CharacterPreviewSectionHelper.jsx`: add an
  `icon` parameter to `render(characters, gameSlug, characterType, title, seeAllHref, icon)`,
  replace the trailing `<a href={seeAllHref}>...</a>` with a `SeeAllCard` (same pattern as
  `CharacterTreasuresPreviewHelper.#renderBody`), passed `icon`, the already-computed
  `Translator.t('character_preview_section.see_all').replace('{{title}}', title)` text (this
  already renders e.g. "See all Player Characters" — matches the issue's alt text verbatim,
  no new key needed), and `seeAllHref`. Move the `SeeAllCard` inside the same `row` div as the
  character cards, not below it — this only changes the last grid cell.
- `frontend/assets/js/components/common/CharacterPreviewSection.jsx`: thread the new `icon`
  prop through to the helper.
- No change needed to the character-card grid itself, `MAX_PREVIEW_CHARACTERS` slicing, or the
  empty-state rendering (still shows the heading + the new `SeeAllCard` alone, matching
  `CharacterTreasuresPreviewHelper`'s empty-state pattern).

### Step 3 — Restructure `GameHelper.render()` into the two-column layout

`frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx`:
- Move the `<h1>{game.name}</h1>`, description paragraph, and `<LinkList links={game.links} />`
  block to stay in `col-md-8`, and append the two `CharacterPreviewSection` calls (PCs, then
  NPCs, passing `Icons.filePerson`/`Icons.filePersonFill` respectively) inside that same
  `col-md-8` column, right after the description/links — replacing today's full-width
  `CharacterPreviewSection` calls rendered outside the `row`.
- Move `#renderNextSession(game)` and `<OpenPollsWidget game={game} />` into `col-md-4`,
  right after the `ActionsOverlay` photo — replacing today's full-width calls rendered after
  the `row` and after the PC/NPC previews.
- Add a new treasures button/link in `col-md-4`, after `OpenPollsWidget`, pointing at
  `#/games/${game.game_slug}/treasures`, reusing the existing `game_page.treasures`
  translation key (already present in both locale files but currently unused), styled like
  the existing Sessions button (`btn btn-secondary mb-3`, or `mt-3` if it needs separation
  from the widget above it — check spacing visually).
- End state: the `row`/`col-md-4`/`col-md-8` structure now wraps the entire page body; nothing
  renders outside the `row` except `PageActions` above it.

## Files to Change

- `frontend/assets/js/utils/ui/Icons.js` — add `filePerson`/`filePersonFill`.
- `frontend/assets/js/components/common/helpers/CharacterPreviewSectionHelper.jsx` — accept
  `icon`, swap the trailing text link for a `SeeAllCard`.
- `frontend/assets/js/components/common/CharacterPreviewSection.jsx` — thread `icon` prop.
- `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx` — move Next
  Session, `OpenPollsWidget`, PCs/NPCs previews into the two-column `row`; add the treasures
  button.
- `frontend/specs/assets/js/components/common/helpers/CharacterPreviewSectionHelperSpec.js` —
  update the "renders a see all link" test to assert on the `SeeAllCard` markup/icon instead
  of a plain `<a>` link; pass the new `icon` argument in every `.render(...)` call in this file.
- `frontend/specs/assets/js/components/common/CharacterPreviewSectionSpec.js` — thread the new
  `icon` prop through its calls.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameHelper/bottomButtonsSpec.js`
  — the existing "does not render the treasures/photos buttons" test's treasures assertion is
  now false; update it to assert the treasures link IS present (drop or adjust the photos-link
  assertion only if it's still accurate — game photos still have no page/button per this issue).
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameHelper/nextSessionSpec.js`
  — update to expect Next Session content inside `col-md-4` rather than below the row, if it
  asserts on structural placement.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameHelper/openPollsWidgetSpec.js`
  — same, for the widget's new location.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameHelper/characterPreviewsSpec.js`
  — same, for the PCs/NPCs previews' new location inside `col-md-8`.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameHelper/basicContentSpec.js`
  — update if it asserts on the row/column structure around name/description.

## CI Checks

- `frontend`: `yarn test` (CI job: `jasmine`)
- `frontend`: `yarn lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — no new keys are added by this
  issue, so this should already pass, but run it to confirm nothing regressed.

## Notes

- No backend, translator, or other specialist work is needed — every label reuses an existing
  i18n key (`game_page.treasures`, `character_preview_section.see_all`), and no API/data shape
  changes.
- Per the user's explicit confirmation during discussion, `/#/new` and `/#/:game_slug/edit`
  need no layout changes: `GameEditHelper.jsx` already uses the photo-left/form-right
  two-column layout, and `GameNewHelper.jsx` stays single-column since a game has no cover
  photo before it exists.
- Do a local visual check (`make dev-up`, view a game page) to confirm spacing/alignment once
  Next Session, Polls, and the treasures button are stacked in the narrower left column —
  exact margin/button classes are a judgment call to finalize visually.
