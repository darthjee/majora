# Issue: Security: bump js-yaml to fix 3 DoS CVEs pulled into frontend/yarn.lock

## Description
Codacy SRM (SCA) flags `frontend/yarn.lock`: `js-yaml` resolves to `5.0.0`, a direct dependency (`frontend/package.json` pins `"js-yaml": "^5.0.0"`), and that version is affected by three separate DoS advisories:

- [CVE-2026-59868](https://app.codacy.com/p/880653/issues/index?resultDataId=131528228943) — quadratic CPU time parsing with merge keys (fixed in 5.2.0)
- [CVE-2026-59870](https://app.codacy.com/p/880653/issues/index?resultDataId=131528228945) — DoS via crafted YAML ordered-map document (fixed in 5.2.1)
- [CVE-2026-73643](https://app.codacy.com/p/880653/issues/index?resultDataId=131534909397) — DoS via exponential parsing in flow collections (fixed in 5.2.2)

Dependency chain: `npm/majora@0.68.2 -> npm/js-yaml@5.0.0`.

`js-yaml`'s `load()` is used in three places, all parsing YAML files bundled into the app at build time (not user-supplied at runtime): `frontend/assets/js/i18n/TranslationLoader.js`, `frontend/assets/js/i18n/Translator.js`, and `frontend/scripts/check_i18n.js`.

## Problem
Because `js-yaml` is a direct dependency (not only a transitive one), Codacy's SCA scan flags the repo directly for these three DoS CVEs. The current bundled-YAML-only usage means the CVEs are not practically exploitable today (no untrusted YAML is parsed at runtime), but the outdated pin still fails SCA compliance and would become a real risk if `js-yaml` is ever used to parse externally-sourced YAML later.

## Expected Behavior
`js-yaml` resolves to `>= 5.2.2` in `frontend/yarn.lock`, clearing all three CVEs from the Codacy SCA scan, with no change in i18n loading behavior.

## Solution
- Bump the `js-yaml` version spec in `frontend/package.json` (currently `^5.0.0`) to require `>= 5.2.2` and run `yarn install` in `frontend/` to refresh `frontend/yarn.lock`.
- Confirm the three call sites (`TranslationLoader.js`, `Translator.js`, `scripts/check_i18n.js`) — all plain `load()` calls — are unaffected by any behavior changes between 5.0.0 and 5.2.2.
- Run the frontend test suite and `yarn check_i18n` (or equivalent) to confirm translation loading still works.

## Benefits
Clears three DoS CVEs flagged by Codacy SCA and keeps the direct dependency on a maintained, patched release line.
