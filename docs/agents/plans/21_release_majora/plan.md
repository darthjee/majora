# Plan: Release Majora

## Overview

Update `.circleci/config.yml` to implement a complete tag-triggered release pipeline. This is a CI-only change — no backend or frontend source files are modified. The pattern follows what is already established in the `weave` project, with an additional `upload_photos` job unique to Majora.

## Context

The current pipeline runs tests on every push and branch, but the release jobs (`upload_proxy_files`, `build-and-release`) run in parallel and there is no final step to swap the new release folder into place. The `tent` image version is also outdated. The `weave` project provides the reference pattern for `upload_fe_files` and `release`.

## Implementation Steps

### Step 1 — Update tent version in `upload_proxy_files`

Change the Docker image from `darthjee/tent:0.7.5` to `darthjee/tent:0.7.6`.

### Step 2 — Add `upload_fe_files` job

Model it after `weave`'s equivalent job:
- Use the Majora Vite build image (equivalent of `darthjee/vite_weave-base`)
- Steps: set folder, yarn install, build assets, generate key file, generate folder, upload to `$SSH_REMOTE_TEMP_DIR/static/`

### Step 3 — Add `upload_photos` job

Unique to Majora (oak and weave have no photos folder):
- Use the tent or deploy image that has SSH/SCP access
- Steps: generate key file, upload `photos/` to the remote deployment folder

### Step 4 — Add `release` job

Model it after `weave`'s `release_static_files` job:
- Use the Majora Vite build image
- Steps: generate key file, run `deploy_frontend.sh release` to swap the new folder into place

### Step 5 — Update workflow dependency chain

- Keep test jobs running on all branches and tags
- All release jobs (`build-and-release`, `upload_proxy_files`, `upload_fe_files`, `upload_photos`) require `[pytest, jasmine, frontend-checks, checks]` and are tag-only
- Add `release` job that requires `[build-and-release, upload_proxy_files, upload_fe_files, upload_photos]`, tag-only

## Files to Change

- `.circleci/config.yml` — add new jobs, update tent version, update workflow dependency chain

## Notes

- The exact Docker image name for `upload_fe_files` and `release` (equivalent of `darthjee/vite_weave-base` for Majora) is unknown and may need to be confirmed or created
- The `upload_photos` job needs the right base image that includes `deploy_frontend.sh` — likely the same tent image or the vite-majora image
- The `photos/` folder path on the remote server needs to match what the application expects at runtime
