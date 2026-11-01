# Investigator Plan: Dev stack: don't publish host ports when running tests/validation

Main plan: [plan.md](plan.md)

## Shared contracts

- `make stack-up` (provided by infra) brings up `majora_proxy`, `majora_app` and `majora_fe` (and `majora_mysql` through links) on `majora_default` with **no** host ports. Investigation runners rely on it.
- `make dev-up` still works but publishes host ports (`127.0.0.1`); runners don't need it.

## Implementation Steps

### Step 1 — Point investigation docs at the no-ports stack

- `investigations/statistics-bug/README.md`: in the prerequisites (local stack up), say to start it with `make stack-up`, which publishes no host ports, so a clash with another project's port, e.g. 3306, can't block validation (#1724). Mention that `make dev-up` also works but binds host ports.
- `docs/agents/investigator.md` and `.claude/agents/investigator.md`: wherever emulation against the local stack is described, say to bring the stack up with `make stack-up`. Runners reach services by name on `majora_default` and never need host ports. Keep the existing statement that investigations have no Makefile targets of their own; `stack-up` is a root-stack target.

## Files to Change
- `investigations/statistics-bug/README.md` — prerequisites use `make stack-up`.
- `docs/agents/investigator.md` — local-stack guidance uses `make stack-up`.
- `.claude/agents/investigator.md` — same guidance.

## CI Checks
- Markdown: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes
- Depends on infra's `stack-up` target existing. Docs only; no runner code changes.
