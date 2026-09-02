# Load config from the same files the engine reads

Point the client at the same YAML/JSON config files a self-hosted Navi engine
reads, instead of rebuilding the payload by hand.

## Scenario

Your repo already keeps engine config in `./config/reports.yml` (namespace
`reports`) and `./config/billing.json` (namespace `billing`), and both use
`${VAR}` references for their base URLs. A running Navi instance at
`https://navi.internal.example.com` should be configured from exactly those
files, with the variables resolved from the deploy script's own environment.

## Code

```js
import { NaviClient } from 'navi-hey-client';

const client = new NaviClient({
  baseUrl: 'https://navi.internal.example.com',
  token: process.env.NAVI_API_TOKEN,
});

const results = await client.configFromFiles([
  './config/reports.yml',
  './config/billing.json',
]);

console.log(results); // one entry per namespace, in first-appearance order
```

## What happens

`configFromFiles` reads and parses every listed file up front, auto-detecting
JSON vs. YAML from each extension (`.yml` → YAML, `.json` → JSON). No `include:`
chain is followed — only the `namespace`, `resources`, and `clients` keys are
extracted from each file. If any file is missing or fails to parse, the call
throws immediately, before any request is sent.

`${VAR}`/`$VAR` references in the file content are resolved **locally**, against
the client process's own environment, before anything is sent. The API side never
resolves env vars in a payload it receives.

Files are grouped by `namespace` (defaulting to `'default'` when the key is
absent) in order of first appearance: `reports` from `reports.yml`, then
`billing` from `billing.json`. One `POST /api/config` request is issued
**sequentially** per namespace group. The call resolves to an array of
per-namespace response bodies, in that same order.

Any request that fails or returns `>= 400` rejects the whole call with an
`ApiRequestFailed` error (`statusCode`, `url`, `body`).

## Notes

- `configFromJson(paths)` / `configFromYaml(paths)` force a parser regardless of
  extension. Each helper accepts a single path or an array.
- Same-namespace collisions across files are resolved last-file-wins.
- Method reference: [Library Usage](../library-usage.md). Env-var resolution
  rules: [Reference](../reference.md).

---
[← Back to Samples](../samples.md)
