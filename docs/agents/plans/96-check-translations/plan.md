# Plan: Check translations

Issue: [96-check-translations.md](../../issues/96-check-translations.md)

## Overview

Add a `translator` specialist agent responsible for the translation files under `frontend/assets/i18n/`, backed by a key-parity check script that the new agent runs locally and that CI also runs on every push. The actual check logic lives in the frontend project (where `js-yaml` is already a dependency) as a new Yarn script; the `translator` agent's own check wrapper and CI both invoke that Yarn script.

## Agents involved

- [frontend](frontend.md)
- [infra](infra.md)

## Shared contracts

- The frontend agent adds a Yarn script named `check_i18n` to `frontend/package.json` (alongside the existing `lint`/`lint_fix` scripts). It runs a Node script that loads every `*.yaml` file in `frontend/assets/i18n/`, flattens their keys, and exits non-zero (printing the missing/extra keys per file) if any file's key set differs from the others.
- The infra agent adds a `Check translations` step to the `frontend-checks` job in `.circleci/config.yml`, running `npm run check_i18n` right after the existing `Yarn install` step (same job, same container — no new CI job needed).
- Locally, the same command is invoked as `docker-compose run --rm majora_fe yarn check_i18n`.

## Architect steps (done directly, not delegated)

1. Add `.claude/agents/translator.md` — new specialist agent, scoped to `frontend/assets/i18n/` (translation YAML files) and the `check_i18n` script/wiring. Model it on the existing agent files (frontmatter + scope + commands), and have it shell out to `docker-compose run --rm majora_fe yarn check_i18n` for its own checks (same pattern as `check_frontend.sh`/`check_backend.sh`).
2. Add `.claude/scripts/check_translations.sh`:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   set -x

   docker-compose run --rm majora_fe yarn check_i18n
   ```
3. Update `.claude/agents/frontend.md` to note that `frontend/assets/i18n/` translation content is now owned by the `translator` agent (frontend keeps the Node script that implements the check, since it's part of the frontend toolchain, but no longer edits translation copy directly).
4. Update `AGENTS.md` and `docs/agents/architecture.md` (if it lists agents) to mention the new `translator` agent.
