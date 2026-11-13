# Docs

- `docs/agents/access-control/game-common-item.md`: extend the `?name=` filter paragraph to
  document `name`, `category`, `min_price`, `max_price` on both indexes, applied after the hidden
  filter and before pagination, combined with AND; unknown category → empty list; price params
  follow Python `int()` parsing, identical to treasures.
- `docs/agents/specs/common-items-filters/backend.md`: replace the "*Planned by #1770.* Nothing
  on this page exists yet." banner with "*Implemented by #1770.*" and adjust wording that
  describes the work as future, so the page describes the implemented state.

Follow `docs/agents/documentation.md` (blank lines around headings and lists).

## Files to Change

- `docs/agents/access-control/game-common-item.md` — document the four filters
- `docs/agents/specs/common-items-filters/backend.md` — implemented-state banner
