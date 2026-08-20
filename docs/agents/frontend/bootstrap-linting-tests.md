## Bootstrap

Bootstrap 5 is imported globally in `main.jsx` and used directly via its CSS classes on JSX
elements (grid, cards, alerts, pagination, spacing) — no custom wrapper components beyond
what's already listed above.

## Linting and Documentation

ESLint (`frontend/eslint.config.mjs`) enforces JSDoc on all public classes, methods, and exported
functions under `assets/js/`. Every JSDoc block must include:

- A prose description as the first line.
- `@param {type} name description` for each parameter.
- `@returns {type} description` for every non-void function.

Private class fields (`#method`) are documented but not enforced (`publicOnly: true`).
JSDoc requirements are disabled for spec files.

## Tests

Spec files live in `specs/` and mirror the `assets/js/` directory structure. Run with:

```bash
cd frontend && yarn test
```

For rendering-based tests, import `renderToStaticMarkup` from `react-dom/server` and assert
on the resulting HTML string. For controller tests, instantiate the controller directly and
call `buildEffect()()`, then flush promises with `await new Promise(r => setTimeout(r, 0))`.
