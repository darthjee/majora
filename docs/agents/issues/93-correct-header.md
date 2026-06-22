# Issue: Correct header

## Description
The header (`frontend/assets/js/components/elements/helpers/HeaderHelper.jsx`) is not using Bootstrap correctly and thus does not feel like a proper header. It currently renders plain `<header>`, `<nav>`, and `<ul>/<li>` markup with no Bootstrap layout/utility classes, unlike other Bootstrap-based components in the app.

## Problem
- The `<header>` element has no Bootstrap container/navbar structure.
- The `<nav>` and `<ul>/<li>` navigation list are unstyled, with no `navbar`, `navbar-nav`, or `nav-item`/`nav-link` classes.
- The title/subtitle and auth controls are not laid out using Bootstrap's navbar conventions (e.g. `navbar-brand`), so the header does not look or behave like a proper navigation bar.

## Expected Behavior
- The header should use proper Bootstrap navbar markup and classes so it renders as a cohesive, properly styled navigation header.
- Title, navigation links, auth controls (login/logoff/send test email), and the language selector should be visually organized following Bootstrap navbar conventions.

## Solution
- Update `HeaderHelper.jsx`'s `render` (and `#renderAuthControl`/`#renderTestEmailStatus`) to wrap the existing structure with Bootstrap navbar classes (e.g. `navbar`, `navbar-expand`, `navbar-brand`, `navbar-nav`, `nav-item`, `nav-link`, `container`/`container-fluid`).
- Keep existing `data-testid` attributes and behavior (handlers, translations) unchanged so existing specs (`HeaderHelperSpec.js`) continue to pass.

---
See issue for details: https://github.com/darthjee/majora/issues/93
