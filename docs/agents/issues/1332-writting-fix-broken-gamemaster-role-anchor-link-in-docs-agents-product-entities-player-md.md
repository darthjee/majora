# Issue: Writting: fix broken "GameMaster Role" anchor link in docs/agents/product/entities/player.md

## Description
A Codacy documentation finding (`markdownlint` rule `MD051`, "Link fragments should be valid") flags a broken anchor link in `docs/agents/product/entities/player.md`.

## Problem
Line 16 of `docs/agents/product/entities/player.md` reads:

```markdown
DM/GameMaster — see [GameMaster Role](#gamemaster-role) below.
```

This links to the fragment `#gamemaster-role` *within `player.md` itself*, but that file only contains a single `# Player` title — it has no "GameMaster Role" heading. The actual `# GameMaster Role` heading (line 21) lives in a sibling file, `docs/agents/product/entities/ownership-and-roles.md`.

## Expected Behavior
The link should resolve to the existing `GameMaster Role` heading in `ownership-and-roles.md`, and the markdownlint MD051 finding should no longer trigger on this line.

## Solution
In `docs/agents/product/entities/player.md`, change the link target from the in-file fragment to point at the sibling file (same directory, so a bare relative filename suffices):

```markdown
DM/GameMaster — see [GameMaster Role](ownership-and-roles.md#gamemaster-role) below.
```

## Benefits
- Resolves the Codacy/markdownlint MD051 finding.
- Restores correct navigation for readers following the DM/GameMaster cross-reference from `player.md` to `ownership-and-roles.md`.
