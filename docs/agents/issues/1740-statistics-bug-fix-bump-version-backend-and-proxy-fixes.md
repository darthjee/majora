# Issue: Statistics bug fix: bump version (backend and proxy fixes)

## Description

Part of the statistics bug fix Epic (Epic #1736). Bump the app version to **`1.6.0`** to
release the backend session tracking fix (#1737) and the proxy client IP forwarding (#1738).

## Depends on

- #1737 Backend: session tracking fix (merged)
- #1738 Proxy: custom handlers forward the signed client IP (merged)

## Context

- The latest release is `1.5.1`.
- Everything merged since then ships with this bump:
  - #1737: session reuse across IP changes, visit IPs (migration `statistics/0005_visit_ips`),
    and statistics are no longer tracked for unresolved routes.
  - #1738: proxy custom handlers send `X-Forwarded-For` and `X-Proxy-Secret`.
  - #1732: a warning when `PROXY_SECRET` is missing, plus `bin/deploy_frontend.sh` and docs.
  - #1733: responses that set cookies are no longer marked publicly cacheable, in the prod proxy
    rules and `.htaccess`.
- The staff visit list API stays backward compatible: `ip` is still returned (the visit's
  `last_ip`, falling back to the session's IP), next to the new `first_ip`/`last_ip`. The
  frontend issue #1745 is therefore not a dependency of this release.

## Solution

Run `scripts/bump_version.sh 1.6.0` (the plain form). This is a minor bump because the release
adds a migration and new API fields, matching `1.5.0`. It updates `README.md`,
`backend/pyproject.toml` and `frontend/package.json`. The client version (`client/package.json`)
is not touched. The tag created after the merge runs the release jobs: build and deploy, proxy
and frontend uploads, and cache warm-up.

## Out of scope

- The client version.
- The frontend visit IP display (#1745).
- Removing the `statistics:read` scope and the export endpoint (#1742). The post-fix check
  (#1741) still needs them.

## Notes

- The post-fix check (#1741) compares data from before and after this release, so record when
  it was deployed.

### Responsible agent

infra
