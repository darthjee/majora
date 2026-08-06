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

For CI pipelines, omit the `web:` key so that Navi exits automatically once all jobs are processed.

[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)
