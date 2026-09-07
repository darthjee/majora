# Reference

### CLI flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config=<path>` | `-c <path>` | `config/navi_config.yml` | Path to the YAML configuration file. |

### Production Docker image configuration

`dockerfiles/production_navi_hey/Dockerfile` packs a minimal, production-ready config (`config/web.yml`) into the `darthjee/navi-hey` image, so `docker run -p 3000:3000 darthjee/navi-hey:latest` works with zero volume mounts (see [Option A — Docker image](option-a-docker-image.md)). The image ships no `resources:`/`clients:` — add those afterwards through the Navi client/API. Every setting the packed config exposes is a Dockerfile `ENV`, overridable at `docker run`/compose time without editing or rebuilding the image:

| Env var | Default | Config field |
|---------|---------|--------------|
| `NAVI_CONFIG` | `./config/web.yml` | Full relative (or absolute) path to the config file `navi-hey -c` loads. Selects which packed config runs — future images may ship additional configs (e.g. `config/web_and_workers.yml`) selectable the same way. |
| `PORT` | `3000` | `web.port` |
| `LOGS_PAGE_SIZE` | `20` | `web.logs_page_size` |
| `ENABLE_SHUTDOWN` | `false` | `web.enable_shutdown` |
| `AUTOSTART` | `true` | `web.autostart` |
| `IDLE_TIMEOUT` | `0` (disabled) | `web.idle_timeout` — `0` disables auto-shutdown, so the web UI stays up indefinitely. |
| `API_TOKEN` | empty (disabled) | `web.api.token` — empty disables the token-secured `/api/*` namespace (every request rejected). |
| `WORKERS` | `1` | `workers.quantity` |
| `RETRY_COOLDOWN` | `2000` | `workers.retry_cooldown` |
| `WORKERS_SLEEP` | `500` | `workers.sleep` |
| `MAX_RETRIES` | `3` | `workers.max-retries` |

For example, to change the exposed port:

```bash
docker run -p 8080:8080 -e PORT=8080 darthjee/navi-hey:latest
```

### Environment variables in client configuration

Both `base_url` and header values support environment variable substitution at load time using `$VAR` or `${VAR}` syntax:

```yaml
clients:
  default:
    base_url: ${DOMAIN_BASE_URL}
  auth_api:
    base_url: $API_BASE_URL
    headers:
      Authorization: Bearer $API_TOKEN
      X-Tenant: ${TENANT_ID}
```

If a referenced variable is not set, it is replaced with an empty string and a warning is logged. Pass the variables to the process in the usual way for your environment (e.g. `env` in Docker, `environment` in GitHub Actions / CircleCI).

### Headless vs. web UI mode

Navi can optionally serve a real-time monitoring web UI. To enable it, add a `web:` section to your configuration:

```yaml
web:
  port: 3000   # omit this section entirely to run headlessly
```

When enabled, the web UI is accessible at `http://localhost:<port>` and includes the following screens:

| Screen | URL | Description |
|--------|-----|-------------|
| Dashboard | `/#/` | Real-time job queue stats (counts per status). |
| Jobs list | `/#/jobs` | Table of all jobs across every status, with links to individual job pages. |
| Job detail | `/#/job/:id` | Full details for a specific job (ID, status, attempt count). |
| Memory status | `/#/memory/status` | Real-time RSS usage against the configured maximum, plus a historical usage graph. |

The Memory status screen is powered by a `web.memory` section, also optional:

```yaml
web:
  port: 3000
  memory:
    maximum: 2147483648   # optional, bytes; falls back to cgroup v2 → cgroup v1 → OS total memory when unset
    thresholds:            # optional; low/medium/high/over percentage bands
      low: 25.0
      medium: 50.0
      high: 75.0
      over: 100.0
    data_store:
      size: 100             # optional; max readings retained in the in-memory ring buffer
      interval: 5            # optional; seconds between RSS samples
      page_size: 20           # optional; max entries returned per page from the history endpoint
```

`data_store.size` and `data_store.interval` together determine how far back the usage graph reaches — roughly `size × interval` seconds, ~8 minutes at the defaults shown above. Like the job/log/emission buffers, this history is in-memory only and lost on restart. See [`docs/agents/web-server.md`](../../agents/web-server.md) for the full HTTP API reference, including config validation rules and the exact `/memory/history.json` response shape.

For CI pipelines, omit the `web:` key so that Navi exits automatically once all jobs are processed.

[← Back to How to Use Navi](../how_to_use_navi.md)
