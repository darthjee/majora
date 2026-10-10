# Strip trailing slash from production URLs
In `push_all_configs`, export `MAJORA_PRODUCTION_URL="${URLS[$i]%/}"` so Navi's string-joined request URLs don't become `https://…//games.json`. Also trim surrounding whitespace from each entry if cheap to do, since the list is comma-separated.

## Files to Change
- `scripts/warm_navi_cache.sh` — strip trailing `/` in `push_all_configs`.
