# Reference

### CLI flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config=<path>` | `-c <path>` | `config/navi_config.yml` | Path to the YAML configuration file. |

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
