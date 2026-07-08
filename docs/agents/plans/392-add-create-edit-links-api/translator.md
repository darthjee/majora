# Translator Plan: Add create/edit links API

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent introduces a new `LinksEditModal` (see [frontend.md](frontend.md)) under a
new `links_edit_modal` i18n namespace, plus one new label on the existing `pc_edit_page` /
`npc_edit_page` namespaces for the "Edit links" button. This agent adds the keys to both
`frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, keeping them in parity so
`npm run check_i18n` passes. Coordinate the exact key names below with whatever the frontend
agent actually calls in `Translator.t(...)` — if it deviates from this list, match its calls
instead of this plan.

## Implementation Steps

### Step 1 — Add `links_edit_modal` namespace

Add to both `en.yaml` and `pt.yaml` (English text below; provide the Portuguese equivalent in
`pt.yaml`, matching the tone/style already used for other modals such as `treasure_exchange_modal`
around line 190 of `en.yaml`):

```yaml
links_edit_modal:
  title: Edit links
  text_label: Text
  url_label: URL
  link_type_label: Type
  link_type_none: None
  link_type_lootstudio: LootStudio
  add_link: Add Link
  confirm: Confirm
  cancel: Cancel
```

Adjust/add keys if the frontend implementation ends up needing more (e.g. a validation message
for a missing `url`) — check `LinksEditModal.jsx`/`LinksEditModalHelper.jsx` for every
`Translator.t('links_edit_modal.*')` call and ensure each has a matching key in both files.

### Step 2 — Add the "Edit links" button label

Add one key to both `pc_edit_page` and `npc_edit_page` namespaces in both `en.yaml`/`pt.yaml`
(near the existing `upload_photo_button` key):

```yaml
edit_links_button: Edit links
```

### Step 3 — Verify parity

Run the key-parity check:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `links_edit_modal` namespace + `edit_links_button` under
  `pc_edit_page`/`npc_edit_page`.
- `frontend/assets/i18n/pt.yaml` — same keys, Portuguese translations.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Wait for (or coordinate directly with) the frontend agent's exact `Translator.t(...)` key
  names before finalizing — this plan's key list is a best-effort based on the modal's expected
  fields (text/url/link_type/add/confirm/cancel) and may need small adjustments.
