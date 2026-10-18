# Add the majora_client service and ignore entries

Add the `majora_client` service to `docker-compose.yml` exactly as in the shared contract (copy of
the packaging spec). Place it after the `markdownlint` service. It uses `image:` directly (no
Dockerfile, nothing under `dockerfiles/`), and has no `depends_on`, so `make client-tests` never
boots MySQL, the app or the proxy.

Add to `.gitignore`, in the `# Node` block next to `docker_volumes/markdownlint_node_modules/`:

- `docker_volumes/client_node_modules/`
- `client/node_modules/` (the empty mount point Docker creates on the host)
- `client/coverage/`

Verify with `docker-compose config -q`.

## Files to Change

- `docker-compose.yml` — new `majora_client` service
- `.gitignore` — the three entries above
