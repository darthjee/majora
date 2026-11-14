# Plan: Fix Markdown rendering

Issue: [1773-fix-markdown-rendering.md](../../issues/1773-fix-markdown-rendering.md)

## Overview

Enable GitHub Flavored Markdown (`remark-gfm`) in every Markdown field by introducing a shared
`MarkdownContent` component (GFM + `remark-breaks`, Bootstrap-styled responsive tables) and
switching the three existing `ReactMarkdown` call sites to it. Frontend only.

See [frontend.md](frontend.md) for the full plan.
