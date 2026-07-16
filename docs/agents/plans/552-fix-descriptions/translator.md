# Translator Plan: Fix descriptions

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's new `DescriptionBox` component (`frontend/assets/js/components/common/DescriptionBox.jsx`)
calls `Translator.t('description_box.show_more')` and `Translator.t('description_box.show_less')`
for its "Show more"/"Show less" toggle button. Add exactly these two keys, under a new top-level
`description_box:` section, to both locale files:

- `description_box.show_more`
- `description_box.show_less`

## Implementation Steps

### Step 1 — Add the `description_box` section to `frontend/assets/i18n/en.yaml`

Add a new top-level section (existing sections are page-scoped, e.g. `header:`, `pagination:`,
`back_button:` — this is the first component-scoped, cross-page section, so give it its own
top-level key rather than nesting it under an existing page):

```yaml
description_box:
  show_more: Show more
  show_less: Show less
```

Place it near other small shared/common sections such as `back_button:` or `pagination:` (see
`frontend/assets/i18n/en.yaml` around line 63-68) for discoverability.

### Step 2 — Add the matching section to `frontend/assets/i18n/pt.yaml`

Add the same key structure with Portuguese wording, consistent with how other short action labels
are translated in this file (e.g. `back_button`, `pagination`):

```yaml
description_box:
  show_more: Mostrar mais
  show_less: Mostrar menos
```

### Step 3 — Verify key parity

Run the existing consistency check to confirm both locale files now expose the identical set of
dotted keys:

```bash
cd frontend && npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `description_box.show_more` / `description_box.show_less`.
- `frontend/assets/i18n/pt.yaml` — add the same keys with Portuguese values.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This can be done independently of the frontend agent's component work — `Translator.t()` falls
  back to the raw key string when a key is missing, so nothing breaks if this lands first or last.
- Do not touch any other existing key — this issue only adds the two new `description_box` keys.
