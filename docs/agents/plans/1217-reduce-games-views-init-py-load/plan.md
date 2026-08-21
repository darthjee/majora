# Plan: Reduce `games/views/__init__.py` load

Issue: [1217-reduce-games-views-init-py-load.md](../../issues/1217-reduce-games-views-init-py-load.md)

## Overview

`backend/games/views/__init__.py` eagerly imports and re-exports ~200+ view functions,
but the only real consumers of that re-export are the 8 `backend/games/urls/*.py` files
(via `from .. import views` + attribute access). This mirrors #1216's fix for
`games/serializers/__init__.py`: replace the 8 urls files' attribute-access calls with
direct named imports from the owning view submodules, then shrink `__init__.py` to a
docstring-only module. No behavior/route change — pure import-path refactor.

## Agents involved

- [backend](backend.md)
- [architect](architect.md)

## Shared contracts

None functionally — this is a single-repo, import-path-only refactor with no runtime
interface between the two agents. The only thing that crosses the boundary is factual:
architect's doc update in `docs/agents/views-organization.md` must accurately describe
the end state backend produces (urls files import directly from view submodules; the
package `__init__.py` no longer re-exports), so architect's edit should be made after
backend's import changes are done (or by re-reading backend's finished diff), not
speculatively before.
