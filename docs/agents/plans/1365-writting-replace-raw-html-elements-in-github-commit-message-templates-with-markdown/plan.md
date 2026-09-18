# Plan: Writting: replace raw HTML elements in .github commit message templates with Markdown

Issue: [1365-writting-replace-raw-html-elements-in-github-commit-message-templates-with-markdown.md](../issues/1365-writting-replace-raw-html-elements-in-github-commit-message-templates-with-markdown.md)

## Overview

Wrap every bare angle-bracket placeholder in `.github/commit_message_template.md` and `.github/commit_message_template-2.0.md` in backticks (e.g. `<type>` becomes `` `<type>` ``), so GitHub's Markdown renderer treats them as literal code-span text instead of parsing the single-word ones as raw HTML tags. This covers all placeholders in both files for consistency, not just the 6 Codacy's markdownlint (`MD033`) currently flags.

## Context

Codacy's markdownlint scan flags `<type>`, `<AI>`, and `<agent>` as raw inline HTML (MD033, BestPractice, Info severity) in both templates, since GitHub's Markdown parser treats bare single-word angle-bracket tokens as HTML tag syntax. The templates also contain other bare angle-bracket placeholders (`<scope>`, `<subject>`, `<id>`, `<optional body: ...>`, `<AI model name>`, `<AI model email>`, `<agent email>`, and the 2.0 template's `<optional: URL of the PR comment this commit addresses>`) that are structurally identical and should be converted too, for visual consistency and to preempt future lint hits.

## Implementation Steps

### Step 1 — Backtick every placeholder in `commit_message_template.md`
Wrap each bare angle-bracket placeholder on lines 1, 3, 5, and 6 in backticks: `<type>`, `<scope>`, `<subject>`, `<id>`, `<optional body: what was done and why, if not obvious>`, `<AI model name>`, `<AI model email>`, `<agent>`. Keep the angle brackets themselves — only add the surrounding code-span backticks — so the file stays a usable copy-paste commit message skeleton.

### Step 2 — Backtick every placeholder in `commit_message_template-2.0.md`
Wrap each bare angle-bracket placeholder on lines 1, 3, 5, 7, and 8 in backticks: `<type>`, `<scope>`, `<subject>`, `<id>`, `<optional body: what was done and why, if not obvious>`, `<optional: URL of the PR comment this commit addresses>`, `<AI model name>`, `<AI model email>`, `<agent>`, `<agent email>`. The explanatory prose below the template (lines 10+) already uses `{agent}` for a different purpose (a real, runtime-substituted `git.email` config template) — leave that section untouched; only the copy-paste skeleton at the top needs the backtick treatment.

## Files to Change
- `.github/commit_message_template.md` — wrap all angle-bracket placeholders in backticks
- `.github/commit_message_template-2.0.md` — wrap all angle-bracket placeholders in backticks (skeleton only, not the explanatory prose)

## CI Checks
- repo root: `yarn lint_md` (CI job: `markdownlint`)

## Notes
- No behavior change: neither file is parsed at runtime (per `commit_message_template-2.0.md`'s own note), so this is a pure documentation/formatting fix.
- This is a cross-cutting docs change to root-level `.github/` files with no code impact on any specialist agent's domain (backend, frontend, proxy, etc.) — no agent split needed; `architect` owns it.
