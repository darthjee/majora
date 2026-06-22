# Infra Plan: Check translations

Main plan: [plan.md](plan.md)

## Shared contracts

- The frontend agent provides a `check_i18n` Yarn script in `frontend/package.json` that exits non-zero on a translation key mismatch. This agent only needs to invoke `npm run check_i18n` (or `yarn check_i18n`) inside the existing `frontend-checks` CI job — no new job, image, or workflow dependency is needed.

## Implementation Steps

### Step 1 — Add the CI step

In `.circleci/config.yml`, inside the `frontend-checks` job (currently ending with the `Check JS Lint` step), add a new step right after `Yarn install`:

```yaml
- run:
    name: Check translations
    command: npm run check_i18n
```

So the job becomes: checkout → Set folder → Yarn install → Check translations → Check JS Lint.

### Step 2 — Verify

Confirm the job still passes (the script is a no-op pass when translation files are in sync) and would fail the build if `check_i18n` exits non-zero.

## Files to Change

- `.circleci/config.yml` — add a `Check translations` step to the `frontend-checks` job.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No new CircleCI job or workflow wiring is required — this rides along on the existing `frontend-checks` job and its existing `requires` on the Vite base image release jobs.
