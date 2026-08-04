# Writing Docs in `docs/agents/`

Formatting rules for any Markdown file under `docs/agents/` — hub/area docs, issue files
(`issues/*.md`), and plan files (`plans/**/*.md`). Codacy's static analysis check runs on
every PR and lints Markdown; getting this wrong doesn't break anything locally, but it
fails the PR check and forces a follow-up fix-up commit.

## Blank lines around headings

Every heading (`#`, `##`, `###`, ...) must have a blank line immediately **before and
after** it — never let a heading sit directly against the next paragraph or list.

Wrong:

```markdown
## Problem
`CSRF_TRUSTED_ORIGINS` only reflects origins configured via the env var.
```

Right:

```markdown
## Problem

`CSRF_TRUSTED_ORIGINS` only reflects origins configured via the env var.
```

## Blank lines around lists

A list (`- item` or `1. item`) must have a blank line before its first item and after its
last item, separating it from surrounding paragraphs.

## Where this matters most

The `enhance-issue`, `discuss-issue`, and `auto-plan-issue` skills assemble issue and plan
files from templated sections. When writing or editing these sections, add the blank line
after each heading as part of the content itself — don't rely on the template to add it.
Before committing an issue or plan file, skim it for headings or lists butted directly
against text.

## No local equivalent

There's no markdownlint config or CI job in this repo to run locally — this check only
runs as part of Codacy's PR analysis. Get it right by eye using the rules above rather than
expecting a local command to catch it.
