# Frontend Plan: Add Game Links

Main plan: [plan.md](plan.md)

## Shared contracts

None — this is the only agent involved.

## Implementation Steps

### Step 1 — Add a private `#renderLinks` method to `GameHelper`

In `frontend/assets/js/components/pages/helpers/GameHelper.jsx`, add a static private method `#renderLinks(game)` that:
- Returns `null` when `game.links` is absent or empty.
- Otherwise renders a `<ul>` containing one `<li>` per link, each containing an `<a>` with `href={link.url}` and `target="_blank"` and `rel="noreferrer"`. The link text is `link.text`.

### Step 2 — Call `#renderLinks` from `render`

Inside the existing `render` static method, call `{GameHelper.#renderLinks(game)}` in a logical position (e.g. after the description paragraph, before `CharacterPhotos`).

### Step 3 — Add Jasmine specs for `#renderLinks` behaviour

In `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js`, inside the existing `.render` describe block, add:

- A test verifying that when `game.links` contains items, the rendered HTML includes each link's `url` as an href and its `text` as visible text.
- A test verifying that when `game.links` is empty (`[]`), no `<a` element for links is rendered.
- A test verifying that when `game.links` is absent/`undefined`, no `<a` element for links is rendered (graceful no-op).

## Files to Change

- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — add `#renderLinks` private method and call it from `render`
- `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` — add specs covering the three link-rendering scenarios

## CI Checks

- `frontend`: `docker-compose run --rm frontend yarn test` (CI job: `frontend-tests`)

## Notes

- Each link object has `text` (the anchor label) and `url` (the href), matching the `LinkSerializer` shape already confirmed in the backend serializer.
- Use `target="_blank" rel="noreferrer"` so external links open safely in a new tab.
- No new translation keys are required — the issue specifies plain anchor rendering, not a titled section.
