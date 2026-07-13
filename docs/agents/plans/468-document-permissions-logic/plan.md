# Plan: Document permissions logic

Issue: [468-document-permissions-logic.md](../issues/468-document-permissions-logic.md)

## Overview
Add a single "Permission Principles" doc that states the general access-control conventions once (role/access-level hierarchy, the partial-vs-full route pattern, and the public/regular-vs-hidden attribute pattern), then trim `character.md` — the only resource doc that currently restates these conventions in prose — to link to it instead of re-deriving them.

## Context
`docs/agents/access-control/` documents access rules per resource. `character.md` currently explains, from scratch, why there are separate `.json`/`full.json`/`all.json` routes and why `allegiance`/`public_allegiance` and `slain`/`public_slain` exist as field pairs. Other resource docs (`game.md`, `treasure.md`, `character-treasure.md`, `character-link.md`, etc.) were checked and do not restate these two conventions — `treasure.md`'s `hidden` field is a plain hidden-attribute case, not a public/regular pair, and the other two files just link to `full.json` in passing without explaining the pattern. So the only doc needing trimming is `character.md`.

## Implementation Steps

### Step 1 — Add the principles doc
Create `docs/agents/access-control/principles.md` with four sections:
1. **Source of truth & access levels** — backend is the sole source of truth for read/write access; role hierarchy from broadest to narrowest: Superuser (admin access everywhere) > Staff (staff access everywhere) > resource-scoped roles (`dm` = GameMaster of the game in the resource path, `player` = any player of that game, `owner` = the player who owns the character in the resource path). State explicitly that these map onto the roles already defined in [user-roles.md](../access-control/user-roles.md) — no new role vocabulary.
2. **Partial vs full access pattern** — when a resource has partial and full access classes, the backend exposes two routes rather than branching a shared serializer/filter by role: Show (`.../:id.json` vs `.../:id/full.json`), Update (full-only: `PATCH .../:id/full.json`), Index (`....json` vs `.../all.json`). A user lacking full access simply gets no access to the full/all route.
3. **Public vs regular attribute pattern** — a restricted "real" field `x` paired with a wider-audience `public_x`; the partial endpoint exposes `public_x` under the plain `x` key, the full endpoint exposes both keys; filtering on the partial endpoint filters against `public_x`. Reference `slain`/`public_slain` and `allegiance`/`public_allegiance` on `Character` as the existing example.
4. **Distinction from hidden attributes** — a hidden attribute (e.g. `description`/`hidden_description`) is not a public/regular pair; it's simply omitted from responses for audiences that lack access, with no alternate public value substituted.

### Step 2 — Link the new doc from the index
Add `principles.md` to `access-control.md`'s "Shared reference" bullet list (alongside `user-roles.md` and `common-rules.md`), with a one-line description matching the style of the existing two entries.

### Step 3 — Trim `character.md`
- In the "Full detail" section, replace the rationale for why the full route exists with a link to the partial/full section of `principles.md`, keeping only what's Character-specific (the exact routes, that it's **CharacterEdit**-gated, and that it always sets `X-Skip-Cache: true`).
- In "Allegiance fields" and "Slain fields", replace the general explanation of the public/regular pattern with a link to that section of `principles.md`, keeping only what's specific to these two fields: the field names, defaults, which serializer/route writes them, and the filtering behavior on `?allegiance=`/`?slain=`.
- Leave the "public/regular is different from hidden attributes" distinction out of `character.md` entirely (it belongs only in `principles.md`) unless a concrete hidden-field example already lives in `character.md` — check before removing anything that isn't actually a restatement of the general pattern.

## Files to Change
- `docs/agents/access-control/principles.md` — new file (Step 1)
- `docs/agents/access-control.md` — add link under "Shared reference" (Step 2)
- `docs/agents/access-control/character.md` — trim restated prose in "Full detail", "Allegiance fields", "Slain fields" to link to `principles.md` (Step 3)

## Notes
- No other resource doc needs trimming — `game.md` doesn't reference `full.json`/`all.json` at all; `treasure.md`'s `hidden` field is a plain hidden-attribute case, not a public/regular pair; `character-treasure.md` and `character-link.md` only link to `full.json` in passing without restating the convention. Confirm this is still true at implementation time in case docs have changed since this plan was written.
- Documentation-only change; no code, tests, or CI jobs are affected.
