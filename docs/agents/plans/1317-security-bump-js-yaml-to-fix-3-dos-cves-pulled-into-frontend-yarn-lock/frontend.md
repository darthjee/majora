# Frontend Plan: Security: bump js-yaml to fix 3 DoS CVEs pulled into frontend/yarn.lock

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Bump js-yaml and refresh the lockfile
Update the `js-yaml` version spec in `frontend/package.json` from `^5.0.0` to `^5.2.2`, then run `yarn install` inside `frontend/` so `frontend/yarn.lock` re-resolves `js-yaml` to `>= 5.2.2`, clearing all three CVEs (CVE-2026-59868, CVE-2026-59870, CVE-2026-73643).

### Step 2 — Verify the three call sites and run checks
`js-yaml`'s `load()` is used in exactly three places, all parsing build-time-bundled i18n YAML (not untrusted runtime input): `frontend/assets/js/i18n/TranslationLoader.js`, `frontend/assets/js/i18n/Translator.js`, and `frontend/scripts/check_i18n.js`. Confirm none of them rely on `load()` behavior removed/changed between 5.0.0 and 5.2.2 (check the `js-yaml` changelog for the 5.x range), then run the frontend checks locally to confirm nothing broke.

## Files to Change
- `frontend/package.json` — bump `"js-yaml"` from `"^5.0.0"` to `"^5.2.2"`
- `frontend/yarn.lock` — refreshed by `yarn install` to resolve `js-yaml` to `>= 5.2.2`

## CI Checks
- `frontend`: `yarn install && npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `yarn install && npm run lint` (CI job: `frontend-checks`)
- `frontend`: `yarn install && npm run coverage` (CI job: `jasmine`)

## Notes
- `js-yaml` is a direct dependency here, not only transitive — the version spec in `package.json` itself must move, not just the lockfile resolution, or a future clean install could re-resolve down to a vulnerable 5.x patch again.
- No behavioral risk is expected: all three call sites use the plain `load()` function on locally bundled YAML, and 5.0.0 → 5.2.2 is a patch-level range within the same major version.
