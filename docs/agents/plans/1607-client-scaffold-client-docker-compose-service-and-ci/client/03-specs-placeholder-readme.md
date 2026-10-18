# Add the Jasmine/c8 setup, placeholder module, spec and README

- `client/specs/support/jasmine.json`: `spec_dir: "specs"`, `spec_files: ["**/*[sS]pec.js"]`,
  `env.random: true`.
- `client/src/index.js`: a minimal, JSDoc-documented placeholder export (for example a `VERSION`
  constant, or a function that returns the package name) that the library work in #1608 replaces.
  It keeps `files`, the coverage report and `npm pack --dry-run` meaningful.
- `client/specs/index_spec.js`: a spec covering that export, so coverage is 100%.
- `client/README.md`: what `majora-client` is (Node.js library and CLI for the Majora API using
  scoped `mjr_...` tokens, Node 20 or later, no runtime dependencies), a note that it is under
  construction, the development commands (`make client-install`, `client-tests`, `client-lint`,
  `client-coverage`, `client`), and a link to `docs/agents/specs/client.md`. It must pass the
  repository's markdownlint rules (MD012, MD022, MD032).

Run `make client-lint`, `make client-coverage` and, in `make client`,
`npm pack --dry-run`, and confirm all three pass.

## Files to Change

- `client/specs/support/jasmine.json` — new
- `client/src/index.js` — new
- `client/specs/index_spec.js` — new
- `client/README.md` — new
