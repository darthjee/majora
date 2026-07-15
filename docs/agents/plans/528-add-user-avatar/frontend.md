# Frontend Plan: Add User Avatar

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes `account.avatar_url` (`string | null`) from `GET`/`PATCH /users/account.json` —
  see [plan.md](plan.md)'s "Shared contracts" for the exact backend field shape.
- Consumes the new `my_account_page.avatar_alt` translation key — see `translator.md`.

## Implementation Steps

### Step 1 — New `Avatar` component

Add `frontend/assets/js/components/common/Avatar.jsx`, modeled directly on the existing
`frontend/assets/js/components/common/CardAvatar.jsx`:

```jsx
import defaultAvatar from '../../../images/placeholders/default_avatar.png';

/**
 * Small round avatar image that falls back to a default placeholder when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Avatar URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function Avatar({ url, alt }) {
  return (
    <img src={url || defaultAvatar} className="avatar-photo" alt={alt} />
  );
}
```

Add a bundled placeholder image at
`frontend/assets/images/placeholders/default_avatar.png` (a generic user-silhouette icon),
alongside the existing `default_character.png` / `default_game.png` / `default_treasure.png`
— there is no existing user/avatar placeholder to reuse, this is a new asset.

Add a minimal `avatar-photo` style (small fixed square/circle, e.g. via existing SCSS
conventions under `frontend/assets/`) — check how `card-photo-square` is defined for
`CardAvatar` and follow the same location/pattern for a new, smaller avatar-sized rule.

### Step 2 — Spec for `Avatar`

Add `frontend/specs/assets/js/components/common/AvatarSpec.js`, mirroring
`CardAvatarSpec.js`'s structure and assertions (renders `<img>` with the given `url`/`alt`,
falls back to `default_avatar.png` when `url` is null or undefined).

### Step 3 — Thread `avatarUrl` through the My Account page

`frontend/assets/js/components/resources/account/pages/MyAccount.jsx`:
- Add `const [avatarUrl, setAvatarUrl] = useState(null);`.
- Pass `setAvatarUrl` into `new MyAccountController(setName, setEmail, setAvatarUrl, setLoading)`
  (update the constructor signature/order in `MyAccountController.js` to match, keeping
  `setLoading` last as it already is elsewhere in this file, or whatever order reads best
  — just keep the call site and constructor in sync).
- Pass `avatarUrl` into the `formState` object given to `MyAccountHelper.render(...)`.

`frontend/assets/js/components/resources/account/pages/controllers/MyAccountController.js`:
- Accept and store `setAvatarUrl` alongside `setName`/`setEmail` (update the JSDoc too).
- In `#fetchAccount`, add `safeSet(this.setAvatarUrl, account.avatar_url ?? null);` next to
  the existing `safeSet(this.setName, ...)` / `safeSet(this.setEmail, ...)` calls.

### Step 4 — Render the avatar on the page

`frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx`:
- Import `Avatar` from `'../../../../common/Avatar.jsx'`.
- In `render(formState, handlers)`, render `<Avatar url={formState.avatarUrl}
  alt={Translator.t('my_account_page.avatar_alt')} />` immediately above/beside the
  `<h1>{Translator.t('my_account_page.title')}</h1>` line, inside the existing
  `<div className="container mt-4">` wrapper — top-left corner of the page content.
- Update the JSDoc `@param` block for `formState` to include `avatarUrl: string|null`.

Leave `frontend/assets/js/components/common/helpers/HeaderHelper.jsx` untouched — the
static `myAccountIcon` in the header nav is explicitly out of scope for this issue.

## Files to Change

- `frontend/assets/js/components/common/Avatar.jsx` — new component
- `frontend/assets/images/placeholders/default_avatar.png` — new placeholder asset
- `frontend/specs/assets/js/components/common/AvatarSpec.js` — new spec
- `frontend/assets/js/components/resources/account/pages/MyAccount.jsx` — add `avatarUrl` state, thread into controller and helper
- `frontend/assets/js/components/resources/account/pages/controllers/MyAccountController.js` — accept/set `avatarUrl` from the fetched account
- `frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx` — render `Avatar` in the top-left corner
- Existing specs for `MyAccount`/`MyAccountController`/`MyAccountHelper` (find via the same
  `frontend/specs/...` mirrored path convention as `AvatarSpec.js`) — update to cover the
  new `avatarUrl` plumbing

## CI Checks

- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until the
  `translator` agent's `my_account_page.avatar_alt` key lands in both `en.yaml` and `pt.yaml`

## Notes

- Keep `CardAvatar` and `Avatar` as separate components (different sizing/use-case —
  character card photo vs. small account avatar) rather than merging them; this matches
  the issue's explicit ask for "a component for that" (the avatar) distinct from existing
  card-photo components.
- The header nav icon swap was explicitly deferred out of scope during discussion — don't
  touch `HeaderHelper.jsx`.
