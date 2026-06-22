# Plan: Extract deployment scripts

Issue: [92-extract-deployment-scripts.md](../../issues/92-extract-deployment-scripts.md)

## Overview

`.circleci/config.yml` drives every deployment step (uploading static files,
deploying the proxy application, copying remote files, creating remote links)
through `deploy_frontend.sh`, a script baked into the external
`darthjee/scripts` image and copied into the `vite_majora-base` /
`darthjee/tent` images at build time (see
`dockerfiles/vite_majora-base/Dockerfile`, `COPY --from=scripts
/home/scripts/sbin/deploy_frontend.sh`). Because that script lives outside
this repository, changing common deployment behavior requires changes in an
unrelated repo/image and a version bump here just to pick them up.

This plan extracts the subcommands actually used by the CI jobs
(`generate_key_file`, `upload`, `copy_files`, `build`, `generate_folder`,
`link`, `release`) into a new script versioned inside this repo
(`scripts/deploy_frontend.sh`), and repoints every CircleCI job currently
calling `deploy_frontend.sh` / `bin/deploy_frontend.sh` to call the local
script instead.

## Context

Current usages in `.circleci/config.yml` (jobs `upload_proxy_files`,
`upload_fe_files`, `link_photos`, `upload_admin_assets`, `release`):

- `deploy_frontend.sh generate_key_file`
- `SOURCE=<dir> deploy_frontend.sh upload`
- `SOURCE=<dir> SSH_REMOTE_TEMP_DIR=<dir> deploy_frontend.sh upload`
- `TARGET=<file> SSH_REMOTE_TEMP_DIR=<dir> deploy_frontend.sh copy_files`
- `deploy_frontend.sh build`
- `SSH_REMOTE_TEMP_DIR=<dir> deploy_frontend.sh generate_folder`
- `SOURCE=<dir> TARGET=<dir> deploy_frontend.sh link`
- `deploy_frontend.sh release`

The exact internals of the original `deploy_frontend.sh` (from the external
`darthjee/scripts` image) are not available in this repository, so the new
script must be reconstructed from the observed CLI contract (subcommands +
env vars) rather than copied verbatim — see Notes.

## Implementation Steps

### Step 1 — Create `scripts/deploy_frontend.sh`

Follow the style already used by `scripts/deploy.sh` and `scripts/render.sh`
(bash, one `function` per subcommand, dispatch via a trailing `case`).
Implement each subcommand currently invoked from CI, using `SOURCE`, `TARGET`,
and `SSH_REMOTE_TEMP_DIR` as environment-variable inputs (matching current
call sites), plus whatever SSH/key env vars (`SSH_HOST`, `SSH_USER`,
`SSH_KEY`, `REMOTE_HOME`, etc.) are implied by usage in
`upload_proxy_files`/`link_photos`:

- `generate_key_file` — write the SSH private key (from an env var such as
  `SSH_KEY` / `DEPLOY_SSH_KEY`) to disk with `chmod 600`, ready for `ssh`/`rsync`.
- `generate_folder` — `ssh` into the remote host and `mkdir -p` the path given
  by `SSH_REMOTE_TEMP_DIR`.
- `upload` — `rsync`/`scp` the contents of `SOURCE` to the remote path
  (`SSH_REMOTE_TEMP_DIR` when set, otherwise a default upload target).
- `copy_files` — copy a single `TARGET` file into `SSH_REMOTE_TEMP_DIR` on the
  remote host.
- `link` — `ssh` into the remote host and `ln -sfn` from `SOURCE` to `TARGET`.
- `build` — run the frontend build (`yarn build` or equivalent) used before
  `upload_fe_files` uploads `dist/`.
- `release` — swap the uploaded temp directory into the live path (e.g. move
  `SSH_REMOTE_TEMP_DIR` into place), the final step of each deploy job.

Use `set -euo pipefail` and fail fast with a clear `Usage:` message for an
unknown subcommand, consistent with `bin/image.sh`.

### Step 2 — Point CircleCI jobs at the local script

In `.circleci/config.yml`, replace every call to `deploy_frontend.sh` /
`bin/deploy_frontend.sh` with `scripts/deploy_frontend.sh`, keeping the same
env var prefixes (`SOURCE=...`, `TARGET=...`, `SSH_REMOTE_TEMP_DIR=...`)
unchanged so no other behavior shifts. This affects the `upload_proxy_files`,
`upload_fe_files`, `link_photos`, `upload_admin_assets`, and `release` jobs.

### Step 3 — Drop the dependency on the externally-baked script

In `dockerfiles/vite_majora-base/Dockerfile`, remove the
`COPY --from=scripts /home/scripts/sbin/deploy_frontend.sh /usr/local/sbin/`
line (and the `darthjee/scripts` build stage if nothing else in that
Dockerfile still needs it) now that the script is checked out with the repo
via `checkout` in every job that uses it. Check `dockerfiles/` for any other
Dockerfile copying `deploy_frontend.sh` from the `scripts` image and remove
those too.

### Step 4 — Verify CI still has what it needs

Every job calling `scripts/deploy_frontend.sh` already runs `checkout` first,
so the script is present on disk; no extra `chmod +x` step should be needed
since the script is committed executable (`chmod +x
scripts/deploy_frontend.sh`).

## Files to Change

- `scripts/deploy_frontend.sh` — new script implementing `generate_key_file`,
  `generate_folder`, `upload`, `copy_files`, `link`, `build`, `release`.
- `.circleci/config.yml` — repoint `upload_proxy_files`, `upload_fe_files`,
  `link_photos`, `upload_admin_assets`, `release` jobs at
  `scripts/deploy_frontend.sh`.
- `dockerfiles/vite_majora-base/Dockerfile` — remove the now-unused
  `COPY --from=scripts .../deploy_frontend.sh` step (and any other Dockerfile
  doing the same).

## CI Checks

- root: no dedicated lint/test job covers `.circleci/config.yml` or
  `scripts/*.sh`; validate `.circleci/config.yml` locally with the CircleCI
  CLI (`circleci config validate`) if available, and `bash -n
  scripts/deploy_frontend.sh` for a syntax check.

## Notes

- The original `deploy_frontend.sh` source (in the external `darthjee/scripts`
  image) is not visible from this repo, so its exact flags/behavior for
  `generate_key_file`/`upload`/`link`/`release` had to be inferred from how
  CircleCI calls it. The infra agent should double-check required secrets
  (env var names for SSH host/user/key) against the actual CircleCI project
  settings before finalizing the script, since those names aren't visible in
  `config.yml` itself.
- Once this script is proven to work in CI, the `darthjee/scripts` image
  dependency for `deploy_frontend.sh` becomes fully obsolete for this repo;
  removing it from the Dockerfile is in scope, removing/changing the external
  `darthjee/scripts` image itself is not.
