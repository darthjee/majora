# Plan: Game content copy spec: Factions tab

Issue: [1556-game-content-copy-spec-factions-tab.md](../../issues/1556-game-content-copy-spec-factions-tab.md)

## Overview

Write the Factions tab page of the game content copy spec,
`docs/agents/specs/game-content-copy/factions.md`, link it from the spec index, and record the
factions-only `name_taken_in_target` list field in the staff copy access rules. Documentation
only — no code changes.

## Context

The global pages (`page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`) and the other
tab pages (`items.md`, `common-items.md`, `recipes.md`, `documents.md`) already exist. The
factions page follows their structure and only adds what is specific to `GameFaction`:

- no `hidden` and no `description` field;
- the unique `(game, name)` constraint → `422` on a name clash (already decided in
  `copy-flow.md#names`), surfaced beforehand by a new list flag `name_taken_in_target` (row still
  selectable);
- only the ready cover `photo` is copied, at the fixed `photo<ext>` path used by
  `game_faction_photo_upload` (`use_uuid=False`);
- members (`CharacterFaction`) are never copied.

## Steps

- [01 — Write the factions tab page](plan/01-write-factions-page.md)
- [02 — Link the page from the spec index](plan/02-link-from-index.md)
- [03 — Record `name_taken_in_target` in the staff copy access rules](plan/03-access-control-field.md)

## CI Checks

- Markdown lint (`.markdownlint.json`) on the touched files.

## Notes

- Keep line width and section order consistent with `documents.md` / `items.md`.
- Reference the global pages with anchors rather than repeating their rules.
