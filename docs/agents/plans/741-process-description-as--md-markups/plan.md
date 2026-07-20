# Plan: Process description as .md markups

Issue: [741-process-description-as--md-markups.md](../../issues/741-process-description-as--md-markups.md)

## Overview

Change the shared `DescriptionBox` component so it parses its `description` prop as Markdown (via the new `react-markdown` dependency) instead of rendering it as a raw, pre-wrapped string. The change is display-only and applies uniformly everywhere `DescriptionBox` is used — Game show page, PC/NPC show pages (public description and DM notes), and PC/NPC/Game item show pages — since they all share the same component. The existing collapsible "show more"/"show less" behavior must keep working against the newly-rendered markup.

## Context

- `frontend/assets/js/components/common/misc/DescriptionBox.jsx` measures overflow via `useLayoutEffect`/`scrollHeight` against a `boxRef` div and toggles an `expanded` state.
- `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx` is a static, pure rendering helper (this repo's "component + helper" split) that currently inserts `description` as plain JSX text (`{description}`) inside a `div.p-3.border.rounded.bg-light.text-pre-wrap`, relying on the CSS class alone to preserve line breaks.
- No markdown or HTML-sanitization library exists anywhere in `frontend/package.json` today; safety currently comes purely from React's auto-escaping of a plain string. `react-markdown` does not render raw HTML embedded in the source by default, so it stays safe against XSS without adding a separate sanitizer.
- **Line-break behavior will change with plain `react-markdown`**: standard Markdown collapses a single `\n` inside a paragraph into a space (only a blank line, or two trailing spaces, starts a new block/line). The current `text-pre-wrap` CSS class preserves every single newline. To keep today's line-break behavior, add the `remark-breaks` plugin (turns single newlines into hard breaks) alongside `react-markdown`.
- Because the rendered output becomes block-level markdown elements (`<p>`, `<ul>`, `<h1>`, etc.) instead of a single text node, `text-pre-wrap` stops being meaningful for line-break preservation and can be dropped from the box's className (keep `p-3 border rounded bg-light` for the box chrome). Overflow measurement (`scrollHeight` vs `MAX_COLLAPSED_HEIGHT`) is agnostic to this and needs no changes.

## Implementation Steps

### Step 1 — Add the dependency

Add `react-markdown` and `remark-breaks` to `frontend/package.json` (`dependencies`). Install via the project's containerized workflow, not the host machine:

```bash
docker-compose run --rm majora_fe yarn add react-markdown remark-breaks
```

### Step 2 — Render markdown in `DescriptionBoxHelper`

In `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx`:
- Import `ReactMarkdown` from `react-markdown` and `remarkBreaks` from `remark-breaks`.
- Replace the raw `{description}` text node with `<ReactMarkdown remarkPlugins={[remarkBreaks]}>{description}</ReactMarkdown>` inside the existing bordered `div` (drop `text-pre-wrap` from that div's className since it no longer preserves anything meaningful).
- Do not pass any HTML-rendering plugin/option — keep the library's default of not rendering raw embedded HTML, so no new sanitizer is introduced.
- Leave the `#renderToggle` "show more"/"show less" logic untouched.

### Step 3 — Update existing specs

- `frontend/specs/assets/js/components/common/misc/helpers/DescriptionBoxHelperSpec.js`:
  - The "preserves line breaks via the text-pre-wrap class" test currently asserts literal `'Line one.\nLine two.'` text and the `text-pre-wrap` class — update it to reflect the new rendering (e.g. assert a `<br>` is produced between the two lines instead of raw `\n` text, and drop the `text-pre-wrap` class assertion).
  - The "renders the description inside the bordered box" test asserts plain text `'The future king.'` appears in the output — this still holds since a single line of plain text renders unchanged inside a `<p>`, but double check the exact wrapping tag is tolerated by `toContain`.
  - The toggle-button tests (`renders a "Show more"/"Show less" toggle`, `invokes onToggle`, `does not render a toggle button when the content does not overflow`) access `element.props.children[1]` positionally — confirm this still resolves to the toggle button once the description child is a `<ReactMarkdown>` element instead of a raw string, and adjust the indexing/lookup if the wrapping changes the children shape.
- `frontend/specs/assets/js/components/common/misc/DescriptionBoxSpec.js`: the `DescriptionBoxHelper.render` calls are spied/mocked in most tests, so they're unaffected; only the "renders the box markup via DescriptionBoxHelper when description is present" test exercises real rendering — verify it still passes since `'The future king.'` is plain text with no markdown syntax.

### Step 4 — Manual/visual check

Since this affects a shared, widely-used component, manually verify (e.g. via the dev server) that a markdown-formatted description renders correctly and the collapse/expand toggle still triggers correctly, on at least one PC/NPC show page and one Item show page.

## Files to Change

- `frontend/package.json` — add `react-markdown` and `remark-breaks` dependencies.
- `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx` — render `description` via `ReactMarkdown` (+ `remark-breaks`) instead of as raw text; drop `text-pre-wrap`.
- `frontend/specs/assets/js/components/common/misc/helpers/DescriptionBoxHelperSpec.js` — update assertions affected by the new rendered markup (line-break test, possibly toggle-button child indexing).
- `frontend/specs/assets/js/components/common/misc/DescriptionBoxSpec.js` — verify still passes; no changes expected but re-run to confirm.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)

## Notes

- No backend, translation, infra, or proxy changes are needed — `description_box.show_more`/`show_less` i18n keys already exist and are untouched.
- No changes to edit/create forms — this is display-only, per the issue's confirmed scope.
- Applies to every current usage of `DescriptionBox` (Game description, PC/NPC public description, PC/NPC DM notes, PC/NPC/Game item description) since they all share the same component — no per-usage opt-out prop is being added.
