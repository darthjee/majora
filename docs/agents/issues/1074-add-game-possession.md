# Issue: Add Game Possession

## Description
`GamePossession` represents a large, unique belonging within a game — e.g. a house, a boat, a
tavern — as opposed to `GameItem` (small/magic items) or `Treasure` (stackable/quantity-based
valuables). It shares the item/document shape: nested under a `Game`, with a `name`,
`description`, a `hidden` flag, and a photo gallery (`photos`) with one photo marked as the
main `photo`.

Unlike `Treasure`, a possession has no quantity — a character can acquire at most one instance
of a given possession (mirroring `CharacterDocument`'s `unique_together` behavior), though
PC/NPC ownership itself is out of scope for this issue and tracked separately in #1076. This
issue covers game-level CRUD only: model, permissions, routes/pages, and i18n.

## Solution

### Data model
Mirror the `GameItem`/`GameDocument` pattern exactly:

```python
class GamePossession(models.Model):
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='possessions')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    photo = models.ForeignKey(
        'games.GamePossessionPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)
```

```python
class GamePossessionPhoto(BasePhoto):
    game_possession = models.ForeignKey(GamePossession, on_delete=models.CASCADE, related_name='photos')
```

- `photos` is the gallery (CASCADE-deleted with the parent); `photo` is a single FK marking which
  gallery photo is "main" (SET_NULL so deleting that photo doesn't delete the possession).
- `hidden` flag included, same as `GameItem`/`GameDocument` (GM-only visibility toggle).
- Uses the older per-model `*Photo`/`BasePhoto` pattern (like items/documents), not the newer
  generic `uploads` app used for STL models/miniatures.

### Permissions
Follow the `GameDocument` and `GameItem` permissions exactly — no intended differences.

### Pages
- `/#/games/:game_slug/possessions`
- `/#/games/:game_slug/possessions/new` (with photo upload)
- `/#/games/:game_slug/possessions/:id/edit` (with photo upload that replaces previous photo)
- `/#/games/:game_slug/possessions/:id` (with photo upload that replaces previous photo)

Follows the `GameItem` shape (not `GameDocument`'s): no dedicated `/photos` gallery page, no
`/files` sub-resource — a possession has a single photo upload surface that replaces the current
photo, same as items. `GameDocument`'s extra `/photos` and `/files` routes exist only because of
document-specific complexity (multiple upload surfaces) that possessions don't have.

Also include, mirroring `GameItem`/`GameDocument`, a backend `game_possessions_all` endpoint
(DM/superuser "include hidden" variant, `X-Skip-Cache`) backing the existing list page — not a
separate frontend page.

### Naming
`GamePossession` (model) / `possessions` (routes) as-is, no changes.

### i18n
New translation files (not folded into existing item/document files), following the `GameItem`
naming convention (list page keeps `game_` prefix, single-resource pages drop it), in both
`frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`:

- `game_possessions_page.yaml` — list page (title, hidden_label, create_possession)
- `possession_new_page.yaml` — create form (title, name/description/hidden labels, submit,
  error, photo-upload-failed retry/skip strings)
- `possession_edit_page.yaml` — edit form (same shape, "Edit possession" / "Save changes")
- `possession_page.yaml` — show page (loading, hidden_label)

### Relationship to Treasure
A Possession is conceptually distinct from a Treasure: Treasure is stackable/quantity-based
(`CharacterTreasure.quantity`, no unique constraint per character), while a Possession has no
quantity — a character can acquire at most one instance of a given possession, the same way
`CharacterDocument` enforces `unique_together = [('character', 'game_document')]`. This only
matters once ownership/acquisition is implemented in #1076, but is noted here to guide that
follow-up: any future `CharacterPossession` should follow the Document pattern, not the Treasure
pattern.

### Out of scope
PC/NPC ownership/acquisition of possessions is out of scope for this issue — tracked separately
in #1076. `GamePossession` stays game-level only here.
