# Testing page

Create `docs/agents/specs/common-items-filters/testing.md`, the test matrix derived from the decisions, with references to the rule numbers in `api-contract.md`:

- **Backend helpers** (`backend/common/tests/query_filters_test.py`): `filter_by_min` / `filter_by_max`: absent, empty, non-numeric, decimal, `0`, negative, valid.
- **Common items filters module** (mirrored tree under `backend/games/tests/views/games/`): `filter_by_category` for rules #1 to #4; `apply_common_item_filters` order and AND combination.
- **Views, both indexes:** each filter alone; combinations; rules #10 to #14; hidden item never returned by the public index (#11) but returned by `all.json`; pagination headers (`page`, `pages`, `per_page`, `total`) reflect the filtered total (#13); unknown slug gives 404 (#12).
- **Regression:** treasure and exchange view tests pass unchanged.
- **Frontend (Jasmine, `frontend/specs/` mirroring `assets/js/`):** filter element (rendering, hash pre-fill), controller (query building: trim, blank omitted, "all" omitted), helper (fields, labels), page wiring (`activeFilters` passed to the list, Query/Clear reset to page 1); translation key sync across languages.

## Files to Change

- `docs/agents/specs/common-items-filters/testing.md`: new page.
