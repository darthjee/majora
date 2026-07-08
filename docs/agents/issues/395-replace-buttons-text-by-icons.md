# Replace buttons text by icons

## Context

Several buttons across the app currently show only text. This issue replaces the text on those buttons with icons, using the original button text as the accessible name (e.g. `aria-label`/`title`) so the meaning is preserved for screen readers and hover tooltips.

The project already depends on **Bootstrap Icons** (`bootstrap-icons` npm package) and uses it elsewhere (`LinkIcon.jsx`) via `<i className="bi bi-...">`. Suitable glyphs already exist in that set: `bi-camera`, `bi-heart`, `bi-skull`.

## What needs to be done

For each button listed below, replace the visible text with an icon, keeping the button's existing chrome (background color/shape) unchanged. The original text becomes the control's accessible name via both `aria-label` (for screen readers) and `title` (for the hover tooltip).

### Game page: `/#/games/:game_slug`
- Upload Photo -> camera icon

### Game edit page: `/#/games/:game_slug/edit`
- Upload Photo -> camera icon

### NPCs page: `/#/games/:game_slug/npcs`
- Upload Photo -> camera icon
- Revive -> heart icon
- Mark as Slain -> skull icon
  - Accessible text (English): "Slain"
  - Accessible text (Portuguese): "Morto"

### NPC page: `/#/games/:game_slug/npcs/:id`
- Upload Photo -> camera icon
- Revive -> heart icon
- Mark as Slain -> skull icon
  - Accessible text (English): "Slain"
  - Accessible text (Portuguese): "Morto"

### PC page: `/#/games/:game_slug/pcs/:id`
- Upload Photo -> camera icon

### Treasures page: `/#/treasures`
- Upload Photo -> camera icon

### NPC photos page: `/#/games/:game_slug/npcs/:id/photos`
- Upload Photo -> camera icon

### PC photos page: `/#/games/:game_slug/pcs/:id/photos`
- Upload Photo -> camera icon

### Game photos page: `/#/games/:game_slug/photos`
- Upload Photo -> camera icon

Implementation notes:
- Reuse the existing Bootstrap Icons font set (already a dependency) rather than adding new icon assets. Use the filled variants (`bi-camera-fill`, `bi-heart-fill`, `bi-skull` — no unfilled/filled distinction exists for skull) to start.
- Define the icon choice in one central, named mapping (e.g. an `Icons`/`icon names` constant shared across components) rather than hardcoding the Bootstrap Icons class string at each call site, so a given icon (camera, heart, skull, etc.) can be swapped later from a single place.
- Each converted button keeps its current chrome (colored background/shape) — only the visible text is replaced by the icon glyph. The original text is set as both `aria-label` and `title` on the button.
- "Upload Photo" is rendered by two separate components, both in scope:
  - `PhotoUploadOverlay.jsx`, used on the Game, Game edit, NPC, PC, and Treasures pages listed above.
  - `UploadButton.jsx`, used on the NPC/PC/Game *photo list* pages listed above.
- "Revive" and "Mark as Slain" are rendered through `PhotoUploadOverlay.jsx`'s `renderSecondaryButton`, fed by `CharacterCardHelper.jsx` (NPC list page) and `CharacterHelper.jsx` (NPC detail page).

## Acceptance criteria

- [ ] All "Upload Photo" buttons listed above (via `PhotoUploadOverlay.jsx` and `UploadButton.jsx`) show a camera icon instead of text, with the original text preserved as `aria-label` and `title`.
- [ ] "Revive" buttons show a heart icon instead of text, with the original text preserved as `aria-label` and `title`.
- [ ] "Mark as Slain" buttons show a skull icon instead of text, with "Slain"/"Morto" preserved as `aria-label` and `title` per the active locale.
- [ ] Icon class names are defined in a single central, named mapping rather than hardcoded at each call site.
- [ ] Button chrome (background color/shape) is unchanged.

Tags: :shipit:
