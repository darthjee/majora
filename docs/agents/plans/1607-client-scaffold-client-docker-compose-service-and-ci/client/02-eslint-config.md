# Add the ESLint flat config

Create `client/eslint.config.mjs`, mirroring `frontend/eslint.config.mjs` minus everything
React-specific (the `react` and `react-hooks` plugins and rules, JSX parser options and the React
version setting):

- Ignores `node_modules/**` and `coverage/**`.
- `js.configs.recommended`, then the same core rules (complexity, max-lines, max-depth, indent,
  quotes, semi, `no-unused-vars` with the `^_` pattern, `no-console`, eqeqeq, no-var, prefer-const,
  no-empty-function), the jsdoc rules, the security / security-node rules and the no-unsanitized
  rules.
- `languageOptions`: `ecmaVersion: 'latest'`, `sourceType: 'module'`, `globals.node` and
  `globals.es2021` (no browser globals: this is a Node library).
- A `specs/**` override that enables the Jasmine plugin and globals and turns off the jsdoc rules,
  as the frontend does.

## Files to Change

- `client/eslint.config.mjs` — new
