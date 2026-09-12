# Document the new env vars in .env.dev.sample

Add a new section to `.env.dev.sample` (after the existing "Cache warmer
(Navi)" section) documenting the four vars `crawler_navi_web` needs — none of
them are currently present in this file, even though three are already
consumed by `crawler/navi_config.yaml`:

```
# Crawler Navi Enqueue UI (crawler_navi_web, issue #1291)
# MAJORA_API_TOKEN / MAJORA_API_BASE_URL authenticate the crawler's outbound
# import calls to Majora (see crawler/navi_config.yaml). LOOTSTUDIOS_SESSION_COOKIE
# is a Lootstudios PHPSESSID obtained from a logged-in browser session.
# NAVI_API_TOKEN backs navi_config.web.yaml's web.api.token.
MAJORA_API_TOKEN=
MAJORA_API_BASE_URL=http://localhost:3000
LOOTSTUDIOS_SESSION_COOKIE=
NAVI_API_TOKEN=dev-navi-api-token
```

- Leave `MAJORA_API_TOKEN` and `LOOTSTUDIOS_SESSION_COOKIE` empty (real
  per-maintainer secrets, like the rest of this sample file's credential-shaped
  entries) and give `NAVI_API_TOKEN` a dev-only placeholder value (same
  convention as `DJANGO_SECRET_KEY` / `STATISTICS_SKIP_SECRET` above it).
- `MAJORA_API_BASE_URL` can default to `http://localhost:3000` (the local
  `majora_proxy` entry point) since it isn't a secret.

## Files to Change

- `.env.dev.sample` — add the new env var section.
