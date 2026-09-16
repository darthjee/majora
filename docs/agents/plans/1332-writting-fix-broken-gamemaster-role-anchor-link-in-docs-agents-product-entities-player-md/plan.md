# Plan: Writting: fix broken "GameMaster Role" anchor link in docs/agents/product/entities/player.md

Issue: [1332-writting-fix-broken-gamemaster-role-anchor-link-in-docs-agents-product-entities-player-md.md](../../issues/1332-writting-fix-broken-gamemaster-role-anchor-link-in-docs-agents-product-entities-player-md.md)

## Overview

`docs/agents/product/entities/player.md` line 16 links to `#gamemaster-role`, a same-file
anchor that doesn't exist — the file only has a single `# Player` heading. The real
`# GameMaster Role` heading lives in the sibling file `ownership-and-roles.md`. This plan
repoints the link to the correct file, resolving the Codacy/markdownlint `MD051` finding.

## Context

Verified directly against the current files:
- `docs/agents/product/entities/player.md:16` — `DM/GameMaster — see [GameMaster Role](#gamemaster-role) below.`
- `docs/agents/product/entities/ownership-and-roles.md:21` — `# GameMaster Role` (the real heading, same directory as `player.md`).

## Implementation Steps

### Step 1 — Fix the anchor link

In `docs/agents/product/entities/player.md`, change the link from the broken in-file
fragment `(#gamemaster-role)` to the sibling-file link `(ownership-and-roles.md#gamemaster-role)`,
since both files live in the same directory:

```markdown
DM/GameMaster — see [GameMaster Role](ownership-and-roles.md#gamemaster-role) below.
```

## Files to Change

- `docs/agents/product/entities/player.md` — repoint the `GameMaster Role` link from `#gamemaster-role` to `ownership-and-roles.md#gamemaster-role`.

## Notes

- Purely a documentation link fix — no code, tests, or CI behavior involved.
