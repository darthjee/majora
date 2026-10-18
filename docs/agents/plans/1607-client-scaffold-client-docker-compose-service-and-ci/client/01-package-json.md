# Add package.json and yarn.lock

Create `client/package.json`:

- `"name": "majora-client"`, `"version": "0.1.0"`, a short `description`, `"type": "module"`,
  `"main": "src/index.js"`, `"engines": { "node": ">=20" }`, `"license": "MIT"`,
  `"author": "darthjee"`, `repository` pointing at `darthjee/majora` with `"directory": "client"`.
- Public package: no `"private": true`.
- `"files": ["src/", "bin/", "README.md"]`.
- Scripts: `"test": "jasmine"`, `"lint": "eslint src specs"`, `"lint_fix": "eslint src specs --fix"`,
  `"coverage": "c8 jasmine"`.
- A `"c8"` block: `reporter: ["text", "lcov"]`, `report-dir: "coverage"`, `include: ["src/**/*.js"]`,
  `exclude: ["specs/**"]`, `all: true`.
- `devDependencies` only: `jasmine`, `c8`, `eslint` 9, `@eslint/js`, `globals`,
  `eslint-plugin-jsdoc`, `eslint-plugin-jasmine`, `eslint-plugin-security`,
  `eslint-plugin-security-node`, `eslint-plugin-complexity`, `eslint-plugin-no-unsanitized`, with
  versions aligned to `frontend/package.json`.

Generate and commit `client/yarn.lock` by running `yarn install` in the `majora_client` container
(`make client-install`).

## Files to Change

- `client/package.json` — new
- `client/yarn.lock` — new, generated
