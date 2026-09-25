# Migrate the five existing filter bars

Replace each helper's hand-written Query/Clear buttons (and its `<namespace>.filter_query` /
`filter_clear` lookups, which the translator removes) with
`<FilterActions onQuery={handlers.onQuery} onClear={handlers.onClear} testIdPrefix="…" />`:

| helper | `testIdPrefix` |
|---|---|
| `NpcFiltersHelper` (drop `#renderActions`) | `npc` |
| `PollFiltersHelper` | `poll` |
| `TreasureFiltersHelper` | `treasure` |
| `StaffUsersFiltersHelper` | `staff-users` |
| `StlModelFiltersHelper` | `stl-model` |

The rendered markup, classes and test ids must stay identical; the existing helper specs must
pass without changes (only adjust a spec if it asserted the old translation key directly).
After this step, `grep -rn "filter_query\|filter_clear" frontend/assets/js` must return nothing.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/helpers/NpcFiltersHelper.jsx`
- `frontend/assets/js/components/resources/game/pages/elements/helpers/PollFiltersHelper.jsx`
- `frontend/assets/js/components/resources/treasure/pages/elements/helpers/TreasureFiltersHelper.jsx`
- `frontend/assets/js/components/resources/staff_user/pages/elements/helpers/StaffUsersFiltersHelper.jsx`
- `frontend/assets/js/components/resources/stl_model/pages/elements/helpers/StlModelFiltersHelper.jsx`
