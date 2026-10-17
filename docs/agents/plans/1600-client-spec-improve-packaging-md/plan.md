# Plan: Client spec: improve packaging.md

Issue: [1600-client-spec-improve-packaging-md.md](../../issues/1600-client-spec-improve-packaging-md.md)

## Overview

Docs-only change. Rewrite `docs/agents/specs/client/packaging.md` so it records every decision
settled in #1600 (package name, image, tooling, Makefile targets, docker-compose service, CI jobs
and gating, the release-with-the-app flow, `bump_version.sh client`, and the defaults for the
remaining concerns), leaves no open questions, and is ready to drive #1607 and #1611. Then align
the hub `docs/agents/specs/client.md`.

## Context

`packaging.md` was written by #1593 with five open questions and a release flow on `main`,
separate from the app release. #1600 replaced that flow: the client is released in the app's tag
workflow, publishing only when `client/package.json`'s version differs from the previous app tag.
Every aspect page follows the template **Overview**, **Decisions**, **Open questions**,
**Affected code** (see the hub). The sibling improvements (#1597, #1598, #1599) settled their open
questions by moving them into **Decisions** and noting the settling issue in the hub's
**Aspect pages** list.

## Implementation Steps

### Step 1 — Rewrite `packaging.md`

Keep the page's structure and the opening paragraph (update the "Refined by #1600" sentence to
say the page was settled by #1600).

- **Overview**: state that the package is `majora-client`, released together with the app on its
  version tags.
- **Decisions**, as subsections, transcribing the issue's Solution:
  - **Package name**: `majora-client`, unscoped; why (matches `navi-hey`, `navi-hey-client`, ...;
    `majora` is taken).
  - **Development**: the `majora_client` service exactly as specified in the issue (YAML block),
    with the bullets on no Dockerfile, the `client_node_modules` volume and `.gitignore`, yarn
    with a committed `client/yarn.lock`, no `depends_on`, the `MAJORA_*` wiring for manual CLI
    smoke runs, and the unrelaxed HTTPS rule (`--allow-insecure-http`). Node 22 from
    `darthjee/node:0.2.1`; the library needs Node 20 or later.
  - **Tooling**: Jasmine under `client/specs/`, c8 with lcov to Codacy (partial), ESLint 9 flat
    config mirroring the frontend minus React plugins; dev dependencies only.
  - **Makefile**: the five-target table (`client`, `client-install`, `client-tests`,
    `client-lint`, `client-coverage`), no `client-release`, new `# ── Client ──` section and
    `.PHONY` entries.
  - **CI**: `client_tests` and `client_checks` on every push and tag in
    `darthjee/circleci_node:0.2.1`; `client_checks` also runs `npm pack --dry-run`; full gate
    (both join the `requires` of every app release job, like `crawler_extension_tests`);
    `coverage-final` requires `client_tests`.
  - **Release**: replace the old bullets with the `client-release` job: app tag workflow,
    requires the full list, previous-tag comparison of `client/package.json`'s `version`
    (equal → skip, different or no previous → publish), fail if already on npm or lower than
    `latest`, recovery by re-running on the same tag, no client git tag (unanchored app tag
    filter), automation token in CircleCI env written to `~/.npmrc` only in the job, no
    `--provenance`, `files` whitelist (`src/`, `bin/`, `README.md`), no changelog. Note that this
    is the interim flow ("for now"), replacing the earlier "on version change on `main`" design.
  - **Versioning**: `scripts/bump_version.sh client <X.Y.Z>` updates only `client/package.json`;
    the plain form never touches the client; the client version is independent of the app's.
  - **Implementation split**: #1607 (scaffold, service, `.gitignore`, Makefile, CI lint/test
    jobs and gating) and #1611 (`client-release` job and the `bump_version.sh client` form);
    #1611 lands after #1608, so the first published version is whatever `client/package.json`
    holds then (e.g. `0.1.0`).
- **Open questions**: none remain; state "None. #1600 settled all of them." (mirroring how the
  sibling pages closed theirs).
- **Affected code**: `docker-compose.yml` (`majora_client`), `.gitignore`
  (`docker_volumes/client_node_modules/`), `.circleci/config.yml` (`client_tests`,
  `client_checks`, `client-release`, `requires` lists of release jobs and `coverage-final`),
  `Makefile`, `scripts/bump_version.sh`, `client/package.json` (name, version, `files`, `bin`,
  `engines`, scripts), `client/yarn.lock`, `client/eslint.config.mjs`. Drop `dockerfiles/`.

### Step 2 — Align the hub `client.md`

In **Aspect pages**, extend the Packaging entry with a sentence like the siblings': "#1600
settled the package name (`majora-client`), the `majora_client` service, the CI jobs and the
release with the app's version tags." No change to the sub-issue table or the order (#1611 after
#1608 already holds).

## Files to Change

- `docs/agents/specs/client/packaging.md`: rewritten with every #1600 decision; no open questions.
- `docs/agents/specs/client.md`: Packaging entry in **Aspect pages** notes what #1600 settled.

## CI Checks

- Markdown: `docker-compose run --rm markdownlint` (CI job: `markdownlint`).

## Notes

- Docs only; no code, config or CI file is touched by this issue. #1607 and #1611 implement it.
- Keep lines wrapped near 100 characters like the rest of the spec pages, and keep the YAML block
  fenced as `yaml` so markdownlint passes.
