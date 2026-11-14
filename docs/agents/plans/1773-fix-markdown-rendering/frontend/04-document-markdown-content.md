# Document MarkdownContent

Add a short note to the frontend component docs stating that all Markdown rendering goes through
`components/common/misc/MarkdownContent.jsx` (GFM via `remark-gfm` + `remark-breaks`, tables
styled with Bootstrap inside `table-responsive`), that new code must not call `ReactMarkdown`
directly, and that `rehype-raw` / a custom `urlTransform` must not be added (raw HTML stays
escaped, dangerous link schemes stay stripped).

Pick the most fitting existing page under `docs/agents/frontend/` (likely
`component-architecture.md`); keep it to a few lines and run markdownlint.

## Files to Change

- `docs/agents/frontend/component-architecture.md` — short "Markdown rendering" note.
