# Translator plan — issue #111 (add edit NPC page)

See [plan.md](plan.md) for context. Add a new `npc_edit_page` i18n block, structurally
identical to the existing `pc_edit_page` block, to both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`. No change is needed to `character_page.edit` — it's already
generic ("Edit") and reused for both the PC and NPC edit buttons.

## New `npc_edit_page` block (place near `pc_edit_page`)

```yaml
npc_edit_page:
  title: Edit character
  name_label: Name
  avatar_url_label: Avatar URL
  character_class_label: Class
  level_label: Level
  description_label: Description
  submit: Save changes
  error: Failed to save character. Please try again.
```

Add the matching `pt.yaml` block using the same Portuguese translations already used for the
`pc_edit_page` block there (the copy is identical between PC and NPC edit pages).

## Verification

Run `docker-compose run --rm majora_fe yarn check_i18n` to confirm both language files declare
exactly the same set of keys after this change.
