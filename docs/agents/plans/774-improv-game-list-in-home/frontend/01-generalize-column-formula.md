# Generalize the grid column-class formula

In `ListPageHelper.#renderItem`, replace the hardcoded
`col-6 col-sm-4 col-md-3 <col-lg-3|col-lg-2>` column class with a
per-breakpoint formula driven by the actual number of items being
rendered: effective columns at a breakpoint = `min(that breakpoint's
normal column count, items.length)`, where a breakpoint's "normal column
count" is derived from the existing per-type config (`xs`→2, `sm`→3,
`md`→4, `lg`→`itemsPerRow` — i.e. today's implicit schedule, just made
explicit and count-aware instead of hardcoded). Bootstrap width class =
`col-{prefix}-{12 / effective columns}` (`col-6`/`col-sm-4` have no
`-lg-`/no prefix for `xs`).

`items.length` is already available in `ListPageHelper.render` (the array
being mapped over) — pass it down into `#renderItem` (or compute the
per-item column class once in `render` and pass it in) rather than adding
a new prop or a separate count fetch.

For any list type whose configured per-breakpoint count is at or below the
actual rendered `items.length` (i.e. every type today with 4+ items in a
normal page, which is effectively all of them outside `games`/`my-games`
with few games), this formula resolves to the exact same class string as
today — verify this explicitly since it's the backward-compatibility
guarantee for the ~18 unaffected list types.

## Files to Change

- `frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx` — replace the hardcoded column class construction and `#largeColumnClass` with the generalized `min(breakpoint count, items.length)` formula, threading `items.length` through from `render` to `#renderItem`.
