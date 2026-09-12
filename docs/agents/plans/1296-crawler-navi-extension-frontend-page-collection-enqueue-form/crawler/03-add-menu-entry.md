# Add the menu.yml entry

Extend `config/menu.yml` with an entry for the new page, matching the
existing hello entry's `route`/`text` shape (the SPA would also
auto-append `{ path, text }` from the descriptor per
`docs/agents/external/navi/extending-navi.md`, but this project's existing
convention is an explicit `menu.yml` entry, so follow that rather than
relying on auto-append).

```yaml
entries:
  - route: /ext/loot/hello
    text: Loot Hello
  - route: /ext/lootstudios/enqueue
    text: Loot Enqueue
```

## Files to Change

- `crawler/navi-extension/config/menu.yml` — add the `route: /ext/lootstudios/enqueue`
  / `text: Loot Enqueue` entry after the existing hello entry.
