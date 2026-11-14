# Forward filters in the list fetch and register the filters component

In `commonItemListType.js`:

- `fetchGameCommonItems` reads `Object.fromEntries(hashResolver.getFilterParams())` and passes
  it to `buildListQuery(hashResolver, filterParams)`, as `fetchTreasures` does in
  `listTypeConfig.js`. Everything else (`fetchRequestStoreList`, `resource: 'commonItem'`,
  `canEdit: AccessStore.ensureGamePermissions(gameSlug)`) stays as is, so the permission
  resolvers keep choosing between `common_items.json` and `common_items/all.json`.
- Set `filtersComponent: CommonItemFilters` on the `commonItems` entry.
- Update the JSDoc (it currently says the resolver is only used for pagination params).

## Files to Change

- `frontend/assets/js/components/common/list_types/configs/commonItemListType.js`: forward filter params; register `CommonItemFilters`.
