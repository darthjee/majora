# Infra Plan: Docker images run as root (missing/misplaced USER directive)

Main plan: [plan.md](plan.md)

## Overview

Both Semgrep (`dockerfile.security.missing-user`) and Hadolint (`DL3002`) evaluate each `FROM ... AS <stage>` block independently — they don't track the effective runtime user across multi-stage inheritance. Confirmed by running both linters locally and inspecting the external parent images (`docker inspect ... --format '{{.Config.User}}'`):

- The `base` stage in `dockerfiles/majora-base/Dockerfile` and `dockerfiles/production_majora-base/Dockerfile` declares `CMD` without ever setting `USER` in that same block (Semgrep finding).
- The `builder` stage in `dockerfiles/vite_majora/Dockerfile` and `dockerfiles/vite_majora-base/Dockerfile` sets `USER root` for a build step and never resets it before the block ends (Hadolint finding).

In every one of the 4 files, the **final stage that actually ships as the running container already ends in a non-root `USER`** (`USER app` / `USER node`), so there is no real runtime risk today — this plan only adds explicit `USER` directives to the flagged intermediate/base blocks.

## Implementation Steps

### Step 1 — Add `USER app` to the `base` stage in the two majora-base Dockerfiles

In `dockerfiles/majora-base/Dockerfile`, add `USER app` immediately after `FROM darthjee/django:0.0.2 as base` (line 2) and before `CMD ["bin/server.sh"]` (line 4). Apply the identical change to `dockerfiles/production_majora-base/Dockerfile`.

`darthjee/django:0.0.2` already defaults to `USER app`, so this doesn't change behavior — it just makes the user explicit so Semgrep stops flagging the block.

### Step 2 — Add a trailing `USER node` to the `builder` stage in the two vite Dockerfiles

In `dockerfiles/vite_majora/Dockerfile`, add `USER node` immediately after `RUN /bin/bash yarn_builder.sh` (line 16) and before the next `FROM base` (line 20). Apply the identical change to `dockerfiles/vite_majora-base/Dockerfile` (after its `RUN /bin/bash yarn_builder.sh` on line 20, before `FROM base` on line 24).

These `builder` stages are discarded after the build (their artifacts are pulled out via `COPY --from=builder`), so this has zero runtime effect — it only changes what Hadolint sees as the "last USER" in that block.

### Step 3 — Verify no regression

1. Run hadolint and the semgrep `p/dockerfile` ruleset against all 4 edited files; expect 0 `DL3002` / `dockerfile.security.missing-user` findings.
   ```bash
   docker run --rm -i hadolint/hadolint < dockerfiles/vite_majora/Dockerfile
   docker run --rm -i hadolint/hadolint < dockerfiles/vite_majora-base/Dockerfile
   ```
2. Build each of the 4 Dockerfiles standalone to confirm they still build (adding `USER app`/`USER node` doesn't break subsequent `COPY --chown=...`/`RUN` steps in dependent stages, since those already run as the same user).
3. Confirm the shipped runtime user is unchanged: `docker-compose run --rm <service> whoami` for the services built from `dockerfiles/majora/Dockerfile` and `dockerfiles/vite_majora/Dockerfile` (which build on top of `majora-base`/`vite_majora-base`) should still print `app` / `node` respectively.

## Files to Change

- `dockerfiles/majora-base/Dockerfile` — add `USER app` in the `base` stage, before `CMD`
- `dockerfiles/production_majora-base/Dockerfile` — add `USER app` in the `base` stage, before `CMD`
- `dockerfiles/vite_majora/Dockerfile` — add trailing `USER node` at the end of the `builder` stage
- `dockerfiles/vite_majora-base/Dockerfile` — add trailing `USER node` at the end of the `builder` stage

No changes to: the `scripts` stage in any file; the already-correct `builder`/final stages of the two `majora-base` files; the `base` stage of `vite_majora-base` (already correctly does `USER root` → `apt-get install rsync` → `USER node`); the final stages of the two vite files (already end in `USER node`); or the dependent `dockerfiles/majora/Dockerfile` and `dockerfiles/production_majora/Dockerfile` (their only `RUN` steps already execute after `USER app`).

## Notes

- These findings are effectively linter false positives with respect to actual runtime risk — the fix is about making the intended user explicit in every stage block rather than closing a real root-exposure gap.
- No `docker-compose.yml` bind-mount or `.circleci/config.yml` step was found to assume the container runs as root, so no follow-up changes are expected there.
