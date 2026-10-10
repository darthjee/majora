# Refactor: fix unquoted glob in dockerfiles/production_majora/Dockerfile

## Context

Codacy's Hadolint scan (`SC2035`, ErrorProne, High severity) flags `dockerfiles/production_majora/Dockerfile:15` for a glob pattern that isn't prefixed with `./` or `--`, so filenames starting with `-` could be misinterpreted as command options instead of filenames.

## What needs to be done

Infra: update the shell command at `dockerfiles/production_majora/Dockerfile:15` to prefix its glob with `./` (or `--`) per Hadolint's `SC2035` guidance, and confirm the production image still builds.

## Acceptance criteria

- [ ] The flagged glob at Dockerfile:15 is prefixed with `./` or `--`
- [ ] The `production_majora` image still builds successfully
- [ ] Codacy's Hadolint `SC2035` finding clears for this file
