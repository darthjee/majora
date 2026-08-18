# Issue: Docker images run as root (missing/misplaced USER directive)

## Description

Codacy static analysis (Semgrep `dockerfile.security.missing-user`, Hadolint `DL3002`) flags 4 Dockerfiles where a build stage's own instruction block never sets a non-root `USER` before its `CMD`/`ENTRYPOINT`, or ends the block with `USER root`:

- `dockerfiles/majora-base/Dockerfile`
- `dockerfiles/production_majora-base/Dockerfile`
- `dockerfiles/vite_majora/Dockerfile`
- `dockerfiles/vite_majora-base/Dockerfile`

Both linters evaluate each `FROM ... AS <stage>` block independently and do not track the effective runtime user across multi-stage inheritance. Investigation (running hadolint and semgrep locally, plus `docker inspect` on the external parent images) confirmed that in all 4 files, the **final stage that actually ships as the running container already ends in a non-root `USER`** (`USER app` or `USER node`) — so there is no real runtime risk today. The findings are about specific intermediate/base stage blocks that lack an explicit `USER` of their own.

## Problem

Confirmed per-file, by running the actual linters and inspecting the parent images:

1. **`dockerfiles/majora-base/Dockerfile`** (line 4) and **`dockerfiles/production_majora-base/Dockerfile`** (line 4) — Semgrep flags the `base` stage (`FROM darthjee/django:0.0.2 as base`), which declares `CMD ["bin/server.sh"]` without ever setting `USER` in that same block. `darthjee/django:0.0.2` already defaults to `USER app` (confirmed via `docker inspect`), so this is effectively a linter false positive, but it's worth silencing explicitly since Semgrep can't see the parent image's default user.
2. **`dockerfiles/vite_majora/Dockerfile`** (line 14) — Hadolint flags the `builder` stage: it sets `USER root`, then `COPY`s and `RUN`s `yarn_builder.sh`, and never switches back to a non-root user before the stage block ends. This stage is discarded after the build (only used via `COPY --from=builder`), so there's no runtime exposure — but it's still the last `USER` in that block, which is what `DL3002` checks.
3. **`dockerfiles/vite_majora-base/Dockerfile`** (line 18) — same pattern as #2: the `builder` stage sets `USER root` for `yarn_builder.sh` and never resets it before the block ends.

None of the 4 files have any `RUN`/`COPY` step in their **final, shipped** stage that executes before the existing `USER app`/`USER node` line, and `--chown=app:app` / `--chown=node:node` is already present on every `COPY --from=builder` into the final stage, so file ownership is already correct. `docker-compose.yml` bind mounts and `.circleci/config.yml` were checked and neither assumes the container runs as root.

## Expected Behavior

- Hadolint and Semgrep (`p/dockerfile` ruleset) report zero `DL3002` / `dockerfile.security.missing-user` findings on the 4 Dockerfiles.
- No change to the already-correct runtime user of the shipped containers: `whoami` inside a running `majora_app`/`majora_fe`-style container still prints `app` / `node` respectively.
- All 4 Dockerfiles still build successfully standalone.

## Solution

Add (or add back) an explicit non-root `USER` in the exact stage block the linter is scoped to — these are build-time-only additions with no effect on the already-non-root final images:

| File | Stage to fix | Change |
|---|---|---|
| `dockerfiles/majora-base/Dockerfile` | `base` (lines 2–4) | Add `USER app` right after `FROM darthjee/django:0.0.2 as base`, before `CMD ["bin/server.sh"]` |
| `dockerfiles/production_majora-base/Dockerfile` | `base` (lines 2–4) | Same: add `USER app` before the `CMD` line |
| `dockerfiles/vite_majora/Dockerfile` | `builder` (lines 10–16) | Add a trailing `USER node` after `RUN /bin/bash yarn_builder.sh`, before the next `FROM base` |
| `dockerfiles/vite_majora-base/Dockerfile` | `builder` (lines 14–20) | Add a trailing `USER node` after `RUN /bin/bash yarn_builder.sh`, before the next `FROM base` |

No changes needed to: the `scripts` stage in any file (never independently flagged); the already-correct `builder`/final stages of the two `majora-base` files; the `base` stage of `vite_majora-base` (already correctly does `USER root` → `apt-get install rsync` → `USER node`); or the final stages of the two vite files (already end in `USER node`).

**Verification:**
1. Re-run hadolint and the semgrep `p/dockerfile` scan against all 4 files — expect 0 findings.
2. `docker build` each of the 4 files standalone to confirm they still build.
3. `docker-compose run --rm <service> whoami` for the affected services to confirm the shipped runtime user is unchanged (`app` / `node`).

## Benefits

- Clears the Codacy Semgrep and Hadolint findings on these 4 Dockerfiles.
- Makes the intended non-root user explicit in every stage block, so future linter runs (and human readers) don't have to reason about inherited defaults from external parent images to confirm there's no root exposure.
- No behavior change to the containers actually shipped and run — the fix is scoped to intermediate/base stage blocks that are either discarded (`builder`) or never run directly on their own (`base`).
