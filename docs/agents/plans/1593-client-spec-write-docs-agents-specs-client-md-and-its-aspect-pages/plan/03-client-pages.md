# Client aspect pages

Write the three client-side pages using the shared template.

- **`library.md`**:
  - Decisions:
    - plain JavaScript with ES modules and JSDoc types, no build step;
    - native `fetch`, Node 20 or later;
    - `new MajoraClient({ baseUrl, token })`, falling back to `MAJORA_URL` and `MAJORA_TOKEN`;
    - a Bearer header on every request;
    - a shared HTTP layer with pagination (see `docs/agents/pagination.md`) and typed errors;
    - a generic core plus a first set of resource wrappers.
  - Say that `client/` is unrelated to `frontend/assets/js/client/`.
  - Open questions (#1598): which resources come first (likely game content: characters,
    factions, documents, items), the actions per resource, and the error class hierarchy.
- **`cli.md`**:
  - Decisions: a thin CLI built on the library, configured through `MAJORA_URL` and
    `MAJORA_TOKEN`.
  - Open questions (#1599): the command grammar, output format, flags, and exit codes.
- **`packaging.md`**:
  - Decisions:
    - a `client` docker-compose service (no host runtimes);
    - CircleCI lint and test jobs;
    - a public npm release, triggered when `client/package.json`'s version changes on `main`;
    - the job fails if that version already exists;
    - the npm token is stored in CircleCI's environment.
  - Open questions (#1600): the package name (check which names are free), the test runner and
    lint setup, Makefile targets, and the base image.

## Files to Change

- `docs/agents/specs/client/library.md`: new.
- `docs/agents/specs/client/cli.md`: new.
- `docs/agents/specs/client/packaging.md`: new.
