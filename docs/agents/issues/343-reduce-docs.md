# Reduce docs

## Context

Documentation under `docs/agents` has grown large, and much of its content overlaps with information that is easier and more reliably obtained by reading the code itself. Large docs cost tokens for every agent invocation that reads them, and increase the chance of the docs drifting out of sync with the actual code.

Most files under `docs/agents` (e.g. `access-control.md` at 613 lines, `frontend.md` at 279 lines, `architecture.md`, `product.md`, `contributing.md`, etc.) mix genuinely load-bearing information (policies, conventions, decisions not visible in code) with material that just restates what the code already shows (field lists, endpoint signatures, step-by-step descriptions of logic).

Some of these files are also referenced as the *authoritative source of truth* for specialist agents (`security.md` reads `security-guidelines.md`, `data-access.md` reads `access-control.md`, `product-owner.md` reads `product.md`) — those agents rely on the curated version rather than re-deriving the same policy from code each time, so these files need a more conservative pass.

`HOW_TO_USE_DARTHJEE-TENT.md` and `HOW_TO_USE_NAVI.md` are out of scope: they are copied from and maintained in other source repos, so trimming them here would just cause drift from their real source.

## What needs to be done

Edit each in-scope file under `docs/agents` (everything except `HOW_TO_USE_DARTHJEE-TENT.md` and `HOW_TO_USE_NAVI.md`) directly, trimming or removing content that duplicates what's derivable from the code, keeping only information that isn't otherwise discoverable (rationale, conventions, cross-cutting rules, policies).

For `access-control.md`, `security-guidelines.md`, and `product.md` — the files agents treat as their authoritative reference — be conservative: only cut clear duplication/verbosity, and never remove policy, rules, or decisions even if they happen to also be visible in code.

## Acceptance criteria

- [ ] Each in-scope file under `docs/agents` (all except `HOW_TO_USE_DARTHJEE-TENT.md` and `HOW_TO_USE_NAVI.md`) has duplicated/derivable content trimmed or removed
- [ ] `access-control.md`, `security-guidelines.md`, and `product.md` retain all policy, rules, and decisions; only clear duplication/verbosity is cut
- [ ] Remaining content focuses on rationale, conventions, cross-cutting rules, and policies not otherwise discoverable from code
