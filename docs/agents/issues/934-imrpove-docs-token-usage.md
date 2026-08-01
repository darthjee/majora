# Issue: Improve docs token usage

## Description
This issue tracks a set of documentation/codebase improvements aimed at reducing the token/context cost of working in this repo with AI agents, based on an audit of the current `docs/agents/` structure and related code.

## Problem
1. **Machine-friendly summaries for large docs** — most files under `docs/agents/` are already short (median ~30 lines) and already organized via a 2-level TOC (`AGENTS.md`'s table → per-folder index files like `access-control.md`, `frontend/index.md`, `security-guidelines.md`, `product.md`). However, a handful of files are large enough that an agent still pays a real token cost to read them in full: `docs/agents/access-control/principles.md` (200 lines), `docs/agents/access-control/character.md` (166), `docs/agents/product/entities/ownership-and-roles.md` (165), `docs/agents/access-control/common-rules.md` (152), `docs/agents/external/HOW_TO_USE_NAVI.md` (429), and `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` (837). None of these have a short summary an agent could read first to decide whether it needs the full file.
2. **Single source of truth / duplication** — permission rules already exist as machine-readable YAML under `backend/games/permissions/config/*/{endpoints,ui}.yml`, but the prose in `docs/agents/access-control.md` and `docs/agents/access-control/*.md` duplicates rule details already expressed in that YAML instead of pointing at it, risking drift between docs and config.
3. **Tests & fixtures** — `backend/games/tests/factories.py` (323 lines) is already centralized but has grown large as a single file. Frontend has a separate, much smaller `frontend/specs/support/factories.js` (53 lines) that hasn't had the same attention.

## Solution
1. Add a short "Agent Summary" block at the top of each of the 6 large files identified above (`principles.md`, `character.md`, `ownership-and-roles.md`, `common-rules.md`, `HOW_TO_USE_NAVI.md`, `HOW_TO_USE_DARTHJEE-TENT.md`), so an agent can decide from a few lines whether it needs to read the rest. Do not add a new global index file — it would mostly duplicate the existing `AGENTS.md` + per-folder index structure. Do not add summary headers to the many already-short files — the overhead would outweigh the savings.
2. Update `docs/agents/access-control.md` and its per-entity files under `docs/agents/access-control/` to replace rule details that are already expressed in the permission YAML config (`backend/games/permissions/config/`) with references to those files, keeping only what the YAML can't express (rationale, edge cases, cross-cutting principles).
3. Split `backend/games/tests/factories.py` into smaller per-resource factory modules, mirroring the existing models/views/serializers organization convention. Review `frontend/specs/support/factories.js` for the same centralization treatment already applied on the backend.

## Benefits
Lower token/context cost for AI-agent-driven workflows (planning, review, implementation) in this repo, reduced risk of docs/config drift, and more maintainable test fixtures on both backend and frontend.
