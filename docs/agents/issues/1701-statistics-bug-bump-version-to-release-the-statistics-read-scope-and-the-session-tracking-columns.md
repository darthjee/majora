# Issue: Statistics bug: bump version to release the statistics:read scope and the session tracking columns

## Description

Part of Epic #1696 (statistics session investigation). Production only changes on a tagged
release. Bump the app version so the work merged so far is ready to be released and deployed:

- the `statistics:read` scope and the staff export endpoint (#1699);
- the scope in the token and device-authorization UI (#1700);
- the session tracking columns: storage (#1712), API (#1713) and the staff visits page (#1714).

The tracking columns only start collecting data once released, so the bump does not wait for
#1708 (scoped tokens through device authorization).

## Solution

- Run `scripts/bump_version.sh 1.5.0` in a normal PR, like #1695 (a minor bump: new scope,
  endpoint and columns). It updates `README.md` (current version 1.5.0, next release 1.5.1),
  `backend/pyproject.toml` and `frontend/package.json`; nothing else changes.
- No client bump: the investigation script does not use the `majora-client` package.
- Merging this PR does not release: tagging and deploying stay with the repo owner, who picks
  the moment.
- **Follow-up:** `analyse.py`'s production run also needs #1708, which is not part of this
  release. Once #1708 is merged, another version bump releases it.

## Depends on

#1699, #1700, #1712, #1713 and #1714 (all merged). Not #1708 (see the follow-up above).

## Responsible agent

infra
