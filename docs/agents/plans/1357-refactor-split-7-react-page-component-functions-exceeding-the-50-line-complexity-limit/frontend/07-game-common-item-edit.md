# Extract GameCommonItemEdit's field-sync effect into a hook

`GameCommonItemEdit` (`frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx:23`, 54 lines) inlines a `useEffect` (lines 52–61) that calls `controller.applyLoadedItem(commonItem, { setName, setDescription, setPrice, setCategory, setHidden })`, with all five setter closures built inline around `setField`.

Extract this into a new hook, `hooks/useApplyLoadedCommonItem.js` (new `hooks/` folder alongside `controllers/`, `helpers/`, `elements/`), taking `(controller, commonItem, setField)` and internally building the same five `setField('<key>', value)` closures, calling `controller.applyLoadedItem(...)` inside a `useEffect` with the same `[commonItem]` dependency array and its existing `eslint-disable-next-line react-hooks/exhaustive-deps` comment. `GameCommonItemEdit` then replaces the inline effect with `useApplyLoadedCommonItem(controller, commonItem, setField);`.

## Files to Change

- `frontend/assets/js/components/resources/common_item/pages/hooks/useApplyLoadedCommonItem.js` — new hook, per above.
- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx` — replace the inline effect with the new hook call.
