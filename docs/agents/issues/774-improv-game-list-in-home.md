# Issue: Improv game list in home

## Description

On the home page (`/#/`), the games page (`/#/games/`), and the "My Games"
page (`/#/my-games/`), the game list is always rendered in a fixed
4-column grid with square photo cards, regardless of how many games are
actually in the list. When a user (or account) has fewer than 4 games,
this leaves an awkward gap in the row and doesn't make good use of the
available width to showcase each game's cover image.

This issue makes the grid's column count adapt to the number of games
being displayed, and changes the game card's photo box from square to a
fixed-height rectangle so it shows the game image better.

## Problem

The grid is rendered by the shared `ListPage`/`ListPageHelper` component
(`frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx`),
reused by ~20 list types across the app. Today only the `lg` breakpoint
varies per type (`col-lg-3` for games' 4-per-row vs. `col-lg-2` for
everyone else's 6-per-row); `xs`/`sm`/`md` are hardcoded the same for every
type (`col-6 col-sm-4 col-md-3` — 2 columns on phones, 3 on small tablets,
4 from `md` up). This is fine when there are enough games to fill a row,
but with fewer games the row is left partially empty instead of filling
the available width.

The card's photo box is also always square: `CardPhoto.jsx` wraps the
image in a `.card-photo-square` div (`aspect-ratio: 1/1`,
`frontend/assets/css/main.scss:22-32`). That class is shared by
essentially every card image component in the app (`CardTreasureImage`,
`CardItemImage`, `CardDocumentImage`, etc.) and is also rendered directly
for **photo galleries** — `PhotoCardHelper.jsx:51` calls
`<CardPhoto url={photo.path} alt={alt} />` directly for
game/character/document detail-page photo carousels, which must keep
their current square look. So a fix must not touch `.card-photo-square`
globally.

## Expected Behavior

- On `/#/`, `/#/games/`, and `/#/my-games/` only, the grid's column count
  adapts at **every** breakpoint to the number of games rendered on the
  current page (`items.length`), so cards fill the row edge-to-edge
  instead of leaving a gap. Formula per breakpoint: effective columns =
  `min(breakpoint's normal column count, items.length)`. Bootstrap width
  class = `col-{prefix}-{12 / effective columns}`.

  | Game count | xs | sm | md | lg |
  |---|---|---|---|---|
  | 1 | col-12 | col-12 | col-12 | col-12 |
  | 2 | col-6 | col-6 | col-6 | col-6 |
  | 3 | col-6 | col-4 | col-4 | col-4 |
  | 4+ | col-6 | col-sm-4 | col-md-3 | col-lg-3 |

  4+ games matches current behavior exactly, unchanged. This also
  naturally applies to a paginated last page with fewer leftover games,
  and to client-side filtering that changes the visible count, since the
  formula is derived from the actually-rendered `items` array at render
  time — no separate total-count fetch needed.

- On those same three pages, each game card's photo box becomes a
  fixed-height rectangle (~220px tall, full column width) instead of a
  square, so the image is shown wider rather than cropped to a 1:1 ratio.

- Every other list type (~18, e.g. treasures, items, documents, PCs/NPCs,
  sources, collections — see `listTypeConfig.js`) keeps its current fixed
  4-per-row-at-md/6-per-row-at-lg, square-card behavior completely
  unchanged. `CardPhoto`'s direct usage in photo galleries
  (`PhotoCardHelper.jsx`) is also unaffected — those stay square.

- With 0 games, the grid simply renders no cards (no separate empty-state
  component exists today, and none is being added by this issue).

## Solution

**Column formula** — the `min(breakpoint's normal column count,
items.length)` logic replaces the currently hardcoded
`col-6 col-sm-4 col-md-3 <col-lg-3|col-lg-2>` in
`ListPageHelper.#renderItem`. This only changes rendered output for list
types whose configured `itemsPerRow` combined with an actual item count
below that ceiling would previously have produced a partially-empty row;
every other type keeps its exact current classes since `min(4/6,
items.length)` resolves to the same value whenever `items.length` is at or
above the type's normal per-row count.

**Card shape scoping** — `CardPhoto.jsx` gains an optional `className`
prop defaulting to today's `'card-photo-square'`:

```jsx
export default function CardPhoto({ url, alt, className = 'card-photo-square' }) {
  return (
    <div className={className}>
      <img src={url || defaultGamePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
```

- `ActionsOverlay` gains an optional `photoClassName` prop, forwarded to
  `<Photo url={url} alt={alt} className={photoClassName} />`. Other
  `Photo` components (`CardTreasureImage`, etc.) only destructure
  `{ url, alt }`, so the extra prop is silently ignored.
- `ListPageHelper.#renderItem` passes `config.cardPhotoClassName` (new
  optional field, set only on `gamesListType.js`/`myGamesListType.js`)
  through to `ActionsOverlay`'s `photoClassName`.
- `PhotoCardHelper.jsx`'s direct `<CardPhoto url={...} alt={...} />` call
  is untouched — no `className` passed, so photo galleries keep defaulting
  to `card-photo-square` everywhere.
- Every other list type's config omits `cardPhotoClassName`, so `CardPhoto`
  falls back to `card-photo-square` — identical to today.

This reuses `CardPhoto`'s existing role as the fallback for any
`photoType` unmapped in `PHOTO_COMPONENTS` (today that's exactly
`games`/`my-games`'s `photoType: 'photo'`), rather than adding a new
`CardGameImage` component + `PHOTO_COMPONENTS` entry — smaller change,
though worth revisiting if another list type later needs the same
fallback slot.

**New CSS class** (`frontend/assets/css/main.scss`, alongside
`.card-photo-square`):

```scss
.card-photo-rect {
  width: 100%;
  height: 220px; // starting value, tune during implementation/design review
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
```

Fixed height (not `aspect-ratio`) keeps the photo box a constant height
across every column count, with width always filling 100% of the column.
At 1-column (full container width) the image renders as a wide/panoramic
banner rather than growing taller — an accepted trade-off. `220px` is a
starting value close to today's square-card height at the 4-column
breakpoint; exact value to be confirmed visually during implementation.

**Alternatives considered and rejected:**

- **CSS Grid rewrite** (`auto-fit`/`minmax()` instead of Bootstrap
  columns) — more elegant long-term, but a much bigger blast radius for a
  cosmetic fix to one/two list types, and inconsistent with the
  Bootstrap-column pattern the rest of the app's list types use.
- **Row-centering only** (`justify-content-center`, keep cards fixed-size)
  — simplest CSS-only change, but doesn't achieve "show better the image":
  cards stay small instead of growing to fill the row.
- **Square cards only, skip the rectangular-card change** — smaller scope,
  but discards half the proposal's goal.

**Testing:**

- `ListPageHelperSpec.js` — extend the existing `col-lg-3`/`col-lg-2`
  assertions with cases for 1/2/3-item counts producing
  `col-12`/`col-6`/`col-4` (and their `sm`/`md` equivalents) for a
  flexible-grid-configured type, while a fixed type's columns stay
  constant regardless of count.
- `CardPhotoSpec.js` — assert the `className` prop override (and that
  omitting it still defaults to `card-photo-square`).
- `listTypeConfig/gamesSpec.js` and `myGamesSpec.js` — assert the new
  `cardPhotoClassName` config field.
- Existing `GamesSpec.js`/`GamesHelperSpec.js` should keep passing
  unchanged (no prop-shape change at that level).

**Permissions / performance / security:** not applicable — purely
presentational (grid/card layout), no new data exposed, no endpoint or
access-control change, no new requests.

## Benefits

- Better use of screen space: rows never show an awkward gap when a user
  has fewer than 4 games.
- Better showcases each game's cover image via the wider rectangular
  photo box, directly addressing the original ask.
- Consistent behavior between "Games" and "My Games", avoiding a confusing
  inconsistency between the two closely related pages.
- Zero risk to the other ~18 list types or to photo galleries elsewhere in
  the app — the change is fully opt-in per list type and scoped to a
  single component's fallback path.
