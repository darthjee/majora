# Selectors, tabs, empty state, source list and row registry

Presentational components under `staff_copy/pages/elements/`, plus the page `StaffCopies.jsx` and its helper:

- `StaffCopyGameSelect` (one component used twice, for source and target): options show `name` plus the joined `domain_groups` in parentheses (omitted when empty), value `slug`, with a placeholder.
- `StaffCopyTabs`: modeled on `StaffPhotoTabs`, but each link is `#/staff/copies?type=<slug>&from=<from>&to=<to>` (omit empty params). Label: `staff_copies_page.types.<slug>`, falling back to the raw slug if the key is missing.
- Empty-types state: when `types` is empty, render `staff_copies_page.no_types` instead of the tabs and list. Selectors and the pending-links list still render.
- Hint `select_games_hint` until both games are selected; validation message on same game.
- `StaffCopySourceList`: paginated table (existing pagination component), header checkbox for select-all on the current page, one checkbox per row, `copied_to_target` badge (also the `name_taken_in_target` badge when present), and a copy button disabled when nothing is selected or a run is in progress.
- `StaffCopyRows.js` registry: `rowFor(slug)` returns the registered component or `StaffCopyFallbackRow` (renders `name`). `columnsFor(slug)` returns extra header labels (fallback: the name column). **Ships empty.**
- Selection hook `useStaffCopySelection` (follow `useStaffPhotoSelection`).
- Specs for each component and the hook: fallback row vs a stub-registered row (unregister after each spec), select-all, tab link params, option labels, empty state.

## Files to Change
- `frontend/assets/js/components/resources/staff_copy/pages/StaffCopies.jsx` — new page.
- `.../staff_copy/pages/helpers/StaffCopiesHelper.jsx` — new render helper.
- `.../staff_copy/pages/elements/StaffCopyGameSelect.jsx`, `StaffCopyTabs.jsx`, `StaffCopySourceList.jsx`, `StaffCopyFallbackRow.jsx` — new.
- `.../staff_copy/pages/helpers/StaffCopyRows.js` — new registry.
- `.../staff_copy/pages/hooks/useStaffCopySelection.js` — new.
- Matching specs under `frontend/specs/assets/js/components/resources/staff_copy/pages/`.
