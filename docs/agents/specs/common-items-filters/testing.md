# Testing

Part of the [Common Items Filters](../common-items-filters.md) specs (Epic #1766).

*Followed by #1770 (backend) and #1771 (frontend).* The test matrix derived from the decisions.
Rule numbers refer to the [API contract](api-contract.md#edge-case-rules).

## Backend

### Shared helpers

`backend/common/tests/query_filters_test.py`, for both `filter_by_min` and `filter_by_max`:

| Case | Expected | Rule |
|------|----------|------|
| Param absent | Queryset unchanged | |
| Empty value | Ignored | #6 |
| Non-numeric value | Ignored | #5 |
| Decimal value | Ignored | #7 |
| `0` | Applied | #9 |
| Negative value | Applied | #8 |
| Valid value | `__gte` / `__lte` applied on the given field | |

### Common items filters module

Mirrored tree under `backend/games/tests/views/games/`:

- `filter_by_category`: unknown value (#1), empty value (#2), wrong case (#3), repeated param
  (#4), valid value.
- `apply_common_item_filters`: application order (name, category, price range) and AND
  combination.

### Views

For **both** `common_items.json` and `common_items/all.json`:

- each filter alone (`name`, `category`, `min_price`, `max_price`);
- combinations of filters;
- `min_price > max_price` gives an empty list (#10);
- a hidden item matching the filters is never returned by the public index, but is returned by
  `all.json` (#11);
- unknown slug gives `404` (#12);
- pagination headers (`page`, `pages`, `per_page`, `total`) reflect the filtered total (#13);
- unknown params, including `?hidden=true` on the public index, are ignored (#14).

### Regression

Treasure and exchange view tests pass **unchanged**: they guard the `_treasure_filters.py`
wrappers.

## Frontend

Jasmine specs under `frontend/specs/`, mirroring `assets/js/`:

- **Filter element:** rendering of the four fields and the actions; pre-fill from the hash
  filters.
- **Controller:** query building: `name` trimmed, blank fields omitted, "all" category omitted.
- **Helper:** fields and labels, including the 7 category options.
- **Page wiring:** `activeFilters` passed to the list; Query and Clear reset to page 1; Clear
  empties the hash filters.
- **Translations:** key sync across languages.
