# Plan: Change the switch for View as modal

Issue: [476-change-the-switch-for-view-as-modal.md](../issues/476-change-the-switch-for-view-as-modal.md)

## Overview
Replace the native "Simulate a different role" checkbox in the View As modal with a Bootstrap switch, and wrap the role options in an animated `Collapse` driven by the switch's `enabled` state, so role options only appear while the facade is active. Role selection state is untouched by this change, so it is naturally preserved across collapse/expand.

## Context
The View As modal (`ViewAsModal.jsx` + `ViewAsModalHelper.jsx` + `ViewAsModalController.js`) lets staff/admins simulate a `dm`/`player`/`owner` role. Today `ViewAsModalHelper.#renderEnabledCheckbox` renders a plain `<input type="checkbox">`, and `#renderRoleCheckbox` for each role is always rendered regardless of `state.enabled`. This is purely a presentational change inside `ViewAsModalHelper.jsx` — no state shape, controller logic, or store behavior needs to change, since `state.enabled` already exists and `state.roles` is already independent of it.

## Implementation Steps

### Step 1 — Swap the checkbox for a `Form.Check type="switch"`
In `ViewAsModalHelper.jsx`, replace the native `<input type="checkbox">` markup in `#renderEnabledCheckbox` with react-bootstrap's `Form.Check type="switch"` (import `Form` from `react-bootstrap/cjs/Form.js`, matching the existing `Modal` import style). Keep the same `id="view-as-modal-enabled"`, `checked={state.enabled}`, and `onChange={handlers.onToggleEnabled}` wiring, and keep the `view_as_modal.enabled_label` i18n label — no i18n changes needed.

### Step 2 — Wrap role options in an animated `Collapse`
In `#renderRoleCheckbox`'s call site inside `.render`, wrap the `ROLES.map(...)` output in react-bootstrap's `Collapse` component (`import Collapse from 'react-bootstrap/cjs/Collapse.js'`), with `in={state.enabled}`. `Collapse` requires a single DOM-element child, so wrap the mapped checkboxes in a `<div>` inside `Collapse`. This replaces the current always-rendered behavior with an animated expand/collapse tied to the switch.

### Step 3 — Update `ViewAsModalHelperSpec.js`
- Update the "renders the enabled checkbox..." test to query for the switch input instead (react-bootstrap's `Form.Check type="switch"` still renders an `<input type="checkbox" role="switch">` with the same `id`, so the existing `findElement` matcher by `id === 'view-as-modal-enabled'` should keep working — verify against the actual rendered element tree and adjust the matcher only if `Form.Check` nests the input differently than a bare `<input>`).
- Add/adjust a test asserting the role checkboxes are wrapped in `Collapse` with `in` reflecting `state.enabled` (e.g. `in={true}` when `enabled: true`, `in={false}` when `enabled: false`), using the existing `findElement`/`findAllElements` helpers.
- Confirm the existing "renders one checkbox per simulatable role..." test still passes unchanged in intent (role checkboxes are still found via `findAllElements`, just nested one level deeper under `Collapse`).

### Step 4 — Manual/visual check
Run the frontend dev server and open the View As modal from the header to confirm the switch renders correctly, toggling it animates the role list open/closed, and that checking roles, toggling the switch off then back on preserves the checked roles.

## Files to Change
- `frontend/assets/js/components/common/helpers/ViewAsModalHelper.jsx` — swap checkbox for `Form.Check type="switch"`; wrap role checkboxes in `Collapse` keyed off `state.enabled`.
- `frontend/specs/assets/js/components/common/helpers/ViewAsModalHelperSpec.js` — update/add assertions for the switch and the `Collapse` wrapper.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- No changes needed to `ViewAsModal.jsx`, `ViewAsModalController.js`, `AccessStore`, or any i18n file — `state.enabled`/`state.roles` already have the right shape and independence for this change.
- `react-bootstrap` 2.10.10 is already a project dependency; both `Form.Check type="switch"` and `Collapse` ship with it, so no new package is required.
