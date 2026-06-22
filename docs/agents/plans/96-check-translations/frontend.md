# Frontend Plan: Check translations

Main plan: [plan.md](plan.md)

## Shared contracts

- Add a `check_i18n` Yarn script to `frontend/package.json` that exits non-zero (with a clear message listing missing/extra keys per file) when the translation YAML files don't all share the same key set. This is the command both the new `translator` agent and CI will invoke.

## Implementation Steps

### Step 1 — Write the key-parity check script

Add `frontend/scripts/check_i18n.js` (plain Node script, no React/JSX):
- Use `js-yaml` (already a dependency, already used in `Translator.js`) to load every `*.yaml` file under `frontend/assets/i18n/`.
- Flatten each file's keys into dotted paths (e.g. `header.title`, `login_modal.username_label`), recursing into nested objects the same way the existing namespaces (`header:`, `login_modal:`, etc.) are structured.
- Compare the flattened key sets of all files against the first file's set.
- If any file has missing or extra keys relative to the others, print the offending file name and the missing/extra keys, then `process.exit(1)`.
- Exit `0` when all files match.

### Step 2 — Wire the script into package.json

Add to `frontend/package.json` `scripts`:
```json
"check_i18n": "node scripts/check_i18n.js"
```

### Step 3 — Verify

Run locally:
```bash
docker-compose run --rm majora_fe yarn check_i18n
```
Confirm it passes against the current `en.yaml`/`pt.yaml` (which are already in sync), and that introducing a deliberate mismatch (e.g. temporarily removing a key) makes it fail with a clear message.

## Files to Change

- `frontend/scripts/check_i18n.js` — new Node script, flattens and compares i18n YAML keys across all locale files.
- `frontend/package.json` — add `check_i18n` script.

## CI Checks

- `frontend`: `yarn check_i18n` (CI job: `frontend-checks`, added by the infra agent)

## Notes

- Keep the script dependency-free beyond `js-yaml`, which is already installed — no new packages needed.
- The script must work for any number of locale files (not hardcoded to `en`/`pt`), since more languages will be added later.
