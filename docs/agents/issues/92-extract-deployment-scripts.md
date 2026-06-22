# Issue: Extract deployment scripts

## Description
`.circleci/config.yml` contains several jobs (`upload_proxy_files`, `upload_fe_files`, `link_photos`, `upload_admin_assets`, `release`, etc.) that invoke deployment behavior — uploading static files, deploying the proxy application, copying files remotely, and creating remote links — directly as CircleCI step commands relying on `deploy_frontend.sh`.

## Problem
- Deployment-related commands live inline in `.circleci/config.yml`, coupling CI configuration to deployment logic.
- Changing common deployment behavior (upload, copy, link, key/folder generation) requires touching CI config across multiple jobs.

## Expected Behavior
- Deployment commands (upload static files, deploy proxy application, copy files remotely, create remote links) are consolidated into dedicated script(s) versioned in the project, rather than relying solely on logic baked into Docker images.
- `.circleci/config.yml` jobs call these scripts instead of duplicating deployment logic inline.

## Solution
- Extract the deploy-related behaviors currently driven by `deploy_frontend.sh` (upload, copy_files, link, generate_key_file, generate_folder, build, release) into well-defined script(s) in the repo (e.g. under `bin/` or `scripts/`).
- Update `.circleci/config.yml` jobs to call the extracted script(s).

## Benefits
- Common deployment behavior can be changed in one place instead of across multiple CI job definitions.
- Easier to test and reason about deployment logic outside of CI.

---
See issue for details: https://github.com/darthjee/majora/issues/92
