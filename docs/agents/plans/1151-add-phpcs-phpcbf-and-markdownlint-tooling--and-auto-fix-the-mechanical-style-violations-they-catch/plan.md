# Plan: Add phpcs/phpcbf and markdownlint tooling, and auto-fix the mechanical style violations they catch

Issue: [1151-add-phpcs-phpcbf-and-markdownlint-tooling--and-auto-fix-the-mechanical-style-violations-they-catch.md](../issues/1151-add-phpcs-phpcbf-and-markdownlint-tooling--and-auto-fix-the-mechanical-style-violations-they-catch.md)

## Overview

Give this repo a local equivalent of the two Codacy checks it currently only sees after the fact: `phpcs`/`phpcbf` for `proxy/` and `markdownlint` for every `.md` file. Neither needs a brand-new toolchain — `phpcs`/`phpcbf` already ship inside the `darthjee/tent-test:0.10.4` image the `proxy` agent already tests against, they just have no ruleset yet; `markdownlint-cli2` is added fresh via a new root-level `package.json` (there is no existing home for it — `frontend/package.json` is scoped to `frontend/`). Both get wired into CircleCI as native jobs (no `docker-compose` inside CI, matching the existing `checks`/`frontend-checks`/`proxy_extension_tests` convention), and the same PR runs `phpcbf` and `markdownlint --fix` once to clear the 134 existing occurrences listed in the issue. No pre-commit hook — explicitly out of scope.

## Agents involved

- [proxy](proxy.md)
- [infra](infra.md)

## Shared contracts

None. `proxy`'s and `infra`'s changes touch disjoint file trees (`proxy/**` + a new `proxy/phpcs.xml` vs. a new root `package.json`/`dockerfiles/markdownlint/`/`docker-compose.yml`/`.circleci/config.yml`) and disjoint CircleCI jobs (an added step in the existing `proxy_extension_tests` job vs. a brand-new `markdownlint` job). Land in either order.
