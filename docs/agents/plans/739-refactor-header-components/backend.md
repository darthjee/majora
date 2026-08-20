# backend Plan: Refactor game views folder structure

Main plan: [plan.md](plan.md)

## Steps

- [01 — Move documents domain](backend/01-move-documents-domain.md)
- [02 — Move factions domain](backend/02-move-factions-domain.md)
- [03 — Move items domain](backend/03-move-items-domain.md)
- [04 — Move photos domain](backend/04-move-photos-domain.md)
- [05 — Move possessions domain](backend/05-move-possessions-domain.md)
- [06 — Move treasures domain](backend/06-move-treasures-domain.md)

## CI Checks
- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)

## Notes
- One commit per domain (per the issue's "atomic commit" approach) — each step below is scoped to exactly one commit.
- Every moved file's own relative imports shift one directory level deeper: `._decorators` → `.._decorators`, `._shared` → `.._shared`, `..common` → `...common`, `...models` → `....models`, `...serializers` → `....serializers`. The document/faction/item/possession exchange files also import `..games._treasure_filters`/`..games._treasure_context` (sibling `games/` plural folder), which need one extra `..` as well.
- No changes needed under `backend/games/tests/views/game/` — it has no flat files to move, and tests exercise views via `reverse()` + an HTTP client rather than importing view modules directly.
- `__init__.py` at `game/` root only imports from `conversations/`, `npcs/`, `pcs/`, `players/`, never from the flat `_*.py` files, so it does not need changes.
- No cross-domain imports exist between the flat files being moved, so the 6 domain commits are independent and order does not matter.
