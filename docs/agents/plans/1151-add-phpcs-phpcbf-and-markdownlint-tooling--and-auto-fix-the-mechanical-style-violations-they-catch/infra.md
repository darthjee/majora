# Infra Plan: Add phpcs/phpcbf and markdownlint tooling, and auto-fix the mechanical style violations they catch

Main plan: [plan.md](plan.md)

## Shared contracts

None — see [plan.md](plan.md)'s "Shared contracts" section. (If [proxy](proxy.md)'s Step 2 needs a `docker-compose.yml` change for the `proxy_tests` service, coordinate directly with proxy on that one edit — everything else in this file is independent.)

## Implementation Steps

### Step 1 — New root-level `package.json` for markdownlint

There is no root `package.json` today (only `frontend/package.json`, scoped to `frontend/`). Add one at the repo root, e.g.:

```json
{
  "name": "majora-dev-tooling",
  "private": true,
  "devDependencies": {
    "markdownlint-cli2": "^0.x"
  },
  "scripts": {
    "lint_md": "markdownlint-cli2",
    "lint_md_fix": "markdownlint-cli2 --fix"
  }
}
```

(Pin the actual `markdownlint-cli2` version at implementation time.)

### Step 2 — markdownlint config

Add `.markdownlint-cli2.jsonc` at the repo root, globbing `**/*.md` (covers `README.md`, everything under `docs/`, and `.claude/**/*.md` — all three appear in the issue's "Occurrences" list) while excluding `node_modules`, `frontend/node_modules`, and `docker_volumes`:

```jsonc
{
  "config": {
    "default": true
  },
  "globs": ["**/*.md"],
  "ignores": ["node_modules/**", "frontend/node_modules/**", "docker_volumes/**"]
}
```

**Open question to verify while implementing**: the issue's Codacy report only surfaces `MD032`/`MD022`/`MD012` violations, not the full markdownlint default rule set (`"default": true` enables ~50 rules, e.g. line-length `MD013`, heading style `MD003`, which would likely surface more than the issue's 65 markdown occurrences if the repo doesn't already conform to them by convention). Run `markdownlint-cli2` with the config above first; if it produces materially more findings than the issue's list, narrow `config` to only enable `MD032`/`MD022`/`MD012` (`"default": false` plus explicit `"MD032": true` etc.) to match what Codacy is actually configured to check, rather than silently expanding scope beyond this issue.

### Step 3 — Local docker image + docker-compose service (not published)

Add `dockerfiles/markdownlint/Dockerfile`, based on the already-published `darthjee/node:0.2.1` (same base `vite_majora-base` builds from) — unpublished, built locally only:

```dockerfile
FROM darthjee/node:0.2.1

WORKDIR /home/node/app
USER node
```

Add a `markdownlint` service to `docker-compose.yml`, mirroring `majora_fe`'s build-from-local-Dockerfile + cached-`node_modules`-volume pattern:

```yaml
  markdownlint:
    container_name: majora_markdownlint
    build:
      context: .
      dockerfile: dockerfiles/markdownlint/Dockerfile
    volumes:
      - .:/home/node/app
      - ./docker_volumes/markdownlint_node_modules:/home/node/app/node_modules
    command: sh -c "yarn install && yarn lint_md"
```

(Adjust exact mount/command shape as needed once package manager — yarn vs. npm — is settled; `frontend/` uses yarn, so match that for consistency.)

### Step 4 — Wire markdownlint into CircleCI

Add a new native job to `.circleci/config.yml`, matching `frontend-checks`' shape (prebuilt image, direct commands, no `docker-compose` in CI):

```yaml
  markdownlint:
    docker:
      - image: darthjee/circleci_node:0.2.1
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: yarn install
      - run:
          name: Check Markdown Lint
          command: yarn lint_md
```

Add `- markdownlint:` (with `filters: *all_tags`) to the `workflows.test.jobs` list. **Don't stop there** — `checks`/`frontend-checks`/`proxy_extension_tests` are also listed in the `requires:` of `build-and-release`, `upload_proxy_files`, `upload_fe_files`, `link_photos`, `link_files`, `upload_admin_assets`, and `wake-navi`; add `markdownlint` to those same `requires:` lists so it actually gates the release pipeline the same way the other checks do, rather than running informationally on the side.

### Step 5 — Run `markdownlint --fix` once to clear the existing markdown occurrences

Using the new tooling (`docker-compose run --rm markdownlint yarn lint_md_fix`, or equivalent), auto-fix the `markdownlint_MD032` (29), `markdownlint_MD022` (18), and `markdownlint_MD012` (18) occurrences listed in the issue's "Occurrences" section — across `README.md`, `.claude/agents/translator.md`, and the `docs/agents/**` files listed there. Purely mechanical blank-line fixes; spot-check a couple of the affected files afterward to confirm no unrelated reflow happened.

## Files to Change

- `package.json` (new, repo root) — Step 1
- `.markdownlint-cli2.jsonc` (new, repo root) — Step 2
- `dockerfiles/markdownlint/Dockerfile` (new) — Step 3
- `docker-compose.yml` — add `markdownlint` service — Step 3
- `.circleci/config.yml` — add `markdownlint` job + wire into `workflows.test.jobs` and the downstream `requires:` lists — Step 4
- The ~51 non-proxy files listed in the issue's "Occurrences" section (`README.md`, `.claude/agents/translator.md`, `docs/agents/**`) — mechanical `markdownlint --fix` fixes only (Step 5)

## CI Checks

- repo-wide `**/*.md`: `yarn lint_md` (CI job: `markdownlint`, new)

## Notes

- No pre-commit hook — explicitly out of scope per the issue (no pre-commit infrastructure exists in this repo today; left for a separate issue).
- Yarn vs. npm: `frontend/package.json` uses yarn (`yarn.lock`, `yarn install` in CI). Match that at the root for consistency rather than mixing package managers.
