# Splitting Configuration Across Files

A single monolithic configuration file can become unwieldy for large applications. Navi lets you split
`resources` and `clients` across multiple files using `include`, and organize them into `namespace`s so
that names declared in different files don't collide with each other.

### `include`

Add a top-level `include:` key to any config file with a list of other config files to pull in:

```yaml
resources:
  home:
    - url: /
      status: 200

include:
  - paginated_resources.yml
  - /full/path/to/clients.yml
```

- Each path in `include` is resolved **relative to the directory of the file declaring it** (so
  `paginated_resources.yml` above is looked up next to the file that includes it), unless the path is
  absolute (e.g. `/full/path/to/clients.yml`), in which case it's used as-is.
- Included files can themselves declare their own `include` list, and are resolved recursively.
- Only the entry file (the one passed via `--config`) is consulted for `workers`, `web`, `log`, and
  `failure` sections — included files only ever contribute `resources` and `clients`.

### `namespace`

Every config file — the entry file or any included file — contributes its `resources` and `clients` to a
`namespace`, declared with a top-level `namespace:` key:

```yaml
namespace: paginated

resources:
  paginated_people:
    - url: /people.json?page={:page}
```

A file that doesn't declare a `namespace` implicitly belongs to the `default` namespace — this is also
true of the entry config file itself, so existing single-file configurations keep working unchanged.

Multiple included files may declare the same `namespace` name; their resources and clients are merged
together into that one namespace. Declaring the same resource or client name twice within the same
namespace (whether from the same file or merged in from different files) is a configuration error and
Navi fails to start.

### Cross-namespace references

A resource's `actions[].resource` / `paginated_actions[].resource`, and a `client` reference, may point
at a resource or client declared in another namespace by adding a `namespace` key next to the reference:

```yaml
namespace: paginated

resources:
  paginated_people:
    client:
      name: non-default
      namespace: clients
    - url: /people.json?page={:page}
      actions:
        - resource: person
          namespace: default
          parameters:
            id: parsedBody.id
```

Resolution rules:

- If a reference omits `namespace`, Navi looks it up in the **same namespace as the resource making the
  reference**, falling back to the `default` namespace if not found there.
- If a reference gives an **explicit** `namespace` and the lookup fails there, Navi does **not** silently
  fall back to `default` — this is treated as a configuration error, since an explicit-but-wrong namespace
  usually indicates a typo.
- A `client` reference can also be given as a bare string (shorthand for "no explicit namespace", same as
  today):
  ```yaml
  resources:
    some_resource:
      client: non-default   # resolved in this resource's own namespace, falling back to default
  ```

All of these references — including unresolvable namespaces or names — are validated eagerly when Navi
loads the configuration, so a bad `include`/`namespace` setup is caught at startup rather than causing a
request-time failure later.

### Full example

`navi_config.yml` (entry file, no `namespace` declared -> `default`):

```yaml
resources:
  people:
    - url: /people.json
      paginated_actions:
        - resource: paginated_people
          namespace: paginated
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
  person:
    - url: /people/:id.json

include:
  - paginated_resources.yml
  - /full/path/to/clients.yml
```

`/full/path/to/clients.yml` (absolute path, own namespace):

```yaml
namespace: clients
clients:
  non-default:
    base_url: https://example.com
    timeout: 5000
```

`paginated_resources.yml` (relative to `navi_config.yml`'s directory):

```yaml
namespace: paginated
resources:
  paginated_people:
    client:
      name: non-default
      namespace: clients
    - url: /people.json?page={:page}
      actions:
        - resource: person
          namespace: default
          parameters:
            id: parsedBody.id
```

**Related sample:** [Split a large config across files and namespaces](samples/split-config.md)

[← Back to How to Use Navi](../how_to_use_navi.md)
