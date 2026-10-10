# Fail fast on missing env vars
Add a small `require_env VAR...` helper that prints `ERROR: <VAR> is not set` to stderr and exits 1 for any empty variable. In the `config` action, require `NAVI_URL`, `NAVI_API_TOKEN`, `MAJORA_PRODUCTION_URLS`, and `STATISTICS_SKIP_SECRET` before pushing. In `engine-start`, require only `NAVI_URL`, `NAVI_API_TOKEN`, and `MAJORA_PRODUCTION_URLS` (`STATISTICS_SKIP_SECRET` isn't used there).

## Files to Change
- `scripts/warm_navi_cache.sh` — add `require_env` and call it at the start of the `config` and `engine-start` branches.
