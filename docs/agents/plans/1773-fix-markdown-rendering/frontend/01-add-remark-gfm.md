# Add the remark-gfm dependency

Add `remark-gfm` (v4, the line compatible with `react-markdown@^10` / unified 11) to the
frontend dependencies through the container, never on the host:

```bash
docker-compose run --rm majora_fe yarn add remark-gfm
```

Commit both the `package.json` change and the lockfile update.

## Files to Change

- `frontend/package.json` — add `remark-gfm` to `dependencies`.
- `frontend/yarn.lock` — lockfile update from `yarn add`.
