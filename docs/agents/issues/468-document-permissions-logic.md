# Issue: Document permissions logic

## Description
Access-control documentation currently restates the same underlying rules in every resource file under `docs/agents/access-control/` (e.g. the partial-vs-full route split, and the public/hidden attribute convention are each re-explained per resource). This issue adds a single "Permission Principles" document capturing these rules once, and updates the existing per-resource docs to reference it instead of repeating it.

## Problem
- The access-level hierarchy (Superuser/Admin > Staff > resource-scoped roles like DM/Player/Owner) is implicit, spread across `user-roles.md` and re-derived per resource rather than stated as one principle.
- The "two routes for one resource" pattern (partial vs full access, e.g. `.../:id.json` vs `.../:id/full.json`, `.../all.json` for index) is currently explained inline in resource docs like `character.md`, rather than documented once as a shared convention.
- The "public/regular attribute" pattern (e.g. `slain`/`public_slain`, `allegiance`/`public_allegiance`) is likewise explained from scratch in `character.md`, with no shared reference describing the general rule (limited endpoint exposes the public value under the regular key; full endpoint exposes both).
- Nothing currently documents that this public/regular pairing is a distinct concept from a plain hidden attribute (e.g. `description` vs `hidden_description`, which is simply absent for some audiences rather than replaced by a public alternative).
- As new resources are added, this encourages copy-pasting prose instead of linking to a shared principle, and risks drift if the pattern is described slightly differently each time.

## Solution
1. Add `docs/agents/access-control/principles.md`, linked from `access-control.md`'s "Shared reference" section, documenting:
   - **Source of truth & access levels**: the backend is the sole source of truth for who can access what, and is responsible for blocking read or write access when the user lacks it. Roles, from broadest to narrowest scope: Superuser (admin access on all pages), Staff (staff access on all pages), and resource-scoped roles that depend on the page/resource — `dm` (GameMaster of the game in the resource path), `player` (any player of the game in the resource path), `owner` (the player who owns the character in the resource path). These map directly onto the roles already defined in [user-roles.md](access-control/user-roles.md) — no new role vocabulary is introduced.
   - **Partial vs full access pattern**: when a resource has two access classes (partial and full), the backend exposes two separate routes for the same resource rather than branching a shared serializer or filter by user role. A user lacking full access simply lacks access to the full-access route.
     - Show: partial `GET .../:id.json`, full `GET .../:id/full.json`
     - Update: full `PATCH .../:id/full.json` (partial route does not accept general updates)
     - Index: partial `GET ....json`, full `GET .../all.json`
   - **Public vs regular attribute pattern**: when an attribute has a restricted "real" value and a wider-audience "public" value, the model carries two fields (`x` and `public_x`). The partial/limited endpoint exposes `public_x` under the plain `x` JSON key (so the frontend always reads one key regardless of endpoint); the full endpoint exposes both keys separately. Filtering on the partial endpoint filters against the `public_x` column.
   - **Public/regular is distinct from hidden attributes**: a hidden attribute (e.g. `description` vs `hidden_description`) is not a partial/full pair — it is simply absent from responses for audiences who lack access, rather than replaced by an alternate public value.
2. Update the existing per-resource docs (`character.md`, and any other file currently restating these same two patterns, e.g. `game.md`, `treasure.md`) to drop the general explanation and link to `principles.md` instead, keeping only what's specific to that resource (which fields/routes apply, concrete examples) rather than re-deriving why the convention exists.

## Benefits
- One authoritative place to read and update the partial/full-access and public/hidden-attribute conventions, instead of N slightly-different restatements.
- New resources can link to the shared principle instead of copy-pasting prose, reducing the chance of drift or inconsistency.
- Keeps per-resource docs focused on resource-specific detail, matching the existing "split by resource" structure in `access-control.md`.
