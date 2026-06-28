# Frontend Plan: Add Character Links

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes:
- The `links` field now present in the character detail response (both PC and NPC endpoints).
- Each element: `{ "id": <integer>, "text": <string>, "url": <string> }`
- The `links` array may be empty `[]`; it may also be absent on older cached responses.

## Implementation Steps

### Step 1 — Add a private #renderLinks method to CharacterHelper

In `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`, add a private static method `#renderLinks(character)` following the same pattern as `GameHelper.#renderLinks(game)`:

```jsx
static #renderLinks(character) {
  if (!character.links || character.links.length === 0) {
    return null;
  }

  return (
    <ul>
      {character.links.map((link) => (
        <li key={link.url}>
          <a href={link.url} target="_blank" rel="noreferrer">{link.text}</a>
        </li>
      ))}
    </ul>
  );
}
```

### Step 2 — Call #renderLinks inside render()

In `CharacterHelper.render()`, call `{CharacterHelper.#renderLinks(character)}` after the description row and before `<CharacterPhotos>`. Position it at the same level as `#renderPrivateDescription`.

### Step 3 — Update the JSDoc for render()

Add `@param {object[]} [character.links]` to the existing JSDoc block for `CharacterHelper.render()`.

### Step 4 — Write Jasmine specs

In `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js`, add tests covering:
- Renders link URLs and text when `character.links` contains items.
- Does not render any link `<a>` when `character.links` is empty.
- Does not render any link `<a>` when `character.links` is absent.

## Files to Change

- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — add `#renderLinks` and call it from `render()`
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` — add link rendering tests

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- The `#renderLinks` implementation is nearly identical to `GameHelper.#renderLinks`. Use `link.url` as the React `key` (same convention used in GameHelper).
- The `character` data object's `links` field may be undefined on older cached payloads; the guard `!character.links || character.links.length === 0` already handles this.
- No i18n keys are needed — the links list has no static labels.
