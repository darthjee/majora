# Extract FilterActions

Create a shared component rendering the Query and Clear buttons that five filter helpers
currently duplicate, so the new Tasks filter bar and the existing ones share one implementation.

`FilterActions({ onQuery, onClear, testIdPrefix })` returns a fragment with two `col-auto`
wrappers:

- A Query button: `type="button"`, `className="btn btn-primary"`, test id
  `<testIdPrefix>-filter-query`, `onClick={onQuery}`, labelled
  `Translator.t('filter_actions.query')`.
- A Clear button: `type="button"`, `className="btn btn-outline-secondary"`, test id
  `<testIdPrefix>-filter-clear`, `onClick={onClear}`, labelled
  `Translator.t('filter_actions.clear')`.

Match the markup of `NpcFiltersHelper.#renderActions` exactly and document the component with a
JSDoc block like `FilterSelect`'s. Add a spec covering both test ids, both labels, the button
classes, and that clicking each calls the matching handler.

## Files to Change

- `frontend/assets/js/components/common/forms/FilterActions.jsx` — new component.
- `frontend/specs/assets/js/components/common/forms/FilterActionsSpec.js` — new spec.
