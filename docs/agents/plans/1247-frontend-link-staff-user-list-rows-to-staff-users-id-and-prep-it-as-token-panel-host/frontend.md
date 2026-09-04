# Frontend Plan: Frontend — link staff user list rows to /#/staff/users/:id and prep it as token-panel host

Main plan: [plan.md](plan.md)

## Shared contracts

Consume the new i18n key produced by the `translator` agent:

- `Translator.t('staff_user_page.status_label')` → `"Status"` (label for the detail-page status row).

Reuse the existing `StaffUserStatusBadges` class for the badge itself — it already maps
`pending` / `approved` / `denied` to a Bootstrap variant + the translated
`staff_users_page.status_*` text. No new status-text keys.

## Implementation Steps

### Step 1 — Link the row name cell to the detail page

In `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelper.jsx`,
`#buildRow(user)` currently sets `name: user.name` (plain text). Wrap it in an anchor to the
detail route, matching the `#/staff/users/${user.id}/edit` style already used for the row's Edit
button:

```jsx
name: <a href={`#/staff/users/${user.id}`}>{user.name}</a>,
```

Leave `email`, `display_name`, `status`, the `user` passthrough, and `#renderRowActions`
(Edit / Approve / Deny / recovery-link) untouched. `Table` / `TableHelper` already render a cell
value that is a React node, so no `Table` change is needed.

Spec — `frontend/specs/assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelperSpec.js`:
add a case under `.render` asserting the name cell links to the detail page, e.g.
`expect(html).toContain('href="#/staff/users/1"')`. Keep the existing
`href="#/staff/users/1/edit"` assertion — guard the new assertion so it can't be satisfied by the
Edit link alone (the Edit href contains `#/staff/users/1` as a prefix): assert the exact
`<a href="#/staff/users/1">Jane</a>` shape, or that the rendered markup contains
`href="#/staff/users/1"` followed by `>Jane<`.

### Step 2 — Refactor `StaffUserHelper.render` into sections, add status badge + panel slot

In `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx`, break
the single `render(user)` body into composable private static methods and assemble them in
`render`:

- `#renderDetails(user)` — the name paragraph, the email paragraph, and a new **status** row:
  a `staff_user_page.status_label` label plus `<Badge variant={badge.variant} text={badge.text} />`
  where `badge = StaffUserStatusBadges.build(user.status)`. Import `Badge` from
  `../../../../common/badges/Badge.jsx` and `StaffUserStatusBadges` from
  `../../../../common/list_types/StaffUserStatusBadges.js` (same paths `StaffUsersHelper` uses).
- `#renderEditAction(user)` — the existing `#/staff/users/${user.id}/edit` button.
- `#renderRecoveryTokenPanel(user)` — **placeholder returning `null`** for now; invoked from
  `render` at the position the follow-up sub-issue will fill (after the details block, before or
  after the Edit action — put it after the details block so the panel reads as page content).

`render` keeps the outer `container` / `BackButton` / `<h1>` wrapper and now just composes
`#renderDetails`, `#renderRecoveryTokenPanel`, and `#renderEditAction`. `renderLoading` /
`renderError` are unchanged. `StaffUser.jsx` is unchanged (already passes the full `user`).

Keep each method within the frontend conventions (JSDoc with `@param` / `@returns` /
`@description` on each new private method, 2-space indent, single quotes, file under 300 lines,
complexity ≤ 10).

Spec — `frontend/specs/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelperSpec.js`:
- Add `status` to the `user` fixture (e.g. `status: 'approved'`).
- Keep the existing assertions (name, email, edit link, back button).
- Add a case asserting the status badge renders — the translated label plus the badge variant
  class, e.g. `expect(html).toContain('Approved')` and `expect(html).toContain('bg-success')`
  (mirrors how `StaffUsersHelperSpec` asserts `bg-warning` / `Pending`).
- Add a case asserting `render` still succeeds when `#renderRecoveryTokenPanel` contributes
  nothing (i.e. the page renders with the slot returning `null`) — a lightweight guard that the
  section wiring is in place for the follow-up sub-issue.

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelper.jsx` — link the name cell in `#buildRow`
- `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx` — split `render` into `#renderDetails` / `#renderEditAction` / `#renderRecoveryTokenPanel` (null slot), add the status badge row
- `frontend/specs/assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelperSpec.js` — assert the row name cell links to `/#/staff/users/:id`
- `frontend/specs/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelperSpec.js` — add `status` to the fixture, assert the status badge, assert render works with the empty panel slot

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Do not touch `frontend/assets/i18n/**` — the `staff_user_page.status_label` key is added by the
  `translator` agent. If specs run before that key exists, the label assertion may see a missing
  translation; coordinate ordering so the translator change lands first (or is included in the
  same branch).
- No new reusable component is warranted here — per the frontend agent's "component vs. helper
  method" guidance, these are optional/among-siblings blocks inside a single helper's render, so
  private `#renderX` static methods are the right call.
