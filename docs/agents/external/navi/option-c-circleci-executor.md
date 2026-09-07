# Option C — CircleCI executor image

Use this option when running on CircleCI. Instead of using `docker run` (which requires `setup_remote_docker`) or relying on a Node.js image with `npx`, you can declare `darthjee/navi-hey:latest` directly as the job's executor image. Since `navi-hey` is installed globally in that image, you can call it as a command without any additional setup.

This is the recommended approach for CircleCI — no Docker-in-Docker, no npm install step.

```yaml
jobs:
  warm-cache:
    docker:
      - image: darthjee/navi-hey:latest
    steps:
      - checkout
      - run:
          name: Warm cache with Navi
          command: navi-hey --config .circleci/navi_config.yaml
```

If your Navi config references environment variables in headers (e.g. `$API_TOKEN`), pass them via the CircleCI `environment` key or project environment variables:

```yaml
jobs:
  warm-cache:
    docker:
      - image: darthjee/navi-hey:latest
    steps:
      - checkout
      - run:
          name: Warm cache with Navi
          command: navi-hey --config .circleci/navi_config.yaml
          environment:
            API_TOKEN: << pipeline.parameters.api_token >>
```

[← Back to How to Use Navi](../how_to_use_navi.md)
