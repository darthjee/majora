# Derive RESOURCE_FILES from navi_config.yaml
Replace the hardcoded `RESOURCE_FILES` array with a function (e.g. `load_resource_files`) that reads `navi/navi_config.yaml`, collects the `- <path>` entries under the top-level `include:` key (stopping at the next top-level key or EOF), and prefixes each with `navi/` (e.g. `resources/games.yml` → `navi/resources/games.yml`). Use only bash/sed/awk/grep — no `yq`.

Validate the result: exit non-zero with a clear message if the list is empty or if any listed file does not exist. Call it from `push_config` (or once before `push_all_configs`) so `--file` args are built from the derived list. Expected result today: 14 files, including `common_items.yml` and `recipes.yml`.

## Files to Change
- `scripts/warm_navi_cache.sh` — remove hardcoded `RESOURCE_FILES`; add include-list parsing + validation; use it in `push_config`.
