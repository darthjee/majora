# Plan: Statistics bug fix: bump version (backend and proxy fixes) — infra

Main plan: [plan.md](plan.md)

## Overview

Run the release bump script with `1.6.0`. This is a minor bump: the release adds the
`statistics/0005_visit_ips` migration and the `first_ip`/`last_ip` API fields, the same reason
`1.5.0` was a minor bump.

## Context

- Current version: `1.5.1`. The README's "Next Release" line says `1.5.2`, so the version must
  be passed explicitly, not taken from the default.
- `scripts/bump_version.sh` (the plain form) updates `README.md` ("Current Version" and "Next
  Release"), `frontend/package.json` and `backend/pyproject.toml`. The `client` form is not
  used: the client version stays as it is.
- After the merge, the release jobs in `.circleci/config.yml` run on the version tag.

## Implementation Steps

### Step 1 — Bump to 1.6.0

Run `scripts/bump_version.sh 1.6.0` from the repo root. Expected result:

- `README.md`: `**Current Version:** [1.6.0](.../releases/tag/1.6.0)` and
  `**Next Release:** [1.6.1](.../compare/1.6.0...main)`.
- `frontend/package.json`: `"version": "1.6.0"`.
- `backend/pyproject.toml`: `version = "1.6.0"`.

The script uses BSD `sed -i ''`. If it fails in the environment, make the same three edits by
hand. Only these three files may change: check with `git diff --stat`.

### Step 2 — Verify

- `grep -rn "1\.5\.1" README.md frontend/package.json backend/pyproject.toml` returns nothing.
- `client/package.json` is unchanged.

## Files to Change

- `README.md`: the "Current Version" and "Next Release" lines.
- `frontend/package.json`: `version`.
- `backend/pyproject.toml`: `version`.

## CI Checks

No local command covers a version bump. The usual PR jobs run on the branch, and the release
jobs (`build-and-release`, `release`, `upload_proxy_files`, `upload_fe_files`, `warm-up-cache`,
`client-release`) only run on the tag. `client-release` is a no-op, because the client version
does not change.

## Notes

- Do not touch `frontend/package-lock.json` or any other version field; earlier bumps
  (`1.5.0`, `1.5.1`) only changed the three files above.
- The post-fix check (#1741) compares data before and after this release: record when it was
  deployed.
- Out of scope: the client version, the frontend visit IP display (#1745), and removing the
  `statistics:read` scope and the export endpoint (#1742).
