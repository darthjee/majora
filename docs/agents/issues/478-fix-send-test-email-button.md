# Issue: Fix send test email button

## Description
The header currently renders a "Send test email" control as a full-text link/button (`frontend/assets/js/components/common/helpers/HeaderHelper.jsx`, `#renderAuthControl`), visible to any logged-in user. Clicking it calls `POST /users/test-email.json` (`backend/games/views/auth/email.py`), which currently only requires `IsAuthenticated` — any authenticated user, not just admins/staff, can trigger it.

## Problem
- The button shows full translated text in the nav, unlike other admin/staff-only header controls (e.g. the "View As" control), which are rendered as icon-only with accessible alt/title text.
- Both the frontend button and the backend endpoint are available to every authenticated user, not just admin (superuser) and staff, so any regular user can trigger a test email send.

## Expected Behavior
- The header shows an icon-only button using the Bootstrap Icons `bi-envelope-fill` glyph, with the current label text preserved as accessible alt/title text (same `aria-hidden` + `title` pattern already used by the "View As" icon).
- The button is only rendered for users who are admin (superuser) or staff — hidden entirely for other logged-in users, consistent with how `#renderStaffUsersNavLink` gates staff-only nav links.
- The backend endpoint `POST /users/test-email.json` only allows admin (superuser) or staff users; other authenticated users receive a 403.

## Solution
- **Frontend** (`HeaderHelper.jsx`): replace the full-text button content with an icon (`<i className={`bi ${Icons.envelope}`} aria-hidden="true"></i>`), keeping `title`/`aria-label` set to the existing `Translator.t('header.send_test_email')` text. Add a new `envelope: 'bi-envelope-fill'` entry to `frontend/assets/js/utils/ui/Icons.js`. Gate rendering on `state.isSuperUser || state.isStaff`.
- **Backend** (`backend/games/views/auth/email.py`): replace the `IsAuthenticated`-only check with the existing `require_staff(request)` helper from `backend/games/views/common.py`, which already encodes "superuser or staff" and returns 401/403 as appropriate.

## Benefits
- Consistent header UI: the send-test-email control matches the icon-only, admin/staff-gated style already used by the "View As" control.
- Restricts test-email sending to admins/staff, preventing regular users from triggering it.
- Reuses existing, tested permission and icon conventions rather than introducing new ones.
