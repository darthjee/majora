# Issue: Create an account related dropdown menu

## Description
The header currently shows an account icon button (`data-testid="my-account-link"` in `HeaderHelper.jsx`) that links directly to `/#/my_account`. It already has an `alt` attribute (`header.my_account_alt`) on the icon image, but nothing tells a sighted mouse user hovering over it what the icon means, and it only ever exposes a single destination.

## Problems
- The account icon has no visible tooltip/title for sighted users hovering over it (only an `alt` attribute on the `<img>`, which is not shown as a tooltip).
- The icon links straight to "My account" with no room to add more account-related links later.

## Expected Behavior
- Hovering over the account icon shows a tooltip/title indicating it is the account menu, and it remains properly labeled for assistive technology (aria-label or equivalent).
- Clicking the account icon opens a dropdown menu (instead of navigating directly), using the same icon as the toggle.
- The dropdown contains a "My account" item (text label) that links to `/#/my_account`, functionally equivalent to the current link.
- Additional account-related links can be added to this dropdown in the future without further restructuring.

## Solution
- Replace the current `Nav.Link` icon button in `HeaderHelper.jsx` with a `NavDropdown` (react-bootstrap), consistent with the existing `NavDropdown` usage in `HeaderNavHelper.jsx`, including its default caret indicator next to the toggle content.
- Use the existing account icon (`myAccountIcon`) as the dropdown toggle content, reusing the existing `header.my_account_alt` ("My account") translation as the toggle's `title`/`aria-label` so it stays both hoverable and accessible.
- Add a `NavDropdown.Item` linking to `#/my_account` with the "My account" text as its label.
- Preserve the existing `data-testid` conventions so specs continue to target the control (adjusting `HeaderHelperSpec`/related specs as needed).

## Benefits
- Clearer affordance for what the account icon does, improving accessibility and discoverability.
- A single, extensible entry point in the header for account-related actions, avoiding header clutter as more links are added.
