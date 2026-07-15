# Issue: Change the switch for View as modal

## Description
The "View as" modal, opened from the header, lets a user simulate a different role. The control that enables/disables this simulation is currently a plain checkbox ("Simulate a different role"). It should be replaced with a switch, and the list of role options should collapse/expand based on the switch state.

## Problem
In `ViewAsModalHelper.jsx`, the enabled control is rendered as a native `<input type="checkbox">` (`#renderEnabledCheckbox`), and the role checkboxes (`#renderRoleCheckbox`) are always rendered regardless of `state.enabled`. This means role options remain visible even when the "simulate a different role" feature is turned off, which is visually cluttered and doesn't clearly communicate the on/off state.

## Expected Behavior
- The "Simulate a different role" control in the View As modal renders as a switch (toggle) instead of a checkbox.
- Turning the switch off collapses/hides the role options, with an animated transition.
- Turning the switch on expands/shows the role options, with an animated transition.
- Toggling the switch off and back on preserves any previously selected roles (they remain checked, just hidden while the switch is off).

## Solution
- Replace the checkbox markup in `ViewAsModalHelper.jsx` (`#renderEnabledCheckbox`) with react-bootstrap's `Form.Check type="switch"` (already a project dependency, consistent with the rest of the app's Bootstrap-based forms).
- Wrap the role checkboxes (`#renderRoleCheckbox`) in react-bootstrap's `Collapse` component, controlled by `state.enabled`, so they animate open/closed instead of toggling visibility instantly.
- Role selection state (`state.roles`) is left untouched when the switch is toggled, so it is preserved across collapse/expand.

## Benefits
Clearer visual indication of whether "simulate a different role" is active, a less cluttered modal when the feature is disabled, and a smoother, more polished interaction when toggling.
