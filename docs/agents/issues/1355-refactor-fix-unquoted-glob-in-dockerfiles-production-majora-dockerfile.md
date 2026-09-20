# Issue: Refactor: fix unquoted glob in dockerfiles/production_majora/Dockerfile

## Description
Codacy's Hadolint scan (`SC2035`, ErrorProne, High severity) flags `dockerfiles/production_majora/Dockerfile:15` — `RUN rm -rf */tests` — because the glob `*/tests` isn't prefixed with `./` or `--`. A directory whose name starts with `-` would be interpreted by `rm` as an option instead of a path.

## Problem
The unprefixed glob `*/tests` in the `builder` stage can, in theory, expand to something that `rm -rf` treats as a flag. Codacy reports it as a High-severity finding on this file.

## Expected Behavior
The glob is written as `./*/tests` so every expansion is unambiguously a path. The `builder` stage still removes the `tests` directories under the app's top-level directories exactly as before, and Codacy's `SC2035` finding clears for this file.

## Solution
Infra: change line 15 of `dockerfiles/production_majora/Dockerfile` from `RUN rm -rf */tests` to `RUN rm -rf ./*/tests` (the `./` prefix is behavior-preserving, since the working directory is unchanged). No other unprefixed globs exist in the repo's Dockerfiles. Confirm the `production_majora` image still builds.

### Acceptance criteria
- [ ] The flagged glob at Dockerfile:15 is prefixed with `./` (`rm -rf ./*/tests`)
- [ ] The `production_majora` image still builds successfully
- [ ] Codacy's Hadolint `SC2035` finding clears for this file
