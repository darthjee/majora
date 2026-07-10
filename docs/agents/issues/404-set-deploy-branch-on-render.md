# Issue: Set deploy branch on Render

## Description
Deployments are triggered on Render whenever a git tag is created. Tag creation kicks off the `build-and-release` CircleCI job (`.circleci/config.yml`, gated by a tags-only filter), which runs `scripts/deploy.sh deploy`. That script uses `scripts/render.sh` to call the [Render API](https://api-docs.render.com/reference/list-deploys) and trigger a deploy of the `majora` service.

## Problem
Render is configured to always build from the `master` branch, regardless of which commit triggered the deploy via the API. This creates a race condition:

1. A tag is created, which triggers the `build-and-release` CircleCI job. Render is asked to deploy, but it builds whatever is currently on `master`.
2. In parallel, CircleCI builds and releases the frontend assets using the tagged commit's code.
3. If another PR merges into `master` (with backend and/or frontend changes) before Render finishes fetching, Render may pick up that newer, untagged commit instead of the tag.
4. Result: the released frontend matches the tag, but the backend running in production is a different, unreleased commit — which may introduce bugs from the mismatch.

## Solution
Before triggering the deploy, force Render to build the tag being released instead of `master`, using Render's Update Service API:

`PATCH https://api.render.com/v1/services/{serviceId}`

```json
{
  "branch": "<TAG>"
}
```

See the [API reference](https://api-docs.render.com/reference/update-service) for details.

### Implementation notes
- `scripts/render.sh`'s `request()` helper currently only supports GET/POST with no request body. Add a new function there (e.g. `update_service_branch`) that issues the PATCH with a JSON body, following the existing pattern of the other API helper functions.
- Call this new function from `scripts/deploy.sh`, before `force_deploy` runs, using `CIRCLE_TAG` as `<TAG>`.
- Add the corresponding step in the `build-and-release` CircleCI job, before the existing `Trigger Deploy` step.
- The service branch is left set to the tag after the deploy — no reset back to `master` afterward. It will simply be overwritten by the next release's tag.

## Benefits
Guarantees the backend and frontend deployed for a given release are always built from the exact same tagged commit, eliminating the race condition and the risk of mismatched backend/frontend versions in production.
