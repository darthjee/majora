# Issue: Add edit PC page

## Description
We need to add a `/#/games/:game_slug/pcs/:id/edit` page to edit a player character (PC). It should look similar to the `/#/games/:game_slug/pcs/:id` show page, but with the editable fields rendered as a form.

## Problem
- There is currently no way to edit a PC's basic details from the UI.

## Expected Behavior
- The edit page allows editing of:
  - name
  - avatar-url (the avatar is still shown as an image, and changing the URL updates the displayed image live)
  - character class
  - level
  - description (as text)
- All other fields are blocked (not editable on this page).
- This restriction must be enforced on the backend as well, not only hidden/disabled on the frontend — the API must reject (or silently ignore) attempts to update any field other than name, avatar-url, character class, level, and description.

### Restrictions
- Only logged-in users can see this page.
- Only two kinds of users can update the PC:
  - the player that is connected to the character
  - any superuser

### Validations
- If validation fails, it must not break/corrupt data in the database. Instead, the response should return an `errors` field, e.g.:

```json
"errors": { "<field_name>": ["error1", ...] }
```

- Errors should be displayed beneath each corresponding field as an alert/error.

### Navigation
- On the PC show page (`/#/games/:game_slug/pcs/:id`), display an "Edit" button when the logged-in user is allowed to edit (the connected player or a superuser).
- The button's visibility must react to login/logout immediately, without a page reload, by subscribing to the existing auth-state event system (`AuthEvents`), the same way `Header.jsx` does.

### Unauthorized direct navigation
- The frontend currently has no route guards; authorization is enforced by the backend. If a user navigates directly to the edit URL without permission, the edit page must detect this (e.g. via a `can_edit` flag returned by the PC API) and redirect to the show page (`/#/games/:game_slug/pcs/:id`) instead of rendering the form.

## Solution
- Upon successful save, the page navigates to `/#/games/:game_slug/pcs/:id`.

---
See issue for details: https://github.com/darthjee/majora/issues/110
