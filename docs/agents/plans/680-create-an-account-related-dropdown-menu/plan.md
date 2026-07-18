# Plan: Create an account related dropdown menu

Issue: [680-create-an-account-related-dropdown-menu.md](../../issues/680-create-an-account-related-dropdown-menu.md)

## Overview
Convert the header's plain account-icon link into a `NavDropdown` (react-bootstrap), matching the pattern already used for the admin/game/character nav menus in `HeaderNavHelper.jsx`. The icon stays as the toggle content (with its existing "My account" tooltip/aria-label and the library's default caret), and the dropdown's only item for now is "My account", linking to `#/my_account`. This leaves room to add more account-related links to the same dropdown later without further restructuring.

## Context
`HeaderHelper.jsx` renders the logged-in auth controls, including a `Nav.Link` (`data-testid="my-account-link"`) that wraps the `myAccountIcon` image and links straight to `#/my_account`. The image already has an `alt` attribute via the `header.my_account_alt` translation key ("My account" / "Minha conta"), but there's no visible tooltip on hover and no way to add further account links without restructuring.

## Implementation Steps

### Step 1 — Import `NavDropdown` in `HeaderHelper.jsx`
Add `import NavDropdown from 'react-bootstrap/cjs/NavDropdown.js';` alongside the other react-bootstrap imports, mirroring `HeaderNavHelper.jsx`.

### Step 2 — Replace the account `Nav.Link` with a `NavDropdown`
In `#renderAuthControl`, replace:

```jsx
<Nav.Link href="#/my_account" data-testid="my-account-link">
  <img src={myAccountIcon} alt={Translator.t('header.my_account_alt')} />
</Nav.Link>
```

with a `NavDropdown` whose toggle content is the icon, carrying `title` and `aria-label` set to `Translator.t('header.my_account_alt')` (the icon's `alt` can stay too, for the `<img>` itself), and a single `NavDropdown.Item` pointing at `#/my_account`:

```jsx
<NavDropdown
  title={<img src={myAccountIcon} alt={Translator.t('header.my_account_alt')} />}
  id="header-account-nav-dropdown"
  data-testid="my-account-dropdown"
  aria-label={Translator.t('header.my_account_alt')}
  renderMenuOnMount
>
  <NavDropdown.Item href="#/my_account" data-testid="my-account-link">
    {Translator.t('header.my_account_alt')}
  </NavDropdown.Item>
</NavDropdown>
```

Keep `renderMenuOnMount` for consistency with the other dropdowns in `HeaderNavHelper.jsx` (ensures the menu items are present in static/server-rendered markup, which the existing specs rely on for other dropdowns).

Add a `title` attribute directly on the toggle element (react-bootstrap forwards unknown props to the underlying toggle `<a>`), so hovering the icon shows a native tooltip even before the menu is opened.

### Step 3 — Update `HeaderHelper` specs
`frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/myAccountAndLanguageSpec.js` currently checks for `data-testid="my-account-link"` and `href="#/my_account"` directly on the rendered output — these should still pass since the item keeps the same `data-testid` and `href`, just nested inside the dropdown markup now. Add/adjust assertions to also cover:
- The dropdown toggle is present when logged in (e.g. a new `data-testid="my-account-dropdown"`), and absent when logged out.
- The toggle exposes the "My account" text as its accessible name/tooltip (`aria-label`/`title`).
- The "My account" item text is rendered inside the dropdown (not just the `href`).

### Step 4 — Manual/visual check
Run the frontend dev server and confirm in the browser that, while logged in, the account icon now opens a dropdown containing "My account", the icon still shows a tooltip on hover, and clicking "My account" still navigates to `/#/my_account`.

## Files to Change
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — replace the account `Nav.Link` with a `NavDropdown` (icon toggle + "My account" item).
- `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/myAccountAndLanguageSpec.js` — update/add assertions for the new dropdown structure.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)

## Notes
- No new translation keys are needed — `header.my_account_alt` already exists in `en.yaml`/`pt.yaml` and covers the toggle's tooltip/aria-label as well as the dropdown item's text.
- No backend, proxy, or infra changes are involved; this is frontend-only.
- Per discussion on the issue, the default react-bootstrap caret next to the icon is intentional (matches the other header dropdowns), and the toggle keeps the existing "My account" wording rather than a more generic "Account" label.
