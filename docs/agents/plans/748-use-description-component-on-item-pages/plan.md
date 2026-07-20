# Plan: Use description component on item pages

Issue: [748-use-description-component-on-item-pages.md](../../issues/748-use-description-component-on-item-pages.md)

## Overview

Replace the plain `<p>{item.description}</p>` in the shared item-detail rendering
helper with the existing `DescriptionBox` component, so item descriptions get the
same collapsible, bordered box already used on character and game show pages.
Frontend-only change; single shared helper fixes all three item-detail routes at once.

## Context

`ItemDetailHelper.render()` (`frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx`)
is shared by `GameItem` (`/#/games/:game_slug/items/:id`), and `PcCharacterItem` /
`NpcCharacterItem` (`/#/games/:game_slug/pcs/:character_id/items/:id` and the NPC
equivalent). It currently renders the description as raw text:

```jsx
<div className="col-md-8">
  <p>{item.description}</p>
</div>
```

`DescriptionBox` (`frontend/assets/js/components/common/misc/DescriptionBox.jsx`)
already implements the collapsible pattern (bordered box, max collapsed height,
"Show more"/"Show less" toggle when content overflows) and is reused elsewhere via a
single `description` prop — no title/maxLength prop exists. It's used e.g. by
`CharacterDescriptionHelper.jsx` (`return <DescriptionBox description={description} />;`).

## Implementation Steps

### Step 1 — Swap the description rendering

In `ItemDetailHelper.jsx`:
- Add the import: `import DescriptionBox from '../../../../common/misc/DescriptionBox.jsx';`
  (mirrors the relative-path pattern used by `CharacterDescriptionHelper.jsx` for the
  same component).
- Replace `<p>{item.description}</p>` with `<DescriptionBox description={item.description} />`.
- Update the class-level JSDoc comment that currently describes the `<p>` layout to
  reflect the `DescriptionBox` usage.

### Step 2 — Update the existing spec

In `frontend/specs/assets/js/components/resources/item/pages/helpers/ItemDetailHelperSpec.js`,
the `'renders the item description'` test currently asserts `html).toContain('A shimmering cloak.')`
against a raw `<p>`. `DescriptionBoxHelper.render()` still renders the description text
directly inside the box's `<div>` (it's hidden via CSS `overflow`/`max-height`, not
removed from the DOM), so this assertion keeps passing unchanged. No other existing
test in this file depends on the `<p>` wrapper specifically (photo, back button, and
hidden-badge tests use `description: ''`, and `DescriptionBox` returns `null` for a
falsy description, so those are unaffected too).

Add one new test asserting the collapsible box itself is present, e.g. that the
rendered HTML contains the `DescriptionBox` wrapper class (`border rounded bg-light`)
so a future accidental revert back to a plain `<p>` is caught.

## Files to Change

- `frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx` — import `DescriptionBox`, replace the `<p>` with `<DescriptionBox description={item.description} />`, update JSDoc.
- `frontend/specs/assets/js/components/resources/item/pages/helpers/ItemDetailHelperSpec.js` — add a test asserting the description box wrapper is rendered.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No i18n changes needed — `DescriptionBox`'s "Show more"/"Show less" labels already
  exist in `frontend/assets/i18n/en.yaml` and `pt.yaml` (added when the component was
  first introduced).
- No backend changes required; `item.description` is already returned by the existing
  item-detail endpoints.
