# Fix button layout in character photos page

## Context

The upload-photo button on the game/PC/NPC photos pages is rendered as a raw inline `<button>`
duplicated in each helper, instead of using a shared, styled component like the rest of the
app's page-action buttons (e.g. `EditButton`).

On `/#/games/:game_slug/photos` (`GamePhotosHelper.jsx`), `/#/games/:game_slug/pcs/:id/photos`
(`PcCharacterPhotosHelper.jsx`), and `/#/games/:game_slug/npcs/:id/photos`
(`NpcCharacterPhotosHelper.jsx`), the upload button is placed inside `PageActions` next to the
back button, but is a plain `<button className="btn btn-secondary">` defined inline and
duplicated verbatim in each helper (missing the `mb-3` spacing used elsewhere), so it doesn't
have the same feel/spacing as other pages.

By contrast, on `/#/games/:game_slug/pcs/:id` (`CharacterHelper.jsx`), the Edit button next to
the back button uses the shared `EditButton` component (`btn btn-secondary mb-3`), giving it a
consistent look.

## What needs to be done

- Add a new shared component (e.g. `UploadButton.jsx`) mirroring `EditButton`/`NewButton`'s
  styling (`btn btn-secondary mb-3`) but `onClick`-based instead of `href`-based, since it opens
  the upload modal rather than navigating.
- Replace the duplicated `#renderUploadButton` inline `<button>` in `GamePhotosHelper.jsx`,
  `PcCharacterPhotosHelper.jsx`, and `NpcCharacterPhotosHelper.jsx` with the new shared
  component.

## Acceptance criteria

- [ ] A shared `UploadButton` component exists, styled with `btn btn-secondary mb-3`, and is
      `onClick`-based rather than `href`-based.
- [ ] `GamePhotosHelper.jsx`, `PcCharacterPhotosHelper.jsx`, and `NpcCharacterPhotosHelper.jsx`
      all use the new shared `UploadButton` component instead of duplicated inline
      `<button>` JSX.
- [ ] The upload button on the game, PC, and NPC photos pages visually matches the other
      page-action buttons (e.g. `EditButton`, `NewButton`) placed next to the back button.

---
Tags: :shipit:
