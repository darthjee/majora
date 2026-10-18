# Add the client Makefile targets

Add a `# ── Client ──` section (same box-drawing style as the existing section headers, placed
after `# ── Frontend ──`) with:

| Target | Command |
|---|---|
| `client` | `docker-compose run --rm majora_client /bin/bash` |
| `client-install` | `docker-compose run --rm majora_client yarn install` |
| `client-tests` | `docker-compose run --rm majora_client yarn test` |
| `client-lint` | `docker-compose run --rm majora_client yarn lint` |
| `client-coverage` | `docker-compose run --rm majora_client yarn coverage` |

Append all five targets to the `.PHONY` line. No `client-release` target.

## Files to Change

- `Makefile` — new section and `.PHONY` entries
