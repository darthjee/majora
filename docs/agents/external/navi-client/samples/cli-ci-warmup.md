# Kick off a run from a CI step (CLI)

Start a warming run — or push a config — from a CI job with no Node code, using
the `darthjee/navi-hey-client` Docker image.

## Scenario

A Navi instance runs at `https://your-app.example.com` with a `web.api.token`
stored as the CI secret `NAVI_API_TOKEN`. After each deploy a pipeline step
should tell that instance to start warming. You don't want to add Node or the npm
package to the CI image, so you run the published client image directly.

## Command

GitHub Actions:

```yaml
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Start Navi warming run
        run: |
          docker run --rm darthjee/navi-hey-client:latest \
            navi-client --base-url https://your-app.example.com \
            --token ${{ secrets.NAVI_API_TOKEN }} \
            --action engine-start
```

CircleCI:

```yaml
jobs:
  warm-cache:
    docker:
      - image: cimg/base:current
    steps:
      - setup_remote_docker
      - run:
          name: Start Navi warming run
          command: |
            docker run --rm darthjee/navi-hey-client:latest \
              navi-client --base-url https://your-app.example.com \
              --token $NAVI_API_TOKEN \
              --action engine-start
```

To push a config file first, add a step with `--action config` and `--file`
(the checked-out file must be mounted into the container):

```bash
docker run --rm -v "$PWD/config:/config" darthjee/navi-hey-client:latest \
  navi-client --base-url https://your-app.example.com \
  --token $NAVI_API_TOKEN \
  --action config --file /config/reports.yml
```

## What happens

The image's default command is `navi-client` itself (`CMD navi-client`, no
`ENTRYPOINT`), so `navi-client` must be named explicitly in every `docker run`
invocation — the arguments after it are the CLI's own.

`--action engine-start` makes the CLI issue `POST /api/engine/start` against
`https://your-app.example.com`, attaching `Authorization: Bearer $NAVI_API_TOKEN`.
On success it prints the JSON response body to stdout and exits `0`. On any
failure — a transport error or a response with status `>= 400` — it prints an
error message to stderr and exits `1`, which fails the CI step.

The `--action config --file /config/reports.yml` variant uses `configFromFiles`
semantics: the file is read and parsed client-side (`${VAR}`/`$VAR` resolved from
the container's environment), then one `POST /api/config` is issued per
namespace, and the array of per-namespace response bodies is printed to stdout.

## Notes

- `--file` / `--json` / `--yaml` are repeatable and combinable; they are mutually
  exclusive with `--payload`.
- Short flags: `-b` / `-t` / `-a` / `-p`.
- Full option table: [CLI Usage](../cli-usage.md). Image details and `npx`
  alternative: [Installation](../installation.md).

---
[← Back to Samples](../samples.md)
