# Translator Plan: Add list and show STL miniatures page

Main plan: [plan.md](plan.md)

## Shared contracts

`frontend` will add `Translator.t(...)` calls for the new STL model pages and header link. Match
translations to whatever keys actually land in the merged frontend code — the table in
[plan.md](plan.md)'s "Shared contracts" section is the plan-time best guess:

| Key | Purpose | English value |
|-----|---------|----------------|
| `header.nav_stl_models` | Header nav link label | `STL Models` |
| `stl_models_page.loading` | Index page loading message | `Loading STL models...` |
| `stl_model_page.loading` | Show page loading message | `Loading STL model...` |
| `stl_model_page.links` | Show page "Links" section heading | `Links` |
| `stl_model_page.sources` | Show page "Sources" section heading | `Sources` |
| `stl_model_page.tags` | Show page "Tags" section heading | `Tags` |

## Implementation Steps

### Step 1 — Add keys to `en.yaml`

Add `nav_stl_models: STL Models` to the existing `header:` block (alongside `nav_treasures`,
`nav_staff_users`, etc.), and add two new top-level blocks:

```yaml
stl_models_page:
  loading: Loading STL models...
stl_model_page:
  loading: Loading STL model...
  links: Links
  sources: Sources
  tags: Tags
```

Match the existing formatting/ordering conventions in `frontend/assets/i18n/en.yaml` (e.g. where
`treasures_page:`/`treasure_page:` are placed relative to neighboring blocks).

### Step 2 — Add the same keys to `pt.yaml`

Add the equivalent Portuguese translations for every key added in Step 1, in the same structure
and position, so both files stay structurally in sync.

### Step 3 — Verify against actual frontend code

Once `frontend`'s changes are available, grep the new files under
`frontend/assets/js/components/resources/stl_model/` and the updated `HeaderHelper.jsx` for every
`Translator.t('...')` call, and confirm each key exists (with a real, non-placeholder value) in
both `en.yaml` and `pt.yaml`. Add/rename entries if the actual call sites differ from the table
above.

### Step 4 — Run the sync check

```bash
docker-compose run --rm majora_fe npm run check_i18n
```

Fix any reported mismatch before considering this done.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `header.nav_stl_models`, `stl_models_page.*`,
  `stl_model_page.*`
- `frontend/assets/i18n/pt.yaml` — same keys, Portuguese values

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — run via
  `docker-compose run --rm majora_fe npm run check_i18n`

## Notes

- Depends on `frontend`'s work landing first (or at least the exact `Translator.t(...)` call sites
  being known) to get the final key list right — the table above may need adjustment.
