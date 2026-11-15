# Issue: Add an "insert table" action to the MarkdownEditor toolbar

## Description

Spun off from #1773. Add an "insert table" action to the `MarkdownEditor` toolbar so authors get a valid GFM table skeleton instead of typing pipes by hand.

## Problem

`MarkdownSyntax.js` only supports `bold`, `italic`, `heading`, `bulleted_list`, `numbered_list` and `link`. Hand-typed tables often have a divider row whose cell count does not match the header (see #1773, recipe 1 of `dragon_heist`), which GFM silently renders as a plain paragraph.

## Expected Behavior

- A new `table` toolbar action (button using a new Bootstrap `table` icon added to `Icons.js`) inserts a fixed 2-column table with a header row, a divider row and one body row, using generic untranslated English placeholders:

  ```
  | Header 1 | Header 2 |
  | --- | --- |
  | Cell | Cell |
  ```

- The table starts in its own block (blank line before and after, only added where not already present).
- If text is selected, it is kept: the selection collapses to its end and the table is inserted after it.
- After insertion, the `Header 1` text is selected so the user can type over it immediately.
- Translations for the button label (`markdown_editor.table`) in every supported language (`en`, `pt`).
- Specs for the new `MarkdownSyntax` action.

## Dependencies

Requires #1773 (`remark-gfm` enabled), which has already landed.
