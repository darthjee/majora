# Jasmine specs

Mirror the existing `MemoryCacheCard*` specs under
`frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/`. Stub
`RequestStore.ensure` and `RequestStore.mutate` with `spyOn`. No real network.

**`controllers/VisitsSummaryCardController/` specs (one file per method, following the existing
folder convention):**

- the mount fetch calls `ensure` with `quantityType: 'summary'` and `query`
  `{ period: 'day', tz }`. `tz` is left out when the resolver returns nothing or throws;
- `changePeriod('week')` fetches again with `period: 'week'`; `refresh()` fetches again with the
  current period;
- `unique_visitors: 0` is set as `0`. A rejected `ensure` sets `error`, and `loading` ends
  `false` either way;
- `clear()` calls `mutate` with `method: 'DELETE'` and `quantityType: 'clear'`:
  - on success, the status carries `deleted_visits` and `deleted_sessions`, then it fetches
    again;
  - on a non-ok response, the status is `'error'`, then it fetches again;
  - on a thrown error, the status is `'error'`, then it fetches again.

**`helpers/VisitsSummaryCardHelperSpec.js`:**

- the loading, error and number states;
- the success feedback has both counts substituted, and the error feedback renders;
- the select and both actions are disabled while loading or while the status is `'loading'`;
- the link points at `#/staff/statistics`.

**`ClearStatisticsConfirmModalSpec.js` and `helpers/ClearStatisticsConfirmModalHelperSpec.js`:**

- confirm is disabled for empty, wrong (`DELETE`) and wrong-case (`clear`) input;
- confirm is enabled for `CLEAR` and for `  CLEAR  `;
- cancel and close clear the input (reopening shows it empty) and call `onCancel`;
- confirm calls `onConfirm`.

**`VisitsSummaryCardSpec.js`:**

- it renders with the default `day` period;
- changing the select calls the controller;
- Clear opens the modal, and confirming calls `clear`.

**`staffStatisticsConfig` spec (if one exists):** `GET.summary` and `DELETE.clear` resolve to
the right paths.

## Files to Change

- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/controllers/VisitsSummaryCardController/*Spec.js`
  — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/helpers/VisitsSummaryCardHelperSpec.js`
  — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearStatisticsConfirmModalHelperSpec.js`
  — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/ClearStatisticsConfirmModalSpec.js`
  — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/VisitsSummaryCardSpec.js`
  — new.
