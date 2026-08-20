# Issue: Reduce `games/serializers/__init__.py` load

## Description

`backend/games/serializers/__init__.py` (296 lines) acts as an eager-loading aggregator:
it explicitly imports every serializer class from every subpackage (`characters/`,
`games/`, `treasures/`, `staff/`, etc.) via ~100+ top-level import statements and
re-exports them through a giant `__all__` (~150+ symbols). Any `import games.serializers`
— and there are ~182 call sites across the backend that rely on that package-level import
— loads the entire module tree at once: expensive at runtime, and it dumps unnecessary
context on tools (including AI assistants) that only need one serializer.

This issue was originally broader (also covering `games/views/__init__.py` and
`games/models/__init__.py`); after auditing actual usage, those two were resolved
separately — see the Problem section below.

## Problem

`backend/games/serializers/__init__.py` does three problematic things:

1. **Massive top-level imports**: evaluates and executes the loading of every submodule
   under `serializers/` on import — `characters/` (incl. `npcs/`, `pcs/`), `games/` (incl.
   `common_items/`, `conversations/`, `documents/`, `factions/`, `items/`, `my_games/`,
   `players/`, `polls/`, `possessions/`, `sessions/` with `messages/`/`tasks/`/`treasures/`),
   `treasures/`, and root-level cross-cutting files.
2. **`__all__` with ~150+ symbols**: amplifies the effect for `from games.serializers
   import *` usage.
3. **Minimal docstring**: `"""Serializers package for the games app."""` gives no
   guidance on subpackages, conventions, or what's public API.

### Audit: this re-export is load-bearing, not legacy debt

An audit of actual usage found:

- **182 files** depend on the package-level re-export (`from games.serializers import X`,
  including the relative form `from ...serializers import X` used throughout
  `games/views/**`) — the dominant pattern, not legacy debt.
- **16 files** already import directly from the specific submodule — a small minority.
- `docs/agents/serializers-organization.md` has a **"Stability of public re-exports"**
  section stating this re-export *is* the intentional, documented public API: "this is the
  only import path callers outside `serializers/` should use, and it does not change when
  files move between folders inside `serializers/`." Any change here has to keep that
  contract intact, not break it.
- Of the symbols the original draft assumed were cross-cutting (`BaseAccessSerializer`,
  `PhotoUploadSerializer`, `FileUploadSerializer`), only **`PhotoUploadSerializer`** has
  real cross-app fan-in (consumed by `uploads/upload_initiator.py` — a different Django
  app — plus two `games/views/` call sites). `BaseAccessSerializer` has 0 external
  consumers (it's a base class subclassed internally) and `FileUploadSerializer` has 1.

### Scope: narrowed after auditing the other two files

The original issue also covered `games/views/__init__.py` (463 lines, ~200+ symbols) and
`games/models/__init__.py` (~50 lines, ~35 symbols). Auditing found both have a different
enough profile that they're handled outside this issue:

- **`games/views/__init__.py`** — 0 files import it package-level; only 8
  `games/urls/*.py` files consume it (via `from .. import views` + attribute access).
  Split off into a separate sibling issue: #1217.
- **`games/models/__init__.py`** — confirmed out of scope. Django's app registry
  populates by importing exactly `games/models/__init__.py` at startup
  (`apps.populate()`, before `AppConfig.ready()` runs); every package-based `models/` app
  in this codebase (`accounts`, `conversations`, `miniatures`) follows the same eager
  pattern, and none uses `AppConfig.ready()` or lazy loading for models. This issue leaves
  `games/models/__init__.py` untouched.

## Expected Behavior

Every existing import path continues to work exactly as today —
`from games.serializers import CharacterDetailSerializer` (and the ~182 other call sites,
including the relative-import form used throughout `games/views/**`) keeps working
unchanged, with no migration required at any call site. What changes is *when* the owning
submodule actually gets imported: only on first access of that name, not eagerly when
`games.serializers` itself is imported. `games/serializers/__init__.py` also becomes a
useful navigation aid — a docstring describing the subpackage layout — rather than a flat
dump of imports.

## Solution

**Approach B — PEP 562 lazy loading**, chosen over removing the re-exports outright
(Approach A) because ~182 files and a documented convention depend on the re-export
staying stable, and the migration cost/doc-rewrite that Approach A would require isn't
justified given B achieves the same runtime win with zero call-site changes:

- Replace the ~100+ eager top-level imports in `games/serializers/__init__.py` with a
  module-level `__getattr__` (PEP 562, Python 3.7+): on first access of a name, import the
  owning submodule, fetch the attribute, cache it on the module (so repeated access is a
  plain attribute lookup, not a re-import), and return it. Raise `AttributeError` for
  unknown names, matching normal module attribute-access semantics.
- Keep `__all__` listing every currently-supported symbol, so `dir()`, IDEs, and static
  analysis still see the full public surface — only *when* each submodule loads changes,
  not *what's* importable.
- Rewrite the docstring into a subpackage map (mirroring `permissions/__init__.py`, the
  existing model to follow) — folders, what each holds, and a short "how imports work
  here" note — and explicitly call out `PhotoUploadSerializer` as the one serializer with
  genuine cross-app usage, rather than the three originally assumed.
- Update `docs/agents/serializers-organization.md`'s "Stability of public re-exports"
  section: the guarantee ("this is the only import path callers outside `serializers/`
  should use, and it does not change...") stays true and doesn't need to change in
  substance, but the section currently describes an eager re-export mechanism and should
  be reworded to describe the lazy-loading mechanism instead, so the doc matches the code.
- No changes to `games/views/__init__.py` (spun off to #1217) or
  `games/models/__init__.py` (left untouched — see Problem).
- Atomic commits per Contributing guidelines: the `__init__.py` rewrite, the docstring/doc
  update, and (if needed) any lazy-loading edge-case fix land as separate, reviewable
  commits.
- CI must stay green: `pytest --cov` + `ruff check` on backend after the change.

## Benefits

- Removes ~150+ eager submodule imports (and everything they transitively pull in) that
  currently fire on any `import games.serializers`, without breaking a single one of the
  ~182 existing consumer files.
- Preserves the "stable public API" convention `serializers-organization.md` already
  documents — only the loading mechanism changes underneath it, not the contract callers
  rely on.
- Improves navigability and reduces unnecessary context for tools (including AI
  assistants like Copilot) that touch the package.
- Zero-risk rollout: no call-site migration, no `urls.py`/view changes, no test-import
  churn.
