# Apply usePhotoPreviewUrl in GameCommonItemNew

`GameCommonItemNew` (`frontend/assets/js/components/resources/common_item/pages/GameCommonItemNew.jsx:19`, 51 lines) has the duplicated photo-preview-URL `useMemo`/cleanup-`useEffect` pair (lines 39–48) that step 3's `usePhotoPreviewUrl` hook now covers.

Replace those two hooks with a single `const photoPreviewUrl = usePhotoPreviewUrl(photoFile);` call, importing it from `frontend/assets/js/utils/usePhotoPreviewUrl.js`, and drop the now-unused `useEffect` import if nothing else in the file needs it (check: `useEffect(() => controller.buildEffect()(), [controller])` on line 37 still needs it — keep the import).

If this alone doesn't bring the function to ≤50 lines, also extract the trailing modal-prop callbacks currently inlined in the `<GameCommonItemNewModals ... />` JSX (`onFileConfirmed`, `onPriceConfirm`, lines 94–103) into named handler functions (e.g. `handlePhotoConfirmed`, `handlePriceConfirm`) defined alongside the file's other `handle*` functions, then reference them by name in the JSX — same pattern already used for `handleSubmit`/`handleRetryPhotoUpload`/`handleSkipPhotoUpload`.

## Files to Change

- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemNew.jsx` — use `usePhotoPreviewUrl`; extract remaining inline modal callbacks to named handlers only if still needed to reach ≤50 lines.
