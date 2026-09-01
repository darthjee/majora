# Enable debug logging permanently

Turn on `navi-client`'s debug-level logging for the `warm-up-cache` job's config
push and engine-start calls, left on going forward rather than only for
diagnosing #1241 — the interpolation-line log is cheap and secret-safe, and
gives ongoing visibility into config-push behavior for future issues too.

**Status: done**, committed on this branch (`0f4a2f08`).

## Files to Change

- `scripts/warm_navi_cache.sh` — `export LOG_LEVEL=debug` added near the top of
  the file, applying to both the `push_config`/`push_all_configs` and
  `start_engine` functions' `navi-client` invocations.
