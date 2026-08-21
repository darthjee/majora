# Architect Plan: Reduce `games/views/__init__.py` load

Main plan: [plan.md](plan.md)

## Shared contracts

None functionally. This step only needs backend's Step 1/2 (see [backend.md](backend.md))
to already be finished, so the doc update describes the actual final import shape rather
than a speculative one.

## Implementation Steps

### Step 1 — Update `docs/agents/views-organization.md`'s import note

`docs/agents/views-organization.md` currently states:

> Every affected import (`urls.py`, package `__init__.py` re-exports) must be updated to
> match the new paths whenever a slice is actually carried out.

Update this note to reflect that, as of this issue, `games/urls/*.py` files import view
functions directly from their owning submodules rather than through the package
`__init__.py` re-export — i.e. there is no longer a package-level re-export layer to keep
in sync; only the `urls.py` import statements themselves need to move when a view file's
location changes. Mirror the equivalent wording already updated for
`docs/agents/serializers-organization.md` in #1216.

## Files to Change

- `docs/agents/views-organization.md` — update the "Every affected import..." note to
  describe direct-from-submodule imports in `urls.py` instead of package `__init__.py`
  re-exports.

## CI Checks

- repo root: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- Small, single-line documentation change — do this after backend's import changes land
  so the wording matches the real end state.
