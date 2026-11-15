# Frontend Plan: Add an "insert table" action to the MarkdownEditor toolbar

Main plan: [plan.md](plan.md)

## Shared contracts

- The toolbar button uses `labelKey: 'markdown_editor.table'`. The translator agent adds the
  `en`/`pt` values.

## Implementation Steps

### Step 1 — Add the `table` action to `MarkdownSyntax`

Add `case 'table'` to `MarkdownSyntax.apply`, delegating to a new private `#insertTable(value, start, end)`,
and add `table` to the JSDoc list of actions.

Behaviour:

- Collapse the selection to `end`. Any selected text is kept, and the table is inserted after it.
- Skeleton (a constant, e.g. `TABLE_SKELETON`), with generic untranslated English placeholders:

  ```text
  | Header 1 | Header 2 |
  | --- | --- |
  | Cell | Cell |
  ```

- Block separation, based on `before = value.slice(0, end)` and `after = value.slice(end)`:
  - Prefix: `''` when `before` is empty or ends with `\n\n`; `'\n'` when it ends with a single `\n`;
    otherwise `'\n\n'`.
  - Suffix: `''` when `after` is empty or starts with `\n\n`; `'\n'` when it starts with a single `\n`;
    otherwise `'\n\n'`.
- New value: `before + prefix + TABLE_SKELETON + suffix + after`.
- Selection: select the `Header 1` text, i.e. `selectionStart = end + prefix.length + 2` and
  `selectionEnd = selectionStart + 'Header 1'.length`.

Add specs to `MarkdownSyntaxSpec.js` covering:

- An empty value, so there's no prefix or suffix.
- A cursor at the end of a text line, giving a `\n\n` prefix.
- A value ending in `\n` or `\n\n`.
- A cursor in the middle of text, so both a prefix and a suffix are added.
- Text following after a single `\n`.
- An existing selection that is kept, with the table inserted after it.
- The returned `selectionStart`/`selectionEnd` covering exactly `Header 1`.

### Step 2 — Toolbar button and icon

- Add `table: 'bi-table'` to `frontend/assets/js/utils/ui/Icons.js`.
- Append `{ action: 'table', icon: Icons.table, labelKey: 'markdown_editor.table' }` to `TOOLBAR_ACTIONS`
  in `MarkdownEditorHelper.jsx`, after `link`.
- Update `MarkdownEditorHelperSpec.js`, and `MarkdownEditorSpec.js` if it asserts the button set or
  count, so the new button renders and dispatches `onToolbarAction('table')`.

## Files to Change

- `frontend/assets/js/utils/MarkdownSyntax.js`: the new `table` action and `#insertTable`.
- `frontend/specs/assets/js/utils/MarkdownSyntaxSpec.js`: specs for the action.
- `frontend/assets/js/utils/ui/Icons.js`: the `table` icon.
- `frontend/assets/js/components/common/forms/helpers/MarkdownEditorHelper.jsx`: the new toolbar entry.
- `frontend/specs/assets/js/components/common/forms/helpers/MarkdownEditorHelperSpec.js`: the toolbar spec.
- `frontend/specs/assets/js/components/common/forms/MarkdownEditorSpec.js`: only if it enumerates buttons.

## CI Checks

- `frontend/`: `npm run coverage` (CI job: `jasmine`) and `npm run lint` (CI job: `frontend-checks`),
  run through docker-compose per AGENTS.md.

## Notes

- `MarkdownEditor.jsx` already restores the returned selection generically, so it should need no change.
- The placeholders are deliberately not translated (the same approach as the `link`/`url` text of the link action).
