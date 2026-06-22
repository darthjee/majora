# Translator plan — issue #110 (add edit PC page)

See [plan.md](plan.md) for context. The frontend plan ([frontend.md](frontend.md)) introduces
new translation keys for the PC edit page and one new key on the existing character page (the
"Edit" button label). Add all of them to both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`, keeping each language's tone consistent with neighboring keys
(e.g. `register_page` in the same files).

## New key under the existing `character_page` block (`en.yaml:41`, mirrored in `pt.yaml`)

```yaml
character_page:
  loading: Loading character...
  edit: Edit
```

(`pt.yaml` equivalent, matching whatever Portuguese phrasing is already used for short action
labels elsewhere in that file, e.g. near `register_page.submit`.)

## New `pc_edit_page` block (place near `register_page` for similar shape)

```yaml
pc_edit_page:
  title: Edit character
  name_label: Name
  avatar_url_label: Avatar URL
  character_class_label: Class
  level_label: Level
  description_label: Description
  submit: Save changes
  error: Failed to save character. Please try again.
```

Add the matching `pt.yaml` block with the same keys translated to Portuguese, consistent with
how `register_page` was translated there.

## Verification

Run the existing key-sync check described in `docs/agents/i18n.md` to confirm both language
files declare exactly the same set of keys after this change (no missing/extra keys in either
file).
