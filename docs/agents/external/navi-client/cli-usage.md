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
| `--payload` | `-p` | Optional JSON request body (used by `config`/`engine-start`). |

```bash
navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config \
  -p '{"namespace":"reports","resources":{"categories":[{"url":"/categories.json","status":200}]}}'

navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a engine-start \
  -p '{"targets":[{"namespace":"reports"}]}'
```

The CLI prints the JSON response body to stdout on success, or an error message to stderr and exits with status `1` on failure.

[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)
