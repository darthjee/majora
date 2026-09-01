# Plan: Add logs to navi client

Issue: [1242-add-logs-to-navi-client.md](../../issues/1242-add-logs-to-navi-client.md)

## Overview

Wire `navi-client` 0.2.0's new `--log-level debug` capability into the
`warm-up-cache` CircleCI job so it logs `$VAR` interpolation status (set/unset,
length+hash, never the raw value) and outbound `POST /api/config` request bodies —
giving CI-side visibility into whether headers like `X-Statistics-Skip-Secret`
actually reach navi correctly, which #1241 has been blocked on. Bundled with
pinning `navi-hey`/`navi-hey-client` to known versions and refreshing majora's
vendored copies of navi's own docs to match.

See [infra.md](infra.md) for the full plan.
