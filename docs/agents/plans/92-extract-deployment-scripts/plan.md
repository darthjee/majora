# Plan: Extract deployment scripts

Issue: [92-extract-deployment-scripts.md](../../issues/92-extract-deployment-scripts.md)

## Overview

A previous fix (#90) already extracted most `deploy_frontend.sh` deployment
logic into `source/bin/deploy_frontend.sh` and wired the `upload_admin_assets`
CI job to call it as `bin/deploy_frontend.sh` (after the job's "Set folder"
step copies `source/*` to the working directory root). However, the other
deployment jobs — `upload_proxy_files`, `upload_fe_files`, `link_photos`,
`release` — still call a bare `deploy_frontend.sh`, which resolves via `PATH`
to a *different* copy baked into the `darthjee/tent` / `vite_majora-base`
images from the external `darthjee/scripts` image
(`dockerfiles/vite_majora-base/Dockerfile`). That external copy also lacks a
`link` subcommand entirely in our repo's version, even though `link_photos`
depends on one.

This plan finishes the extraction: relocate the script to a location that
survives every job's "Set folder" step (which deletes either `source/` or
`frontend/`), add the missing `link` subcommand, repoint every CI job at the
single in-repo script, and drop the now-unused copy baked into the
`vite_majora-base` image.

## Context

- `source/bin/deploy_frontend.sh` implements `build`, `generate_key_file`,
  `generate_folder`, `copy_files`, `upload`, `release` — but not `link`.
- It currently only works for `upload_admin_assets` because that job's "Set
  folder" step (`rm frontend -rf; cp source/* ./ -r; rm source -rf`) places it
  at `bin/deploy_frontend.sh` relative to the job's working directory.
- `upload_fe_files` and `release` run a "Set folder" step that does the
  opposite (`rm source -rf; cp frontend/* ./ -r; rm frontend -rf`), which
  would delete `source/bin/deploy_frontend.sh` before it could be used — so
  the script cannot stay under `source/bin/` if every job is to share it.
- `upload_proxy_files` and `link_photos` (image `darthjee/tent:0.7.8`) run no
  "Set folder" step at all; they just `checkout`.
- The top-level `bin/` folder (currently just `image.sh`) and `scripts/`
  folder (currently `deploy.sh`, `render.sh`, `bump_version.sh`) are both
  untouched by any "Set folder" step, since those only `rm`/`cp` the
  `frontend/` and `source/` directories. Moving the script to top-level `bin/`
  makes it available, unchanged, to every job after `checkout`.

## Implementation Steps

### Step 1 — Relocate the script and add the missing subcommand

Move `source/bin/deploy_frontend.sh` to `bin/deploy_frontend.sh` (top-level),
keeping its existing style (`function` per subcommand, `case` dispatch on
`$1`). Add a `link` subcommand, matching the SSH style already used by
`run_copy_files`/`run_generate_folder`, consuming `SOURCE` and `TARGET` (the
env vars `link_photos` already sets):

```bash
function run_link() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    $SSH_COMMAND "$SSH_USER"@"$SSH_HOST" "ln -sfn $SOURCE $TARGET"
}
```

and a matching `"link") run_link ;;` case branch.

### Step 2 — Repoint every CI job at the single script

In `.circleci/config.yml`, replace every bare `deploy_frontend.sh` call (in
`upload_proxy_files`, `upload_fe_files`, `link_photos`, `release`) and the
existing `bin/deploy_frontend.sh` call (in `upload_admin_assets`) so all five
jobs consistently call `bin/deploy_frontend.sh` — env var prefixes
(`SOURCE=`, `TARGET=`, `SSH_REMOTE_TEMP_DIR=`) stay exactly as they are today.

### Step 3 — Drop the externally-baked copy

In `dockerfiles/vite_majora-base/Dockerfile`, remove the line:

```
COPY --chown=node:node --from=scripts \
  /home/scripts/sbin/deploy_frontend.sh /usr/local/sbin/
```

Keep the rest of the `scripts` build stage (still needed for
`yarn_builder.sh`).

## Files to Change

- `bin/deploy_frontend.sh` — relocated from `source/bin/deploy_frontend.sh`,
  with a new `link` subcommand added.
- `source/bin/deploy_frontend.sh` — removed (superseded by the top-level copy).
- `.circleci/config.yml` — `upload_proxy_files`, `upload_fe_files`,
  `link_photos`, `upload_admin_assets`, `release` jobs all call
  `bin/deploy_frontend.sh` consistently.
- `dockerfiles/vite_majora-base/Dockerfile` — remove the now-unused
  `COPY --from=scripts .../deploy_frontend.sh` line.

## CI Checks

- No dedicated lint/test job covers `.circleci/config.yml` or `bin/*.sh`.
  Sanity-check with `bash -n bin/deploy_frontend.sh` and, if available,
  `circleci config validate`.

## Notes

- The `darthjee/tent` image used by `upload_proxy_files`/`link_photos` is
  external (not built from this repo's `dockerfiles/`) and is expected to
  already have `ssh`/`rsync` available, since it previously ran the same
  commands via its own baked-in copy of the script.
- Removing/changing the external `darthjee/scripts` image itself is out of
  scope — only the `COPY` of `deploy_frontend.sh` from it is removed here.
