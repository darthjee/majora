# Split a large config across files and namespaces

Organise a growing config into an entry file plus an included file in its own
`namespace`, with references pointing across the two.

## Scenario

Your warm-up config has outgrown a single file. You want the top-level pages and
engine settings (`workers`, `web`, `failure`) in `navi_config.yml`, and the
paginated listing resources in a separate `paginated_resources.yml` under a
`paginated` namespace. The entry file's `people` resource fans out into the
paginated namespace, and a paginated resource chains back to a `person` resource
in `default` — a reference in each direction.

## Configuration

`navi_config.yml` (entry file, no `namespace` declared → `default`):

```yaml
workers:
  quantity: 5

clients:
  default:
    base_url: https://shop.example.com

resources:
  people:
    - url: /people.json
      status: 200
      paginated_actions:
        - resource: paginated_people
          namespace: paginated
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
  person:
    - url: /people/{:id}.json
      status: 200

include:
  - paginated_resources.yml
```

`paginated_resources.yml` (resolved next to `navi_config.yml`):

```yaml
namespace: paginated

resources:
  paginated_people:
    - url: /people.json?page={:page}
      status: 200
      actions:
        - resource: person
          namespace: default
          parameters:
            id: parsedBody.id
```

Run it, passing only the entry file:

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi loads `navi_config.yml`, follows its `include` list to
`paginated_resources.yml` (resolved relative to the entry file's directory), and
merges each file's `resources` and `clients` into its namespace — `default` for
the entry file, `paginated` for the included one. Only the entry file contributes
`workers`, `web`, `log`, and `failure`.

Every cross-reference is validated eagerly at load time: `people`'s
`paginated_actions` targets `resource: paginated_people` with an explicit
`namespace: paginated`, and `paginated_people`'s `actions` targets
`resource: person` with `namespace: default`. An explicit-but-wrong namespace is
a startup error — Navi does not fall back to `default`.

At run time, Navi enqueues `people` → `GET /people.json`. Given
`{ "pagination": { "pages": 2 } }`, it fans out `paginated_people` pages 1 and 2
in the `paginated` namespace: `GET /people.json?page=1` and `?page=2`. Each of
those parses its JSON array and, per item, chains a `person` job in `default` with
`{:id}` substituted — `GET /people/42.json`, etc. The process exits once every
job has settled.

## Notes

- Included files may declare their own `include` list and are resolved
  recursively. A file with no `namespace` belongs to `default`.
- Declaring the same resource or client name twice within one namespace is a
  configuration error and Navi fails to start.
- Full `include` / `namespace` / cross-namespace-reference rules:
  [Splitting Configuration Across Files](../splitting-configuration.md).

---
[← Back to Samples](../samples.md)
