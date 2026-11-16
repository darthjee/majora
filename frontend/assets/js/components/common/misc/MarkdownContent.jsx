import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const REMARK_PLUGINS = [remarkGfm, remarkBreaks];

const COMPONENTS = {
  // eslint-disable-next-line no-unused-vars, jsdoc/require-jsdoc
  table: ({ node, ...props }) => (
    <div className="table-responsive">
      <table className="table table-sm table-bordered" {...props} />
    </div>
  ),
};

/**
 * Renders Markdown text with GitHub Flavored Markdown (tables, autolinks, strikethrough,
 * task lists, footnotes) and soft line breaks as `<br>`. Raw HTML stays escaped and URLs
 * keep the default sanitization.
 *
 * @param {object} props - Component props.
 * @param {string} props.children - The Markdown source text.
 * @returns {React.ReactElement} The rendered Markdown.
 */
export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
      {children}
    </ReactMarkdown>
  );
}
