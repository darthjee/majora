# Issue: warm-up-cache: POST /api/config returns 400 because common_items.yml and recipes.yml aren't pushed

## Description
The CircleCI `warm-up-cache` job (`scripts/warm_navi_cache.sh config`) fails because `POST /api/config` on the hosted Navi returns **HTTP 400**. navi-client has been bumped to `0.2.4` (#1547, image `darthjee/navi-hey-client:0.2.4`) for better logs, so the error body should now show up in the job output.

## Problem
Navi's `/api/config` checks that every `actions[].resource` / `paginated_actions[].resource` exists, either in the same namespace or in `default` (`NamespaceMapBuilder#validateReferences`). If one doesn't, it rejects the payload with `ResourceNotFound` → 400.

`navi/resources/games.yml` has actions that point at:

- `game_common_items`, defined in `navi/resources/common_items.yml`
- `game_recipes`, defined in `navi/resources/recipes.yml`

Neither file is in the hardcoded `RESOURCE_FILES` list in `scripts/warm_navi_cache.sh`. Both are in `navi/navi_config.yaml`'s `include` list (14 files, while the script lists 12). The two lists drifted apart, and the server replies with `{"error":"Resource \"game_common_items\" not found."}`. A scan of all 14 resource files found these two as the only dangling references.

Two smaller issues in the same script:

- **Trailing slash in `base_url`:** the production URL in `MAJORA_PRODUCTION_URLS` ends with `/`. Navi builds request URLs by joining strings, so requests go to `https://…//games.json`.
- **Empty skip-secret header:** `navi/resources/clients.yml` sends `X-Statistics-Skip-Secret: $STATISTICS_SKIP_SECRET`. When the variable isn't set, the header goes out empty and warm-up visits get counted in the access statistics.

## Expected Behavior
- `scripts/warm_navi_cache.sh config` pushes every resource file in `navi/navi_config.yaml`'s `include` list. Navi answers `[{ "status": "accepted" }]` for each namespace.
- `scripts/warm_navi_cache.sh engine-start` returns a non-empty `enqueued`.
- Adding a resource file to `navi_config.yaml` is enough for the warm-up job to push it. There is no second list to keep in sync.
- Requests go to `https://<host>/games.json`, with no double slash.
- The script stops with a clear error when a required variable is missing, instead of pushing a broken config.

## Solution
All changes are in `scripts/warm_navi_cache.sh`:

1. **Derive the resource list from `navi/navi_config.yaml`.** Replace the hardcoded `RESOURCE_FILES` array with one built from the `include:` entries, with paths resolved relative to `navi/` (e.g. `resources/games.yml` → `navi/resources/games.yml`). Use plain shell tools (`sed`/`awk`/`grep`), because the CI image (`darthjee/navi-hey-client:0.2.4`) may not have `yq`. If the list comes out empty or a listed file doesn't exist, fail.
2. **Strip the trailing slash:** `export MAJORA_PRODUCTION_URL="${URLS[$i]%/}"` in `push_all_configs`.
3. **Fail fast on missing env:** before pushing, exit non-zero with a clear message if `STATISTICS_SKIP_SECRET` or `MAJORA_PRODUCTION_URLS` is empty. Check this in the `config` action. `engine-start` doesn't need `STATISTICS_SKIP_SECRET`.
4. **Manual (owner):** make sure `STATISTICS_SKIP_SECRET` is set in the CircleCI context that the `warm-up-cache` job uses.

Owner: `cache` agent (Navi warm-up), with `infra` input if the CircleCI job needs changes.

### Verification
- Run the `warm-up-cache` job. With navi-client 0.2.4 logging, `config` should show `accepted` for every namespace, and `engine-start` should report a non-empty `enqueued`.
- Locally, check that the derived list matches the `include` list (14 files).

## Benefits
- The cache warm-up works again in production.
- `navi_config.yaml` is the single source of truth, so this drift can't happen again.
- Misconfiguration (missing secret, malformed URL) shows up as a clear CI failure, not a silent 400 or skewed statistics.
