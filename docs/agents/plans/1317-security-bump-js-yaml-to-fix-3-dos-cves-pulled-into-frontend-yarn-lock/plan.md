# Plan: Security: bump js-yaml to fix 3 DoS CVEs pulled into frontend/yarn.lock

Issue: [1317-security-bump-js-yaml-to-fix-3-dos-cves-pulled-into-frontend-yarn-lock.md](../../issues/1317-security-bump-js-yaml-to-fix-3-dos-cves-pulled-into-frontend-yarn-lock.md)

## Overview
Bump the direct `js-yaml` dependency pinned in `frontend/package.json`/`frontend/yarn.lock` from `5.0.0` to `>= 5.2.2`, clearing three Codacy SCA DoS CVEs, and confirm the three `load()` call sites still behave correctly.

See [frontend.md](frontend.md) for the full plan.
