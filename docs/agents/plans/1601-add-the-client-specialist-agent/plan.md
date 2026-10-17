# Plan: Add the client specialist agent

Issue: [1601-add-the-client-specialist-agent.md](../../issues/1601-add-the-client-specialist-agent.md)

## Overview

Define, document and register a new `client` specialist agent that owns the future top-level
`client/` folder (the Node.js library, CLI and `majora-client` npm package from epic #1592).
This is a documentation and agent-configuration change only, so it belongs to the `architect`.
No file under `client/` is created.

## Context

The client track (#1607 to #1611, #1621 to #1623) assigns work to a `client` agent that does not
exist yet. The setup copies the `crawler` agent (`.claude/agents/crawler.md`,
`docs/agents/crawler.md`). The design source is the temporary client spec
(`docs/agents/specs/client.md` and `docs/agents/specs/client/*.md`). The boundaries are:

- `client` owns everything inside `client/`.
- `infra` keeps the wiring outside it: the `majora_client` compose service, the `client*`
  Makefile targets, the `client_tests`, `client_checks` and `client-release` CI jobs, and
  `scripts/bump_version.sh client` (see `docs/agents/specs/client/packaging.md`).
- `frontend/assets/js/client/` (the SPA API clients) is unrelated and stays with `frontend`.

## Steps

- [01 — Create the agent definition](plan/01-create-agent-definition.md)
- [02 — Create the agent doc](plan/02-create-agent-doc.md)
- [03 — Register the agent in rosters and indexes](plan/03-register-agent.md)
- [04 — Update the other agents' boundaries](plan/04-update-other-agents.md)

## CI Checks

- Markdown: `docker-compose run --rm markdownlint yarn lint_md` (CI job: `markdownlint`)

## Notes

- `client/` does not exist yet; the docs must say it is scaffolded by #1607, and that the
  `make client*` targets only work once #1607 lands.
- The spec is temporary. `docs/agents/client.md` should say that #1612 moves the reference into
  permanent docs and repoints the agent before #1613 removes the spec.
- The `README.md` folder tree is left alone until `client/` exists (#1607).
