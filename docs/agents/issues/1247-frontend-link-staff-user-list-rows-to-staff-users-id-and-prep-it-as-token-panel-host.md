# Issue: Frontend — link staff user list rows to /#/staff/users/:id and prep it as token-panel host

## Description

Parent tracking issue: #1244 (Password Recovery Token Management Overhaul).

The route `/#/staff/users/:id` (`staffUser` -> `StaffUser.jsx` / `StaffUserHelper.jsx`) **already exists and is fully wired**: the `HashRouteResolver.js` route table, the `AppHelper.jsx` component map, `accessRouteConfig.js` (`staffOrSuperuser` gate), and the `staffUser` RequestStore resource (`staffUserConfig.js`). Today the detail page is reached **only** via the post-save redirect from the edit page, and `StaffUserHelper.render` shows just the user's name, email, and an "Edit" button.

## Problem

- The detail page is **unreachable from the `/#/staff/users` listing**. List rows expose action buttons (Edit -> `/#/staff/users/:id/edit`, Approve, Deny, Generate recovery link) but no navigation into the detail page; the name cell is plain text.
- Because the detail page is bare, the password-recovery-token panel that #1244's follow-up sub-issues add has no reachable, prepared page to build on.

## Expected Behavior

- Each `/#/staff/users` row's **name cell** links to `/#/staff/users/:id`, matching how other list pages link their rows.
- The existing per-row action buttons (Edit still goes to `/edit`, plus Approve / Deny / recovery-link) are **unchanged**.
- `StaffUserHelper.render` is refactored into composable sub-render methods (details block, actions, and a slot for the future recovery-token panel) so the follow-up sub-issues can add the panel without touching the other sections.
- The detail page shows the user's `status` as a badge, alongside name and email.
- Jasmine specs cover the new row link and the refactored detail page.

## Solution

1. **`StaffUsersHelper.jsx`** - in `#buildRow`, wrap `user.name` in `<a href={`#/staff/users/${user.id}`}>`; leave the `email` / `display_name` / `status` cells and `#renderRowActions` untouched.
2. **`StaffUserHelper.jsx`** - refactor `render` into composable private sub-render methods:
   - a user-details section (name, email, and now `status` as a badge, reusing `StaffUserStatusBadges` as the list does),
   - the "Edit" action,
   - a placeholder recovery-token-panel section (e.g. `#renderRecoveryTokenPanel` returning `null` for now), invoked from `render` at the position the follow-up sub-issues will fill in.
   `StaffUser.jsx` itself needs no change (it already passes the full `user` object through).
3. **Specs** - update `StaffUsersHelperSpec.js` for the name-cell link, and `StaffUserHelperSpec.js` for the status badge and the section structure.

This is deliberately small - it exists so the token-panel sub-issues have a reachable, prepared page to build on.

**Responsible agent:** `frontend`

**Dependencies:** none to start. **Blocks** the "list a user's recovery tokens" and "token management actions" sub-issues of #1244.

**Acceptance criteria:**
- [ ] Each `/#/staff/users` row's name cell links to `/#/staff/users/:id`
- [ ] The existing per-row action buttons are unchanged
- [ ] `StaffUserHelper.render` is split into sub-render sections with a placeholder slot for the recovery-token panel
- [ ] The detail page shows the user's status as a badge
- [ ] Jasmine specs cover the new row link and the refactored detail page
