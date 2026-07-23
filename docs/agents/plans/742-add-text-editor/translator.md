# Translator Plan: Add text editor

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's new `MarkdownEditor` component calls `Translator.t('markdown_editor.<key>')`
for these keys — add all of them, under a new top-level `markdown_editor:` block, to **both**
`frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`:

```yaml
markdown_editor:
  write_tab: Write
  preview_tab: Preview
  bold: Bold
  italic: Italic
  heading: Heading
  bulleted_list: Bulleted list
  numbered_list: Numbered list
  link: Link
  preview_empty: Nothing to preview yet
```

`en.yaml` gets exactly this English text (used as the toolbar buttons' `aria-label`/`title`
and the Write/Preview tab labels). `pt.yaml` needs the equivalent Portuguese translation for
each value, keeping the same key structure.

## Implementation Steps

### Step 1 — Add the `markdown_editor` block to `en.yaml`

Follow the existing top-level-key style (e.g. `description_box:` at
`frontend/assets/i18n/en.yaml:76`) and insert the block above verbatim.

### Step 2 — Add the matching block to `pt.yaml`

Same key structure, values translated to Portuguese, in the same relative position as in
`en.yaml` (match wherever `description_box:`'s Portuguese equivalent already sits, for
consistency).

### Step 3 — Verify parity

Run `npm run check_i18n` from `frontend/` and confirm it passes (it flattens both files to
dotted-path key sets and diffs them — see `frontend/scripts/check_i18n.js`).

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `markdown_editor:` block.
- `frontend/assets/i18n/pt.yaml` — add matching `markdown_editor:` block, translated.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This work has no code dependency on the frontend agent's component code — it only needs the
  key names, which are fixed above. Land both changes in the same PR so `check_i18n` (and the
  frontend agent's use of the real translated strings) are both correct together.
- If the frontend agent ends up needing additional/renamed toolbar actions beyond the list
  above, the key set here should be updated to match — keep this file and `frontend.md` in
  sync if that happens.
