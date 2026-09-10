# Configuring the Internal Navigation Menu

Navi's monitoring web UI shows a navigation dropdown for jumping between its
screens. Out of the box it lists two entries — **Logs** and **Memory** — but the
contents are fully operator-controlled through a small YAML file. You can add your
own entries, drop or hide the shipped ones, reorder them, and relabel them,
without forking the image or rebuilding the SPA.

This page is the operator-facing reference for that file. It is separate from the
main warm-up configuration (`navi_config.yml`) — the menu file is its own
document with its own schema.

### Where the file lives

| Setting | Value |
|---------|-------|
| CLI flag | `-m <path>` / `--menu=<path>` (mirrors `-c` / `--config`; supplying the flag without a value is an error). |
| Environment variable | `NAVI_MENU` — the production Docker image sets `NAVI_MENU=./config/menu.yml` and invokes `navi-hey -c $NAVI_CONFIG -m $NAVI_MENU`. |
| Default path | `config/menu.yml`, resolved relative to the working directory. |

The stock `darthjee/navi-hey` image ships a commented-out template at
`/home/node/app/config/menu.yml`. Because Navi falls back to the built-in
Logs + Memory menu whenever the file has no active entries, an untouched image
still shows a working menu. To take control, mount your own file over that path:

```bash
docker run -p 3000:3000 \
  -v "$(pwd)/menu.yml:/home/node/app/config/menu.yml" \
  darthjee/navi-hey:latest
```

Or with Compose:

```yaml
services:
  navi:
    image: darthjee/navi-hey:latest
    volumes:
      - ./menu.yml:/home/node/app/config/menu.yml:ro
    ports:
      - "3000:3000"
```

An absent, empty, or whitespace-only file — or a document with no `entries` key —
yields the two defaults. A file that fails to parse (invalid YAML, or an
`entries` value that is present but is not a list) is fail-fast: Navi aborts at
startup rather than booting with a broken menu. Individual entries that are
malformed (missing `route`, wrong types) are dropped at load time with a warning
and never reach the UI.

### Entry shape

`entries` is a list of objects:

| Key | Required | Description |
|-----|----------|-------------|
| `route` | yes | Either an internal path starting with `/` (e.g. `/logs`, rendered as `#/logs` in the SPA) or an absolute `http(s)://` URL. Must be non-empty and contain no whitespace. `route` is the entry's identity — see [Duplicate routes](#duplicate-routes). |
| `text` | no | The label shown in the menu. Defaults to `route` when omitted. |
| `hidden` | no | `true` removes a matching shipped default — see [Hiding a default](#hiding-a-default). Only meaningful against a default `route`. |

```yaml
entries:
  - route: /logs
    text: Logs
  - route: https://status.example.com
    text: Status page
```

### Adding entries

Operator `entries` are **appended after** the shipped defaults: Logs and Memory
first, in that order, then your entries in file order.

```yaml
entries:
  - route: /dashboard
    text: Dashboard
  - route: /reports
    text: Reports
```

Resolved menu: **Logs, Memory, Dashboard, Reports**.

An explicit `entries: []` (with `defaults` absent or `true`) is not a wipe — it
just means "no custom entries", so the menu still shows Logs + Memory.

### `defaults: false` — drop the shipped entries

`defaults` is a top-level boolean, a sibling of `entries`. Setting it to `false`
removes **both** shipped defaults; only your entries render.

```yaml
defaults: false
entries:
  - route: /dashboard
    text: Dashboard
```

Resolved menu: **Dashboard** only.

`defaults: false` with no `entries` (or `entries: []`) is the **only** way to get
an empty menu. A non-boolean `defaults` value is ignored with a warning and
treated as `true`.

### Hiding a default

To drop just one shipped default while keeping the other, add an entry with its
`route` and `hidden: true`:

```yaml
entries:
  - route: /memory/status
    hidden: true
  - route: /dashboard
    text: Dashboard
```

Resolved menu: **Logs, Dashboard**. The `hidden` entry itself never renders — it
only suppresses the matching default (`/logs` or `/memory/status`).

`hidden: true` on any other `route` is a no-op: the entry is dropped with a
warning and nothing else changes.

### Repositioning and relabelling a default

Re-list a default's `route` as a normal (non-hidden) entry to pull it out of the
leading defaults block and render it at that entry's file position instead — it
is **not** duplicated.

```yaml
entries:
  - route: /dashboard
    text: Dashboard
  - route: /logs
```

Resolved menu: **Memory, Dashboard, Logs**. `/logs` moved to where it was listed;
`/memory/status` stayed in the defaults block.

Omitting `text` on the re-listed default keeps its original label (`Logs` /
`Memory`) — *not* the route. Supplying `text` overrides it:

```yaml
entries:
  - route: /logs
    text: Activity log
```

Resolved menu: **Memory, Activity log**.

### Duplicate routes

De-duplication runs over the final merged list, in render order: the **first**
occurrence of a `route` wins, and every later entry with the same `route` is
dropped with a warning such as:

```
[menu] skipping duplicate entry at index 5: route "/dashboard" already defined at index 2
```

Only `route` is an identity. Two entries may share the same `text` on different
routes — that is allowed and not warned about.

### Environment variable interpolation

`${VAR}` and `$VAR` are resolved at load time, using the same resolver as the
main config. An unset variable becomes an empty string and logs a warning.

```yaml
entries:
  - route: ${GRAFANA_URL}
    text: Metrics
```

### What the menu does not do

- **Long menus scroll.** There is no cap on the number of entries; the dropdown
  panel gains a scrollbar when the list is tall.
- No grouping, section headers, nested submenus, or per-entry icons.
- No explicit `order` key — ordering is purely the merge rules above (defaults
  first, then file order, with re-listed defaults moving to their listed
  position).

### Pointing at an extension route

A menu entry can target a backend route or frontend page you added through the
[extensions mechanism](extending-navi.md). Register the route there first, then
add a `menu.yml` entry for it — the two files are independent schemas, so a menu
entry pointing at a route no extension registers just renders as a link that
404s when clicked.

[← Back to How to Use Navi](../how_to_use_navi.md)
