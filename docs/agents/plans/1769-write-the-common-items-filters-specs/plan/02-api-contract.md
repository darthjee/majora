# API contract page

Create `docs/agents/specs/common-items-filters/api-contract.md`, recording the issue's *API edge cases* and *Permissions* decisions:

- **Endpoints:** `GET /games/<slug>/common_items.json` (AllowAny, non-hidden items only) and `GET /games/<slug>/common_items/all.json` (`can_edit` / `GameEditPermission`, includes hidden items and the `hidden` field). Both accept exactly the same filters. No new endpoint or permission; anonymous visitors can filter.
- **Params table:** `name` (case-insensitive substring, existing), `category` (exact match against the 7 `GameCommonItem.CATEGORY_CHOICES`), `min_price` (`price__gte`), `max_price` (`price__lte`). All optional, combined with AND. Order: base queryset (hidden filter on the public index) → query filters → pagination.
- **Edge-case rules #1 to #15:** copy the issue's table, keeping the numbering (#1770, #1771 and the tests refer to it), each with its *Rationale*.
- **Filter-visibility rule:** link `docs/agents/access-control/common-rules.md`; no filter on `hidden`, `incognito` or `private_*` on either index; `hidden` is a returned field, not a filter.
- **Backward compatibility:** purely additive; no serializer or response change; requests without the new params behave exactly as today.

## Files to Change

- `docs/agents/specs/common-items-filters/api-contract.md`: new page.
