# Plan: Game content copy: backend foundation (copied_from, staff/copies API skeleton, staff gate)

Issue: [1568-game-content-copy-backend-foundation-copied-from-staff-copies-api-skeleton-staff-gate.md](../../issues/1568-game-content-copy-backend-foundation-copied-from-staff-copies-api-skeleton-staff-gate.md)

## Overview
Adds the `copied_from` provenance FK to the six copyable game models, plus every staff-only `staff/copies*` view: the tab index, the cross-domain games list, and the generic list/copy dispatch onto an empty `CopyType` registry that the tab issues (#1572–#1577) fill in. Backend code is owned by the `backend` agent. The doc updates live outside `backend/` and are done by the architect.

See [backend.md](backend.md) for the full backend plan.

## Docs (architect, outside `backend/`)
- `docs/agents/product/entities/ownership-and-roles.md`: add a fourth named exception under "Staff Role" (issue #1568: Staff may create copies of game content in any game, via `POST /staff/copies/<type>/<id>.json`; creation only, no edit, delete or GameMaster rights over the source or the copy). Update the "Three explicit, named exceptions" wording to "Four", and the Staff row of the role table. Consult `product-owner` on the wording.
- `docs/agents/product/entities/game-item.md`, `game-document.md`, `game-recipe.md`: add a `copied_from` note: a nullable provenance link to the source entity (usually in another game), `SET_NULL` when the source is deleted, staff-only, never exposed by game serializers.
- Do **not** touch the "Planned" banner of `docs/agents/access-control/staff-copy.md` or the "**planned**" marker in `docs/agents/access-control.md` (#1558 owns them).

## Reviews
- `data-access` and `security`: new endpoints, staff gate, and the domain bypass in `games.json`.
- `cache`: confirms no Navi resource is needed (every endpoint is `X-Skip-Cache`).
