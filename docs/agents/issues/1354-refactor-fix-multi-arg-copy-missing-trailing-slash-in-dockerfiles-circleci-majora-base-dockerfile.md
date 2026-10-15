# Refactor: fix multi-arg COPY missing trailing slash in dockerfiles/circleci_majora-base/Dockerfile

## Context

Codacy's Hadolint scan (`DL3021`, ErrorProne, High severity) flags `dockerfiles/circleci_majora-base/Dockerfile:12` — a `COPY` instruction with more than 2 arguments whose last argument doesn't end with `/`. Docker requires the destination to be an existing directory ending in `/` when copying multiple sources at once; otherwise the build can fail or behave unexpectedly depending on the Docker version/builder.

## What needs to be done

Infra: update the `COPY` instruction at `dockerfiles/circleci_majora-base/Dockerfile:12` so its destination argument ends with `/`, and confirm the image still builds via the CircleCI base-image job.

## Acceptance criteria

- [ ] The flagged COPY instruction's destination ends with a trailing `/`
- [ ] The `circleci_majora-base` image still builds successfully
- [ ] Codacy's Hadolint `DL3021` finding clears for this file
