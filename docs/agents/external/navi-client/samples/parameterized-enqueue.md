# Run a resource with per-request parameter values

Start a warming run against an already-defined, parameterized resource by
supplying its `{:token}` values at call time, instead of pushing a one-off
resource definition via `config()`.

## Scenario

A Navi instance is already running at `https://navi.internal.example.com`
with a `crawler` namespace configured, including a `collection` resource
whose request `url` contains `{:slug}` and `{:region}` placeholders (e.g.
`https://example.com/{:region}/collections/{:slug}.json`). From a script you
want to crawl one specific collection — `tidal-aberrations`, in the `eu`
region — without registering a new resource for it.

## Code

```js
import { NaviClient } from 'navi-hey-client';

const client = new NaviClient({
  baseUrl: 'https://navi.internal.example.com',
  token: process.env.NAVI_API_TOKEN,
});

await client.engineStart({
  targets: [
    {
      namespace: 'crawler',
      parameters: { region: 'eu' },
      resources: [
        { name: 'collection', parameters: { slug: 'tidal-aberrations' } },
      ],
    },
  ],
});
```

## What happens

`client.engineStart(payload)` issues `POST https://navi.internal.example.com/api/engine/start`
with the `Authorization: Bearer <NAVI_API_TOKEN>` header, forwarding the
payload exactly as given — no client-side validation or transformation of
`parameters` happens.

The `crawler` target carries a target-level `parameters` default,
`{ region: 'eu' }`, applied to every resource entry in that target. The
`collection` entry is a `{ name, parameters }` object rather than a bare
string, so its own `parameters` (`{ slug: 'tidal-aberrations' }`) is
shallow-merged **over** that default — per-resource values win on key
conflict — giving the engine `{ region: 'eu', slug: 'tidal-aberrations' }` to
substitute into `collection`'s `{:token}` placeholders for this one enqueue.

This only supplies values for an already-registered resource: `collection`
must already exist in the `crawler` namespace (defined at boot or via a
prior `config()` call). If any `{:token}` in the resource is still
unresolved after the merge, the whole resource is skipped
(`skippedResources` reason `needs_params`) rather than partially enqueued —
the same all-or-nothing behavior as an unparameterized resource missing a
required value.

## Notes

- `resources[]` entries can be freely mixed — bare strings alongside
  `{ name, parameters }` objects — in the same call; see
  [Library Usage](../library-usage.md) and [CLI Usage](../cli-usage.md) for
  the equivalent `-a engine-start` invocation.
- Full request/response shape, including the `enqueued`/`skippedResources`
  aggregation and parameter value-type rules: [Reference](../reference.md).

---
[← Back to Samples](../samples.md)
