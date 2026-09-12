# Add the docker-compose service

Add a new `crawler_navi_web` service to `docker-compose.yml`, right after the
existing `majora_navi` service, following that service's shape:

```yaml
  crawler_navi_web:
    build:
      context: .
      dockerfile: dockerfiles/navi_hey_loot_enqueue/Dockerfile
    environment:
      - MAJORA_API_TOKEN=$MAJORA_API_TOKEN
      - MAJORA_API_BASE_URL=$MAJORA_API_BASE_URL
      - LOOTSTUDIOS_SESSION_COOKIE=$LOOTSTUDIOS_SESSION_COOKIE
      - NAVI_API_TOKEN=$NAVI_API_TOKEN
    ports:
      - 127.0.0.1:3110:3000
```

- Bind to `127.0.0.1`, not `0.0.0.0` like the other services — the extension
  route is unauthenticated by design (parent issue #1291's "Cross-cutting
  concerns"), so this must not be reachable off the host.
- Port `3000` is the container side (`navi_config.web.yaml`'s `web.port: 3000`);
  `3110` is the next free host port after `majora_navi`'s `3100` — adjust if it
  collides with something else by the time this lands.
- No `volumes:` — this service runs the baked image as-is (no bind-mount), and
  no `depends_on:` — it does not depend on any other compose service.
- Env vars are passed through from the host shell / root `.env`, same pattern as
  `majora_navi`'s `environment:` block — see Step 3 for `.env.dev.sample`.

## Files to Change

- `docker-compose.yml` — add the `crawler_navi_web` service.
