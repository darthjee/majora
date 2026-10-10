# Writting: replace raw HTML elements in .github commit message templates with Markdown

## Context

Codacy's markdownlint scan (`MD033`, BestPractice, Info severity) flags 6 raw inline HTML elements (`<type>`, `<AI>`, `<agent>`) in `.github/commit_message_template.md` and `.github/commit_message_template-2.0.md`. Raw HTML inside Markdown placeholders can render inconsistently across viewers (GitHub renders angle-bracket text as HTML tags, which can disappear or mis-render).

## What needs to be done

Docs: reformat the placeholder tokens in both commit message templates using Markdown-safe placeholder syntax (e.g. backticked `` `<type>` `` or an alternative bracket style like `{type}`) instead of bare angle brackets, at:

- .github/commit_message_template.md:1 (`type`), :5 (`AI`), :6 (`agent`)
- .github/commit_message_template-2.0.md:1 (`type`), :7 (`AI`), :8 (`agent`)

## Acceptance criteria

- [ ] The 6 flagged placeholders no longer render as raw/broken HTML in GitHub's Markdown preview
- [ ] Both templates remain usable as copy-paste commit message skeletons
- [ ] Codacy's markdownlint `MD033` finding clears for both files
