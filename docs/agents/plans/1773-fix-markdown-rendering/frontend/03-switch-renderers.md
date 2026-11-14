# Switch the three renderers to MarkdownContent

Replace each direct `ReactMarkdown` call with `MarkdownContent`, and remove the now-unused
`react-markdown` / `remark-breaks` imports from these files:

- `DescriptionBoxHelper.render`:
  `<ReactMarkdown remarkPlugins={[remarkBreaks]}>{description}</ReactMarkdown>` →
  `<MarkdownContent>{description}</MarkdownContent>`
- `MarkdownEditorHelper.#renderPreview`:
  `<ReactMarkdown remarkPlugins={[remarkBreaks]}>{value}</ReactMarkdown>` →
  `<MarkdownContent>{value}</MarkdownContent>` (the empty-preview branch is unchanged)
- `DocumentPagesBoxHelper.#renderSegment`:
  `<ReactMarkdown remarkPlugins={[remarkBreaks]}>{segment.content}</ReactMarkdown>` →
  `<MarkdownContent>{segment.content}</MarkdownContent>`

Update the class-level JSDoc of `MarkdownEditor.jsx` if it still says the preview "reuses the same
`ReactMarkdown` rendering used on show pages" — it now reuses `MarkdownContent`.

Add one spec per helper proving a GFM table renders as `<table` (with the `table` class) through
that helper: in the description box, in the editor's Preview tab, and in a document page segment.
Existing specs (e.g. "preserves line breaks via remark-breaks") must keep passing unchanged.

## Files to Change

- `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx` — use `MarkdownContent`.
- `frontend/assets/js/components/common/forms/helpers/MarkdownEditorHelper.jsx` — use `MarkdownContent` in the preview.
- `frontend/assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelper.jsx` — use `MarkdownContent` per segment.
- `frontend/assets/js/components/common/forms/MarkdownEditor.jsx` — JSDoc wording only, if needed.
- `frontend/specs/assets/js/components/common/misc/helpers/DescriptionBoxHelperSpec.js` — table spec.
- `frontend/specs/assets/js/components/common/forms/helpers/MarkdownEditorHelperSpec.js` — table-in-preview spec.
- `frontend/specs/assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelperSpec.js` — table-in-segment spec.
