# Thread the flag through ListPageHelper

Make `#breakpointColumnClass`'s `Math.min(normal, itemsCount)` conditional on the list type's `flexibleColumns` flag, instead of applying it unconditionally to every list type.

`#renderItem` already has `config` in scope (it destructures `config.wrapperClass`, `config.buildItemHref`, `config.itemsPerRow`, etc.) and calls `ListPageHelper.#columnClassName(config.itemsPerRow, itemsCount)` — pass `config.flexibleColumns` through as a new argument there.

`#columnClassName(itemsPerRow, itemsCount)` maps `#breakpoints(itemsPerRow)` to `#breakpointColumnClass(prefix, normal, itemsCount)` per breakpoint — accept the flag as a new parameter and forward it into each `#breakpointColumnClass` call.

`#breakpointColumnClass(prefix, normal, itemsCount)` currently always computes `effectiveColumns = Math.min(normal, itemsCount)`. Accept the flag as a new parameter: when `true`, keep today's `Math.min(normal, itemsCount)`; when falsy (`false` or `undefined`), use `normal` directly as `effectiveColumns` (pre-PR-#1211 behavior, and the current behavior for every list type other than `games`/`my-games`).

## Files to Change
- `frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx` — thread `config.flexibleColumns` from `#renderItem` through `#columnClassName` into `#breakpointColumnClass`, and make the `Math.min` call conditional on it (update the JSDoc `@param` blocks for all three methods to document the new parameter).
