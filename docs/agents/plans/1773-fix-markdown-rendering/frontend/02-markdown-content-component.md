# Create the MarkdownContent component

Create a small presentational component that is the single place where Markdown is rendered:

```jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const REMARK_PLUGINS = [remarkGfm, remarkBreaks];

const COMPONENTS = {
  table: ({ node, ...props }) => (
    <div className="table-responsive">
      <table className="table table-sm table-bordered" {...props} />
    </div>
  ),
};

/**
 * Render Markdown text with GitHub Flavored Markdown (tables, autolinks, strikethrough,
 * task lists, footnotes) and soft line breaks as `<br>`. ...
 */
export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
      {children}
    </ReactMarkdown>
  );
}
```

Follow the existing JSDoc/ESLint conventions of `components/common/misc/` (e.g. `LinkIcon.jsx`).
Drop the `node` prop before spreading so it does not reach the DOM. Do **not** add `rehype-raw`,
do **not** pass `urlTransform`.

Spec (`renderToStaticMarkup`, same style as `DescriptionBoxHelperSpec.js`):

- a valid GFM table renders a `<table` with `table table-sm table-bordered` inside a
  `table-responsive` wrapper, with `<th>`/`<td>` cells;
- the `checks` sample from the issue (paragraph, blank line, padded table) renders as a table;
- a table whose divider row has a different cell count renders no `<table`;
- `Line one.\nLine two.` still renders `<br` (`remark-breaks`);
- `[x](javascript:alert(1))` renders no `javascript:` `href`;
- raw HTML such as `<script>` is not rendered as an element.

## Files to Change

- `frontend/assets/js/components/common/misc/MarkdownContent.jsx` — new shared component.
- `frontend/specs/assets/js/components/common/misc/MarkdownContentSpec.js` — new spec.
