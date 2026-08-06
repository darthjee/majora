# Installation

`navi-hey-client` is published on npm and works against any running Navi instance that has a `web.api.token` configured (see [Reference](./reference.md)).

```bash
npm install navi-hey-client
```

Installing it makes both the library (`NaviClient`) and the `navi-client` CLI command available — no separate install step is needed for the CLI.

To use only the CLI without adding the package as a project dependency, run it directly with `npx`:

```bash
npx navi-client --base-url http://localhost:3000 --token $NAVI_API_TOKEN --action engine-stop
```

## Docker Image

> The `darthjee/navi-hey-client` image is available on [Docker Hub](https://hub.docker.com/r/darthjee/navi-hey-client).

The image's default command is `navi-client` itself (`CMD navi-client`, no `ENTRYPOINT`), so it must be named explicitly in every invocation:

```bash
docker run --rm darthjee/navi-hey-client:latest \
  navi-client --base-url http://localhost:3000 --token $NAVI_API_TOKEN --action engine-stop
```

### GitHub Actions

```yaml
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Warm cache with Navi client
        run: |
          docker run --rm darthjee/navi-hey-client:latest \
            navi-client --base-url https://your-app.example.com \
            --token ${{ secrets.NAVI_API_TOKEN }} \
            --action engine-start
```

### CircleCI

Declare `darthjee/navi-hey-client:latest` directly as the job's executor image to get direct filesystem access to checked-out files with no Docker-in-Docker:

```yaml
jobs:
  warm-cache:
    docker:
      - image: darthjee/navi-hey-client:latest
    steps:
      - checkout
      - run:
          name: Warm cache with Navi client
          command: navi-client --base-url https://your-app.example.com --token $NAVI_API_TOKEN --action engine-start
```

[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)
