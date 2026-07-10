# Issue: Add versioning of entities

## Description

Majora currently has no way to track the history of changes made to its entities. In Ruby/ActiveRecord, `PaperTrail` provides this via a dedicated versions table storing the full state of each record at each change. We want equivalent behavior in Django: a way to keep a full-state (not diff-only) snapshot of tracked entities every time they change, so old versions can later be pruned without losing the ability to reconstruct any point-in-time state, and so changes can be debugged and rolled back.

## Problem

There is no audit trail for changes to core game entities. If a `Character`, `Treasure`, or other tracked entity is modified or its data is lost/corrupted, there is no way to know what it looked like before, who changed it, or to roll back to a prior state.

## Expected Behavior

- Track full-state snapshots (not just diffs) for: `Game`, `Player`, `Character`, `Treasure`, `CharacterTreasure`, `GamePhoto`, `CharacterPhoto`, `Link`, `CharacterLink`, and `TreasurePhoto`.
- `GameTreasure` (the `Game`<->`Treasure` stock-cap through model) is explicitly out of scope.
- Track which user made each change.
- Store versions in a dedicated table per tracked entity (e.g. `HistoricalGame`, `HistoricalCharacter`, ...), rather than one shared table for all entities.
- Live in a brand-new top-level Django app (`source/versioning/`) — the second app in this project besides `games` — since versioning is cross-cutting infrastructure rather than game domain logic.

## Solution

Use `django-simple-history` to automatically snapshot model state on save, instead of building this from scratch.

`django-simple-history` was chosen over `django-reversion` because it generates a dedicated `Historical<Model>` table per tracked model (e.g. `HistoricalGame`, `HistoricalCharacter`), directly satisfying the "dedicated table per entity" requirement. `django-reversion`, by contrast, stores all versions in two shared, generic tables (`reversion_version` and `reversion_revision`, keyed by content type + object id) — no per-model tables. `django-simple-history` also supports capturing the acting user (via its middleware, using `request.user`) and stores a full-state snapshot per change, not a diff.

The tracking will live in a new top-level Django app (`source/versioning/`), kept separate from the `games` domain app.

## Benefits

- Audit trail of who changed what and when.
- Easier debugging of data issues, since full past states are available.
- Ability to roll back an entity to a previous state.
- Old versions can be pruned later without losing point-in-time reconstruction ability, since each version stores full state rather than a diff.
