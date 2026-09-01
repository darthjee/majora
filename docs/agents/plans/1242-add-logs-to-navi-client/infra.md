# infra Plan: Add logs to navi client

Main plan: [plan.md](plan.md)

## Overview

`scripts/warm_navi_cache.sh` invokes `navi-client -a config --file ...` from the
`warm-up-cache` CircleCI job with no visibility into `$VAR`/`${VAR}` interpolation
or what actually gets sent over the wire. `navi-client` (`darthjee/navi-hey-client`)
0.2.0 already ships a `--log-level debug` CLI flag / `LOG_LEVEL` env var that
surfaces exactly this. This plan wires it in, pins the previously
stale/floating image versions, and refreshes majora's vendored navi docs to
match.

## Context

Follow-up to #1241 ("Revisit statistics"), which needs to know whether
`STATISTICS_SKIP_SECRET` is actually seen as set by `navi-client` in the
`warm-up-cache` job's own environment. Under `LOG_LEVEL=debug`:

- `ConfigFileParser` logs one deduped line per `$VAR`/`${VAR}` interpolation —
  variable name, set/unset status, and (when set) the resolved value's length + a
  short hash, never the raw value.
- `NaviApiClient#post` logs every outbound request's method, URL, and body — for
  `config`, the already-interpolated JSON payload, which does include the
  resolved header value verbatim (only `Authorization` is excluded from logging
  at any level). Reliance is on CircleCI's automatic masking of registered
  project env var values in job output; no further mitigation is planned.

All work below is already implemented and committed on this issue's branch
(`e02cd9d2`, `0f4a2f08`) and is considered ready to ship — step 4 is a
post-merge observation, not a blocking condition.

## Steps

- [01 — Bump navi/navi-client versions](infra/01-bump-versions.md)
- [02 — Enable debug logging permanently](infra/02-enable-debug-logging.md)
- [03 — Refresh vendored navi docs](infra/03-refresh-vendored-docs.md)
- [04 — Verify on a real CI run](infra/04-verify-in-ci.md)

## CI Checks

- `.circleci/config.yml`, `docker-compose.yml`, `scripts/warm_navi_cache.sh`: no
  dedicated lint/test job for these config files themselves; validated by the
  `warm-up-cache` job actually running on the next tagged release (see step 04).
- `docs/agents/external/**/*.md`: `yarn lint_md` (CI job: `markdownlint`).

## Notes

- No breaking changes were found between `navi-hey` 1.5.1 and 1.9.0 in the
  upstream repo's history (`git log 1.5.1..1.9.0`) — the new config keys
  (`web`, `log`, `emit`) are all optional/backward compatible, so majora's
  existing `navi/navi_config.yaml` and resource files need no changes for this
  bump.
- The `NaviApiClient#post` body-dump logging one commit brought server-side too
  (`navi-hey`'s own `ConfigIncluder` gained the same interpolation-line logging
  for disk-loaded config, per upstream commit `d9ba2f1`), but that path is only
  used by local `docker-compose up majora_navi`, not the CI flow this issue
  targets.
