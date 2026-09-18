# Issue: Writting: replace raw HTML elements in .github commit message templates with Markdown

## Description
Codacy's markdownlint scan (`MD033`, BestPractice, Info severity) flags raw inline HTML-like placeholder tokens in `.github/commit_message_template.md` and `.github/commit_message_template-2.0.md`. Angle-bracket tokens such as `<type>`, `<AI>`, and `<agent>` are parsed by GitHub's Markdown renderer as HTML tags, which can render inconsistently or disappear entirely in previews instead of showing as literal placeholder text.

## Problem
Both templates use bare angle-bracket placeholders throughout as fill-in-the-blank markers for a copy-paste commit message skeleton: `<type>`, `<scope>`, `<subject>`, `<id>`, `<optional body: ...>`, `<AI model name>`, `<AI model email>`, `<agent>`, `<agent email>` (and, in the 2.0 template, `<optional: URL of the PR comment this commit addresses>`). GitHub's Markdown renderer parses single-word bracket tokens as HTML tags, which can render inconsistently or disappear. Codacy's markdownlint currently flags the single-word tokens as raw HTML (`MD033`, BestPractice, Info severity) at:

- `.github/commit_message_template.md:1` (`type`), `:5` (`AI`), `:6` (`agent`)
- `.github/commit_message_template-2.0.md:1` (`type`), `:7` (`AI`), `:8` (`agent`)

The remaining placeholders (`<scope>`, `<subject>`, `<id>`, etc.) aren't currently cited by Codacy but are structurally identical bare angle-bracket tokens, so leaving them unconverted would produce a visually inconsistent template and remain equally susceptible to the same rendering issue.

## Expected Behavior
Every placeholder token in both templates renders as visible, literal placeholder text in GitHub's Markdown preview (no raw/broken HTML tags), the templates remain usable as copy-paste commit message skeletons, and Codacy's MD033 finding clears for both files.

## Solution
Wrap every angle-bracket placeholder token in both templates in backticks, e.g. `<type>` becomes `` `<type>` ``. Apply this consistently to all placeholders in both files, not just the 3 per file Codacy flagged — `<type>`, `<scope>`, `<subject>`, `<id>`, `<optional body: ...>`, `<AI model name>`, `<AI model email>`, `<agent>`, `<agent email>`, and the 2.0 template's `<optional: URL of the PR comment this commit addresses>`. The angle brackets stay as the visual placeholder convention; the surrounding code span is what stops GitHub's Markdown renderer from parsing them as HTML.

## Benefits
- Clears the Codacy MD033 finding for both templates
- All placeholders render correctly and consistently across Markdown viewers, not just the ones Codacy happened to flag
- Templates stay clear and usable as copy-paste commit message skeletons
