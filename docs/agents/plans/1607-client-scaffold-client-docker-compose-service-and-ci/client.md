# Client Plan: Client: scaffold client/, docker-compose service and CI

Main plan: [plan.md](plan.md)

## Shared contracts

- **Rely on** the `majora_client` service (infra step 01) to run `yarn` (never on the host). If it
  is not merged yet, use the equivalent one-off
  `docker run --rm -v "$PWD/client:/home/node/app" -w /home/node/app darthjee/node:0.2.1 yarn ...`.
- **Produce** the `package.json` scripts `test`, `lint` and `coverage` (lcov at
  `client/coverage/lcov.info`), a committed `client/yarn.lock` that works with
  `yarn install --frozen-lockfile`, and a package for which `npm pack --dry-run` passes and lists
  only `package.json`, `README.md` and `src/` files.

## Steps

- [01 — Add package.json and yarn.lock](client/01-package-json.md)
- [02 — Add the ESLint flat config](client/02-eslint-config.md)
- [03 — Add the Jasmine/c8 setup, placeholder module, spec and README](client/03-specs-placeholder-readme.md)

## CI Checks

- `client/`: `make client-lint` (CI job: `client_checks`, which also runs `npm pack --dry-run`)
- `client/`: `make client-coverage` (CI job: `client_tests`)

## Notes

- No runtime `dependencies` at all; only `devDependencies`.
- No `bin` entry yet; the CLI and `bin/majora.js` come in a later sub-issue. `files` still lists
  `bin/` as the spec requires.
- Do not touch anything outside `client/`.
