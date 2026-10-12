# Proxy Plan: Remove the game content copy specs

Main plan: [plan.md](plan.md)

## Shared contracts

Point at `docs/agents/game-content-copy.md#cache`, created by the architect (see
[plan.md](plan.md#shared-contracts)).

## Implementation Steps

### Step 1 — Repoint the `staff_copies` rule comments

Comment-only change. In both `proxy/prod_configuration/rules/staff_copies.php` and
`proxy/dev_configuration/rules/staff_copies.php` (line 8), replace
`docs/agents/specs/game-content-copy/permissions.md#cache` with
`docs/agents/game-content-copy.md#cache`. Keep the rest of the docblock as is.

## Files to Change

- `proxy/prod_configuration/rules/staff_copies.php`: docblock link.
- `proxy/dev_configuration/rules/staff_copies.php`: docblock link.

## CI Checks

- `proxy`: phpcs (`proxy/phpcs.xml`) per `AGENTS.md`.

## Notes

- `grep -rn "specs/game-content-copy" proxy` must return nothing afterwards.
