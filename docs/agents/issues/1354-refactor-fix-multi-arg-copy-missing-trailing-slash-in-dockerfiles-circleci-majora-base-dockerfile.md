# Issue: Refactor: fix multi-arg COPY missing trailing slash in dockerfiles/circleci_majora-base/Dockerfile

## Description
Codacy's Hadolint scan (`DL3021`, ErrorProne, High severity) flags `dockerfiles/circleci_majora-base/Dockerfile:12`: a `COPY` instruction with more than 2 arguments whose last argument (the destination) does not end with `/`.

```dockerfile
COPY --chown=circleci:circleci \
  ./backend/pyproject.toml ./backend/poetry.lock* \
  /home/circleci/project
```

## Problem
Docker requires the destination to be an existing directory ending in `/` when copying multiple sources at once; otherwise the build can fail or behave unexpectedly depending on the Docker version/builder. This is the only multi-source `COPY` under `dockerfiles/` missing the trailing slash — the equivalent instructions in `majora`, `majora-base`, `production_majora-base`, `vite_majora` and `vite_majora-base` already end in `/`.

## Expected Behavior
The destination of the flagged `COPY` ends with `/`, the `circleci_majora-base` image still builds, and Codacy's Hadolint `DL3021` finding clears for this file.

## Solution
Infra: change the destination at `dockerfiles/circleci_majora-base/Dockerfile:12` from `/home/circleci/project` to `/home/circleci/project/`, and confirm the image still builds via the CircleCI base-image job.

### Acceptance criteria

- [ ] The flagged COPY instruction's destination ends with a trailing `/`
- [ ] The `circleci_majora-base` image still builds successfully
- [ ] Codacy's Hadolint `DL3021` finding clears for this file
