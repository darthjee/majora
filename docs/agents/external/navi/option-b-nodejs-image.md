# Option B — Node.js image with `navi-hey` installed

Use this option when your CI environment already provides a Node.js runtime and you prefer not to use Docker-in-Docker.

### Install and run with npx (no prior install needed)

```bash
npx navi-hey --config path/to/navi_config.yml
```

### Install globally and run

```bash
# npm
npm install -g navi-hey

# yarn
yarn global add navi-hey

navi-hey --config path/to/navi_config.yml
```

### GitHub Actions example

```yaml
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Warm cache with Navi
        run: npx navi-hey --config navi_config.yml
```

### CircleCI example

```yaml
jobs:
  warm-cache:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Warm cache with Navi
          command: npx navi-hey --config navi_config.yml
```

[← Back to How to Use Navi](../how_to_use_navi.md)
