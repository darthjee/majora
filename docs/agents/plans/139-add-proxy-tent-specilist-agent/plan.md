# Plan: Add Proxy Tent Specialist Agent

Issue: [139-add-proxy-tent-specilist-agent.md](../issues/139-add-proxy-tent-specilist-agent.md)

## Overview

Create a new `proxy` specialist agent that owns all files under `proxy/` (dev/prod PHP
configurations and custom middleware). Update the `infra` agent to delegate proxy-related
tasks to the new agent, and update all documentation that describes agent scopes.

## Context

The `proxy/` directory already exists and contains:
- `proxy/dev_configuration/` — PHP routing rules loaded by the Tent image in development
- `proxy/prod_configuration/` — PHP routing rules for production
- `proxy/custom/extend/` — custom PHP middleware classes
- `proxy/custom/tests/` — PHPUnit tests for that middleware

The `docker-compose.yml` already has a `proxy_tests` service (`darthjee/tent:0.7.8`) that
mounts `./proxy/custom` and runs `vendor/bin/phpunit custom/tests`. PHP is only available
inside the Tent image — never on the host or in other CI containers.

Currently the `infra` agent lists "Tent proxy configuration" in its scope and mentions
`docker_volumes/proxy_configuration/` and `prod_proxy_config/` as its directories. Those
references were from an older layout; the actual PHP source now lives in `proxy/`.

## Implementation Steps

### Step 1 — Create `.claude/agents/proxy.md`

Write the new proxy specialist agent definition. Its scope is all files under `proxy/`:
dev and prod PHP configuration, custom middleware, and their tests. The system prompt must
document the Tent PHP framework conventions, how to run PHP linting and tests via
`docker-compose run proxy_tests`, and the routing rule structure (configure.php loading
order: frontend → backend → admin → redirects).

### Step 2 — Update `.claude/agents/infra.md`

Remove proxy-specific scope items and add a delegation note pointing to the `proxy` agent
for anything under `proxy/`. Specifically:
- Remove `docker_volumes/proxy_configuration/` from the scope list
- Remove the "Tent proxy" section content that describes PHP routing rules
- Add a line in the scope or a "Delegation" note: proxy-related tasks go to `proxy`

### Step 3 — Update `.claude/agents/architect.md`

Add a `proxy` row to the specialist agents table:
```
| `proxy` | `proxy/` — PHP Tent proxy configuration, custom middleware, and tests |
```

### Step 4 — Update `AGENTS.md`

`AGENTS.md` (the user-facing project instructions) does not currently list specialist
agents by name — it just describes the stack. No change needed unless it explicitly
enumerates agents; confirm by reading the file during implementation.

### Step 5 — Update `docs/agents/folder-structure.md`

Add a row for `proxy/` in the Project Root table:
```
| `proxy/` | PHP Tent proxy configuration (dev and prod routing rules) and custom middleware with tests. |
```

### Step 6 — Update `docs/agents/security-guidelines.md` (if proxy scope is referenced)

Check whether the security guidelines mention proxy-specific rules; if so, update any
reference from `infra` to `proxy` for PHP middleware and routing rule changes.

## Files to Change

- `.claude/agents/proxy.md` — create new proxy specialist agent definition
- `.claude/agents/infra.md` — remove proxy scope, add delegation note
- `.claude/agents/architect.md` — add `proxy` row to specialist table
- `docs/agents/folder-structure.md` — add `proxy/` entry to Project Root table
- `docs/agents/security-guidelines.md` — conditionally update agent references for proxy rules

## CI Checks

- `proxy/`: `docker-compose run proxy_tests` (CI job: `upload_proxy_files` uses `darthjee/tent:0.7.8`)

## Notes

- PHP is only available inside the `darthjee/tent` image. The proxy agent must emphasize
  that all PHP linting and testing must go through `docker-compose run proxy_tests` (or an
  equivalent `docker run` invocation), never a bare `php` call on the host.
- The `docker_volumes/proxy_configuration/` directory (listed in the old infra agent) may
  be a legacy path. Confirm actual mount paths during implementation; the current
  `docker-compose.yml` mounts `./proxy/dev_configuration` for dev.
- Keep the `infra` agent responsible for `docker-compose.yml` itself (including the
  `majora_proxy` and `proxy_tests` service definitions) — only the PHP source files move
  to `proxy` agent ownership.
