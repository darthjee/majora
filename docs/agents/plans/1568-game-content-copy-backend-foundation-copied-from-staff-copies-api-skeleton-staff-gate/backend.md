# Backend Plan: Game content copy: backend foundation (copied_from, staff/copies API skeleton, staff gate)

Main plan: [plan.md](plan.md)

## Overview
Add `copied_from` on the six copyable models, an empty `CopyType` registry modeled on `staff/photo_types.py`, and the four staff-only views (`staff/copies.json`, `staff/copies/games.json`, the list dispatch and the copy dispatch), all following the `staff_photos_*` view pattern.

## Context
The design source of truth is `docs/agents/specs/game-content-copy/copy-flow.md` and `permissions.md`, plus `docs/agents/access-control/staff-copy.md`. This issue only dispatches: shared copy behavior (transaction, `hidden`, setting `copied_from`, the `201` envelope) is built later by #1572. Every `staff/copies*` view lives here, and tab issues only register a `CopyType`.

## Steps

- [01 — Add the copied_from FK and migrations](backend/01-copied-from-fk.md)
- [02 — Add the copy-type registry](backend/02-copy-type-registry.md)
- [03 — Add the index and games views](backend/03-index-and-games-views.md)
- [04 — Add the list and copy dispatch views](backend/04-dispatch-views.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes
- Every view uses the `staff_photos_index` stack: `@restricted` outermost, `@api_view`, `@permission_classes([AllowAny])` with the existing comment, and `require_staff(request)` as the first statement. Nothing (type, slug, id) is resolved before the gate.
- No `EndpointPermission` / `permissions.yaml` entry, no Navi or proxy change.
- Docs outside `backend/` are done by the architect (see [plan.md](plan.md)).
- #1569 builds a `games` migration on top of this one. If migrations clash on numbering, rebase and renumber.
