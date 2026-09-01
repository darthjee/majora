# Option D — Hosted server + `navi-hey-client`

Use this option when Navi is already hosted elsewhere as a long-running server (its own deployment, not spun up per CI run) and you just need a CI step to trigger a warm-up on it via `navi-hey-client`. Unlike Options A/B/C — where the CI step runs Navi headlessly and blocks until the warm-up run finishes — this CI step only *triggers* the warm-up; it does not wait for it to complete.

### Hosting the server

```bash
docker run -p 3000:3000 -e API_TOKEN=$TOKEN -e IDLE_TIMEOUT=0 darthjee/navi-hey:latest
```

Two env vars matter for this flow:

- `API_TOKEN` — must be set to enable the token-secured `/api/*` namespace; empty (the default) disables it, rejecting every request.
- `IDLE_TIMEOUT` — `0` disables auto-shutdown, so the server stays up indefinitely; any other value is seconds of inactivity before shutdown.

See the [`darthjee/navi-hey` Docker Hub page](https://hub.docker.com/r/darthjee/navi-hey) and [Reference](./reference.md) for the rest of the env vars.

### Driving it with `navi-hey-client`

Two invocation patterns, depending on your CI setup:

- Docker-run the client image directly in a CI step:

  ```yaml
  - name: Trigger warm-up
    run: |
      docker run --rm darthjee/navi-hey-client:latest \
        navi-client --base-url https://your-hosted-navi.example.com \
        --token $NAVI_API_TOKEN --action engine-start
  ```

- Use `darthjee/navi-hey-client:latest` as the CI executor image itself, mirroring [Option C](./option-c-circleci-executor.md)'s pattern for `navi-hey` — no `docker run` wrapper needed:

  ```yaml
  jobs:
    trigger-warm-up:
      docker:
        - image: darthjee/navi-hey-client:latest
      steps:
        - run:
            name: Trigger warm-up
            command: navi-client --base-url https://your-hosted-navi.example.com --token $NAVI_API_TOKEN --action engine-start
  ```

The image always ships a current version of the client (`npm install -g navi-hey-client@${CLIENT_VERSION}`, defaulting to `latest`).

### Example client call

Push a config, then start the engine on the hosted instance:

```bash
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config \
  -p '{"namespace":"reports","resources":{"categories":[{"url":"/categories.json","status":200}]}}'

navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a engine-start \
  -p '{"targets":[{"namespace":"reports"}]}'
```

Starting the engine this way returns immediately — the CI step that triggers it does not wait for the warm-up run itself to finish, unlike Options A/B/C.

For anything beyond this quick example — installation, library usage, full CLI/action reference — see [How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md).

[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)
