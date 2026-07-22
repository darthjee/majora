# Issue: Add text editor

## Problem
On `new`/`edit` pages, description-like fields are edited as a plain `<textarea>` (via the shared `TextareaField` component), but the equivalent `show` page renders the same value as Markdown (via the shared `DescriptionBox`/`ReactMarkdown` component). Users have no way to preview or easily author Markdown syntax (headings, lists, bold, links, etc.) while editing — they have to guess at the raw syntax and check the show page separately.

### Examples
- `/#/games/:game_slug/edit` has a textarea for description; `/#/games/:game_slug` renders it as Markdown.
- `/#/games/:game_slug/npcs/new` has a textarea for description; `/#/games/:game_slug/npcs/:id` renders it as Markdown.

## Expected Behavior
Every field that is rendered as Markdown on its `show` page uses a Markdown editor (instead of a plain textarea) on its `new`/`edit` page, so what the user types maps directly to what will be rendered.

### Affected fields/pages
All of these currently use the shared `TextareaField` component, and are rendered as Markdown on the corresponding show page:
- Game description — `/#/games/new`, `/#/games/:game_slug/edit` (`GameDescriptionField`)
- Item description (covers game items, pc items, and npc items) — `/#/games/:game_slug/items/new`, `/#/games/:game_slug/items/:id/edit`, `/#/games/:game_slug/pcs/:character_id/items/new`, `/#/games/:game_slug/pcs/:character_id/items/:id/edit`, `/#/games/:game_slug/npcs/:character_id/items/new`, `/#/games/:game_slug/npcs/:character_id/items/:id/edit` (`ItemDescriptionField`)
- Character (PC/NPC) description — `/#/games/:game_slug/npcs/new`, `/#/games/:game_slug/npcs/:id/edit`, `/#/games/:game_slug/pcs/:id/edit` (`CharacterDescriptionField`)
- Character (PC/NPC) DM notes — same new/edit pages as above (`CharacterDmNotesField`); also rendered as Markdown on show, so it gets the same editor

Treasures do not currently have a description field (neither on `new`/`edit` nor on `show`), so `/#/treasures/new`, `/#/treasures/:id/edit`, `/#/games/:game_slug/treasures/new`, and `/#/games/:game_slug/treasures/:id/edit` are out of scope for this issue.

## Solution
Introduce a single reusable `MarkdownEditor` component (in `frontend/assets/js/components/common/forms/`, alongside `TextareaField`) that follows the same prop contract (`id`/`label`/`value`/`onChange`/`errors`) so it's a drop-in replacement for `TextareaField` in the four wrapper components listed above (`GameDescriptionField`, `ItemDescriptionField`, `CharacterDescriptionFieldHelper`, `CharacterDmNotesFieldHelper`).

Build it in-house rather than pulling in a third-party editor package: a toolbar with buttons that insert Markdown syntax (bold, italic, headings, lists, links, etc.) into a `<textarea>`, plus a live preview pane reusing the existing `DescriptionBox`/`ReactMarkdown` rendering. This avoids adding a new dependency and its bundle-size/maintenance cost, and lets the component match the app's existing Bootstrap-styled, hand-rolled form component conventions instead of needing style overrides for a third-party widget's own theme.

## Benefits
- What the user types while editing matches what will be shown, removing the guesswork of writing raw Markdown blind.
- A single shared component keeps editing behavior consistent across games, items, and characters, and makes future description-like fields easy to wire up the same way.
