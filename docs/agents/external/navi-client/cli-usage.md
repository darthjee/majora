# CLI Usage

The `navi-client` command wraps the same three `/api/*` calls as the library, for use from a shell or a CI step without writing any Node.js code.

```bash
navi-client --base-url http://localhost:3000 --token $NAVI_API_TOKEN --action engine-stop
```

| Option | Short | Description |
|--------|-------|--------------|
| `--base-url` | `-b` | Base URL of the running Navi instance. Required. |
| `--token` | `-t` | Bearer token. Required. |
| `--action` | `-a` | One of `config`, `engine-start`, `engine-stop`. Required. |
| `--payload` | `-p` | Optional JSON request body (used by `config`/`engine-start`). Mutually exclusive with `--file`/`--json`/`--yaml`. |
| `--file <path>` | | `config` only. Reads a config file, auto-detecting JSON vs. YAML from its extension (`configFromFiles` semantics). Repeatable. |
| `--json <path>` | | `config` only. Reads a config file, forcing JSON parsing (`configFromJson` semantics). Repeatable. |
| `--yaml <path>` | | `config` only. Reads a config file, forcing YAML parsing (`configFromYaml` semantics). Repeatable. |

```bash
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config \
  -p '{"namespace":"reports","resources":{"categories":[{"url":"/categories.json","status":200}]}}'

navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a engine-start \
  -p '{"targets":[{"namespace":"reports"}]}'
```

`--file`/`--json`/`--yaml` are repeatable and freely combinable with each other, in a single invocation, merged into one ordered path list in **literal command-line order**. They are mutually exclusive with `--payload` — passing both is a CLI validation error.

```bash
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config \
  --file ./config/reports.yml --json ./config/billing.json --yaml ./config/extra.yaml
```

The CLI prints the JSON response body to stdout on success — or, for `config` with `--file`/`--json`/`--yaml`, the array of per-namespace response bodies — or an error message to stderr and exits with status `1` on failure.

[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)
