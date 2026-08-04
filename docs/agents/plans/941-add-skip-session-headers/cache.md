# Cache Plan: Add skip session headers

Main plan: [plan.md](plan.md)

## Shared contracts

- Must send header `X-Statistics-Skip-Secret` with value `$STATISTICS_SKIP_SECRET` (env-var substitution, not a hardcoded value) on requests made by the `default` client.
- Relies on infra to make `STATISTICS_SKIP_SECRET` available in Navi's process environment (see [infra.md](infra.md)) — this config change alone does nothing until that env var is actually set.

## Implementation Steps

### Step 1 — Add the skip header to Navi's client config

In `navi/navi_config.yaml`, add a `headers:` block under `clients.default`, alongside the existing `base_url`/`timeout`:

```yaml
clients:
  default:
    base_url: $MAJORA_PRODUCTION_URL
    timeout: 20000
    headers:
      X-Statistics-Skip-Secret: $STATISTICS_SKIP_SECRET
```

Use Navi's existing `$VAR` env-var substitution support (same mechanism `base_url` already relies on), documented at `docs/agents/external/navi/reference.md:11-24`.

## Files to Change

- `navi/navi_config.yaml` — add `headers:` block under `clients.default`.

## Notes

- Scope is intentionally limited to `clients.default` — no other Navi client/resource config needs this header for this issue (see the issue's "Scope" section: Navi-only for now, though the header/env-var naming stays generic for possible future reuse).
- No CI job validates `navi_config.yaml` syntax before deploy (the only CI job that touches it, `warm-up-cache`, is the deploy-time cache-warming run itself) — double-check the YAML is well-formed and indentation-correct by hand, since a syntax error here would only surface at deploy time.
