# Infra Plan: Add skip session headers

Main plan: [plan.md](plan.md)

## Shared contracts

- Must expose `STATISTICS_SKIP_SECRET` to both the backend and Navi (`majora_navi`) services, with the identical value in both places, so the backend's comparison and Navi's sent header always agree.

## Implementation Steps

### Step 1 — Add the dev sample value

In `.env.dev.sample`, add `STATISTICS_SKIP_SECRET=<dev-placeholder-value>` next to `MAJORA_PRODUCTION_URL` (currently line 36). The `base` (backend) service already has `env_file: .env` (docker-compose.yml:26), so this reaches Django automatically without further wiring — only Navi needs an explicit passthrough (Step 2).

### Step 2 — Pass the var through to Navi's service

In `docker-compose.yml`, `majora_navi` has no `env_file` and only receives vars explicitly listed in its `environment:` block (currently `MAJORA_PRODUCTION_URL` and `NAVI_PORT`, lines 124-125). Add it there too:

```yaml
  majora_navi:
    image: darthjee/navi-hey:latest
    volumes:
      - ./navi/:/home/node/app
    command: navi-hey --config navi_config.yaml
    environment:
      - MAJORA_PRODUCTION_URL=$MAJORA_PRODUCTION_URL
      - STATISTICS_SKIP_SECRET=$STATISTICS_SKIP_SECRET
      - NAVI_PORT=3000
    ports:
      - 0.0.0.0:3100:3000
```

## Files to Change

- `.env.dev.sample` — add `STATISTICS_SKIP_SECRET=<dev-placeholder-value>`.
- `docker-compose.yml` — add `STATISTICS_SKIP_SECRET=$STATISTICS_SKIP_SECRET` to `majora_navi`'s `environment:` block.

## Notes

- Production provisioning (setting the real secret value in the actual prod environment) goes through whatever channel already provisions `MAJORA_PRODUCTION_URL` there — out of scope for this plan to define, since that channel isn't part of this repo's checked-in config.
- This change alone is inert: until `STATISTICS_SKIP_SECRET` is set to a real value in a given environment's `.env`, `Settings.skip_secret()` (see [backend.md](backend.md)) returns `''` and the backend never skips recording, regardless of what Navi sends.
