# Plan: Statistics bug: bump version to release the statistics:read scope and the session tracking columns

Main plan: [plan.md](plan.md)

## Overview

Run the version bump script for 1.5.0 in a normal PR, the same way #1695 bumped 1.4.0.

## Context

Production only changes on a tagged release. The `statistics:read` scope and export endpoint
(#1699), the scope UI (#1700) and the session tracking columns (#1712, #1713, #1714) are merged.
The tracking columns only collect data once released, so the bump does not wait for #1708. The
repo owner tags and deploys when they choose; this PR only bumps the version.

## Implementation Steps

### Step 1 — Run the bump script

From the repository root, run `scripts/bump_version.sh 1.5.0`. It is a plain shell script
(BSD `sed -i ''`), not a language runtime. It must leave exactly these changes:

- `README.md`: **Current Version** `1.5.0` (link to the `1.5.0` release tag) and
  **Next Release** `1.5.1` (compare link `1.5.0...main`).
- `frontend/package.json`: `"version": "1.5.0"`.
- `backend/pyproject.toml`: `version = "1.5.0"`.

Check `git diff --stat` shows only these 3 files (4 lines, as in #1695). Do not run the
`client` form: `client/package.json` stays unchanged.

## Files to Change

- `README.md` — current version and next release lines.
- `frontend/package.json` — app version.
- `backend/pyproject.toml` — app version.

## CI Checks

- No code changes; the regular CI pipeline runs on the PR unchanged.

## Notes

- If `frontend/package.json` has more than one `"version"` line, the script's `sed` would
  change all of them; check the diff touches only the top-level version.
- Follow-up (not in this issue): after #1708 is merged, another bump releases it for the
  production run of `analyse.py`.
