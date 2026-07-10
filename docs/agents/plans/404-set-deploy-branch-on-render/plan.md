# Plan: Set deploy branch on Render

Issue: [404-set-deploy-branch-on-render.md](../issues/404-set-deploy-branch-on-render.md)

## Overview

Render is configured to always build the `master` branch, regardless of which commit
triggered the deploy through the API. When a tag is created, CircleCI's `build-and-release`
job asks Render to deploy, but a concurrent merge to `master` can win the race and get
deployed instead of the tag — producing a frontend/backend version mismatch. This plan adds
a Render API call that repoints the service's build branch to the release tag before
triggering the deploy, so Render always builds the exact tagged commit.

## Context

- Tag creation triggers the `build-and-release` CircleCI job (`.circleci/config.yml`,
  gated by the `tags_only` filter — tags matching `\d+\.\d+\.\d+`, branches ignored).
- That job's only step runs `scripts/deploy.sh deploy`.
- `scripts/deploy.sh` sources `scripts/render.sh` for all Render API helpers.
- `run_deploy()` (in `deploy.sh`) calls `checkLastVersion` then `force_deploy()`, which
  fetches the service id, POSTs a new deploy, then polls it via `watch_deployment`.
- `render.sh`'s `request()` helper only issues GET/POST calls with no body — it currently
  has no way to send the JSON payload a PATCH-with-body call needs.
- CircleCI's machine executor exposes `CIRCLE_TAG` for tag-triggered builds — this is the
  value that must be sent as the new branch.

## Implementation Steps

### Step 1 — Add a branch-update helper to `scripts/render.sh`

Add a new function alongside the existing helpers (`deploy`, `service_id`, etc.):

```bash
function update_service_branch() {
  SERVICE_ID=$1
  BRANCH=$2
  curl --request PATCH \
    --url "https://api.render.com/v1/services/$SERVICE_ID" \
    --header 'Accept: application/json' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer $RENDER_API_KEY" \
    --data "{\"branch\": \"$BRANCH\"}"
}
```

Implemented as its own function rather than extending `request()`, since `request()` is
shared by every GET call and has no notion of a request body or `Content-Type` header today.

### Step 2 — Call it from `scripts/deploy.sh` before triggering the deploy

Update `run_deploy()` (not `force_deploy()`) to set the branch before deploying:

```bash
function run_deploy() {
  checkLastVersion
  SERVICE_ID=$(service_id)
  update_service_branch "$SERVICE_ID" "$CIRCLE_TAG"
  force_deploy
}
```

`force_deploy()` itself is left untouched — it's also reachable directly via the
`force_deploy` CLI action for manual/ad-hoc redeploys where there is no `CIRCLE_TAG` to
pin to, so the branch-update call must not live there.

`force_deploy()` re-fetches `service_id` internally; this duplicate lookup already exists
in the current code and is out of scope for this change.

### Step 3 — Leave the branch pinned after deploy

Per the issue, no follow-up step resets the branch back to `master`. The service simply
stays pinned to the last deployed tag until the next release's `update_service_branch` call
overwrites it.

## Files to Change

- `scripts/render.sh` — add `update_service_branch(SERVICE_ID, BRANCH)`.
- `scripts/deploy.sh` — call `update_service_branch` from `run_deploy()`, before
  `force_deploy`, using `CIRCLE_TAG`.

## Notes

- No `.circleci/config.yml` change is needed — the branch update happens inside the
  existing `scripts/deploy.sh deploy` call already used by the `build-and-release` job, not
  as a separate CircleCI step.
- There are no existing automated tests for `scripts/deploy.sh` / `scripts/render.sh`; this
  repo has no shell-script test harness, so verification is manual (e.g. dry-running the
  curl call, or observing the next tagged release).
- `RENDER_API_KEY` is assumed to already be available as a CircleCI environment variable
  (it's a precondition for every existing `render.sh` call).
