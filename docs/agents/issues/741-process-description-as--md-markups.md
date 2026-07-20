# Issue: Process description as .md markups

## Description
The shared `DescriptionBox` component (`frontend/assets/js/components/common/misc/DescriptionBox.jsx` + `helpers/DescriptionBoxHelper.jsx`) currently renders description text as plain, pre-wrapped text inside a collapsible box. It is used by every page below, all sharing the same rendering logic:
- Game show page (`game.description`)
- PC/NPC show pages (`public_description` and `private_description`/DM notes)
- PC/NPC item show pages and Game Item show page (`item.description`)

## Problem
Descriptions cannot use any rich formatting (headings, lists, bold/italic, links, etc.) — everything renders as a single block of plain text, even if the author writes markdown-style syntax. Additionally, the codebase has no markdown-rendering library and no HTML-sanitization library (no `dangerouslySetInnerHTML`, no DOMPurify) today — safety currently comes purely from never parsing text as HTML.

## Expected Behavior
`DescriptionBox` should parse its `description` prop as Markdown and render the resulting formatted output, while keeping its existing collapsible/"show more"/"show less" behavior based on rendered content height. Since `DescriptionBox` is a single shared component, this change applies uniformly to every page listed above — including the Game show page and DM notes, not only the Character/Item pages originally called out. This is display-only: no changes to edit/create forms or their textareas.

## Solution
Add `react-markdown` as a new frontend dependency and use it inside `DescriptionBoxHelper` to render `description` instead of outputting the raw string. `react-markdown` does not render raw HTML embedded in markdown by default, so no separate sanitization library is needed to stay safe from XSS. The collapsible height-measurement logic in `DescriptionBox.jsx` (via `useLayoutEffect`/`scrollHeight`) should continue to work against the rendered markdown output.

## Benefits
Authors can format Character, Item, Game, and DM-notes descriptions with headings, lists, emphasis, and links, improving readability consistently across every page that uses the shared component.
