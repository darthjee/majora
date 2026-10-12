# Backend Plan: Game content copy: Items tab

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the list/copy endpoints exactly as in [plan.md](plan.md#shared-contracts): `items` first
in `COPY_TYPES`; list rows `{id, name, hidden, photo, copied_to_target}` (`photo` = ready cover
path or null); copy `201 {id, links}` with 0–1 `image` link, `X-Cache-Clear` on the copy `201`
and on the cover link finalize.

## Steps

- [01 — Shared copy-type scaffolding](backend/01-copy-type-scaffolding.md)
- [02 — Cover-photo link builder](backend/02-cover-photo-link-builder.md)
- [03 — Character available-list cache paths](backend/03-character-available-cache-paths.md)
- [04 — Items copy type and cache hook](backend/04-items-copy-type.md)

## CI Checks
- `backend`: `make test-backend` and `make lint-backend` (or the `docker-compose` equivalents in
  `AGENTS.md`) — CircleCI backend test and lint jobs.

## Notes
- `copy_types_test.py::test_registry_is_empty` must change: the registry now holds `items`.
  `test_no_registered_slug_is_reserved` keeps holding.
- `copied_from` is already documented in `docs/agents/product/entities/game-item.md` (#1568);
  no product doc change expected.
- The finalize path already exists (`CopyLinkFinalizer`, `CoverCopyLink.set_cover`, pending-links
  reach through `game_item__game`); only the `cache_paths` hook is new there.
- Keep helpers generic but minimal: other tabs differ (recipes have no photo, documents have
  galleries and files, factions answer `422` on names), so expose small composable pieces rather
  than one rigid template method.
