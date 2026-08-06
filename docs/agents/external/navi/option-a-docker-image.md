# Option A — Docker image (`darthjee/navi-hey`)

> The `darthjee/navi-hey` image is available on [Docker Hub](https://hub.docker.com/r/darthjee/navi-hey).
> It is built from `dockerfiles/production_navi_hey/Dockerfile` and installs `navi-hey` globally via npm.
> The image now ships a working, minimal configuration out of the box (`web`, env-var overridable via `NAVI_CONFIG` and friends — see [Reference](reference.md)), so `docker run -p 3000:3000 darthjee/navi-hey:latest` brings up a browsable Navi instance with zero mounts. CI usage generally still needs a custom config (its own `resources:`/`clients:`), so the examples below keep mounting one.

Use this option when your CI environment supports Docker.
Mount your configuration file into the container and run Navi headlessly.

### GitHub Actions

```yaml
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Warm cache with Navi
        run: |
          docker run --rm \
            -v ${{ github.workspace }}/navi_config.yml:/home/node/app/config/navi_config.yml \
            darthjee/navi-hey:latest \
            node navi.js --config config/navi_config.yml
```

### CircleCI

```yaml
jobs:
  warm-cache:
    docker:
      - image: cimg/base:current
    steps:
      - checkout
      - setup_remote_docker
      - run:
          name: Warm cache with Navi
          command: |
            docker run --rm \
              -v $(pwd)/navi_config.yml:/home/node/app/config/navi_config.yml \
              darthjee/navi-hey:latest \
              node navi.js --config config/navi_config.yml
```

The container exits with a non-zero code if any request ultimately fails after all retries, which causes the CI step to fail.

[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)
