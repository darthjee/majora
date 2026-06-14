# Issue: Release Majora

## Description

Majora needs a proper CI/CD release pipeline so it can be deployed to production when a version tag is pushed. The current `.circleci/config.yml` is missing several release jobs and has an outdated `tent` version.

## Problem

- The `upload_proxy_files` job uses `darthjee/tent:0.7.5`; version `0.7.6` is required
- There is no job to build and upload frontend assets (`upload_fe_files`)
- There is no job to copy photos to the new deployment folder (unique to Majora — not needed in oak/weave)
- There is no `release` job to finalize the deployment (swap the new release folder into place)
- Without a `release` job, the upload jobs never trigger the actual switchover

## Expected Behavior

When a semver tag (`\d+\.\d+\.\d+`) is pushed:

1. All test/check jobs run (already working)
2. On success, the following jobs run in parallel:
   - `build-and-release` — triggers the Render deployment
   - `upload_proxy_files` — uploads tent proxy files and configuration (using tent `0.7.6`)
   - `upload_fe_files` — builds Vite assets and uploads them to the static folder
   - `upload_photos` — copies the `photos/` folder to the new deployment folder
3. After all upload jobs complete, the `release` job runs and swaps the new release folder into place

## Solution

- Update `darthjee/tent` image tag from `0.7.5` to `0.7.6` in the `upload_proxy_files` job
- Add `upload_fe_files` job modelled after weave's equivalent: set folder, yarn install, build assets, generate key file, generate folder, upload
- Add `upload_photos` job to copy the `photos/` folder to the remote deployment directory
- Add `release` job modelled after weave's `release_static_files`: generate key file and run `deploy_frontend.sh release`
- Update the workflow so `release` requires `[build-and-release, upload_proxy_files, upload_fe_files, upload_photos]`

## Benefits

- Enables automated, tag-triggered production releases
- Ensures frontend assets, proxy config, and photos are all in sync for each release
- Aligns Majora's pipeline with the patterns already established in oak and weave

---
See issue for details: https://github.com/darthjee/majora/issues/21
