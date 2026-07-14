# Frontend Plan: Fix send test email button

Main plan: [plan.md](plan.md)

## Shared contracts

- The button still calls `POST /users/test-email.json` through the existing
  `onSendTestEmailClick` handler — no request/response shape changes on this side. The
  only backend-driven behavior change is that the endpoint now 403s for non-staff/
  non-superuser callers, but since the button is now hidden for those users, this path
  should not normally be hit from the UI.
- Reuse the existing `header.send_test_email` translation key verbatim as the icon's
  `title` (no new i18n keys, no translator involvement needed).

## Implementation Steps

### Step 1 — Add the envelope icon

In `frontend/assets/js/utils/ui/Icons.js`, add `envelope: 'bi-envelope-fill'` to the
exported mapping (alongside the existing `viewAs: 'bi-file-person-fill'` entry).

### Step 2 — Gate and restyle the send-test-email control

In `frontend/assets/js/components/common/helpers/HeaderHelper.jsx`,
`#renderAuthControl`:
- Wrap the send-test-email `<button>` so it only renders when
  `state.isSuperUser || state.isStaff` (same gating condition used by
  `#renderStaffUsersNavLink`).
- Replace the button's text content
  (`{Translator.t('header.send_test_email')}`) with an icon:
  `<i className={`bi ${Icons.envelope}`} aria-hidden="true"></i>`, and add
  `title={Translator.t('header.send_test_email')}` (and `aria-label` for consistency with
  how `#renderViewAsLink`'s icon exposes its accessible text via `title`) to the
  `<button>` element itself, keeping `data-testid="send-test-email"` and the existing
  `onClick={handlers.onSendTestEmailClick}` unchanged.
- Update the JSDoc `@param` type for `state` on `#renderAuthControl` (and the top-level
  `render` doc if it lists the same fields) only if needed for accuracy — `isSuperUser`/
  `isStaff` are already documented on `render`'s state param, just not yet on
  `#renderAuthControl`'s narrower one; add them there too since the gating now reads them.

### Step 3 — Update specs

In `frontend/specs/assets/js/components/common/helpers/HeaderHelper/testEmailSpec.js`:
- Update "renders the send-test-email link when logged in" (and any other test that
  renders the button while logged in) to also pass `isSuperUser: true` (or `isStaff:
  true`) in the state override, since `loggedIn: true` alone no longer renders the
  button.
- Add a new test asserting the button is absent when `loggedIn: true` but both
  `isSuperUser: false` and `isStaff: false` (the `support.js` defaults already have both
  false, so `render({ loggedIn: true })` alone should now assert absence — repurpose or
  add to the existing "does not render... when logged out" test file structure).
- Replace the text assertion `expect(html).toContain('Send test email')` with an
  assertion on the icon markup/class (e.g. `bi-envelope-fill`) and/or the `title`
  attribute carrying that same translated text, mirroring how the "View As" icon is
  tested elsewhere in this spec directory (check `HeaderHelper/viewAs*Spec.js` or
  similar, if present, for the exact assertion style used for that icon).
- Check `frontend/specs/assets/js/components/common/HeaderSpec.js` too, since it also
  references `send-test-email` — update any state fixtures there the same way if it
  currently relies on a plain `loggedIn: true` user seeing the button.

## Files to Change

- `frontend/assets/js/utils/ui/Icons.js` — add the `envelope` icon mapping.
- `frontend/assets/js/components/common/helpers/HeaderHelper.jsx` — icon-only,
  staff/superuser-gated send-test-email control.
- `frontend/specs/assets/js/components/common/helpers/HeaderHelper/testEmailSpec.js` —
  update fixtures/assertions for the new gating and icon markup.
- `frontend/specs/assets/js/components/common/HeaderSpec.js` — update fixtures if it
  exercises the send-test-email button under a plain logged-in (non-staff) state.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`).
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`).

## Notes

- Do not introduce a new translation key — the existing `header.send_test_email` text
  moves from visible link text to the `title`/accessible-label attribute only.
- Double-check whether `HeaderHelper.jsx`'s `render`/`#renderAuthControl` JSDoc already
  lists `isSuperUser`/`isStaff` for the narrower helper before adding a redundant entry.
