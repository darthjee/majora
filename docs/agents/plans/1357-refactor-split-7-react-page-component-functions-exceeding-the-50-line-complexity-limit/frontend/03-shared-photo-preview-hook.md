# Add a shared usePhotoPreviewUrl hook

`GameCommonItemNew.jsx` and `StlModelNew.jsx` both currently duplicate the same photo-preview-URL logic verbatim:

```js
const photoPreviewUrl = useMemo(
  () => (photoFile ? URL.createObjectURL(photoFile) : null),
  [photoFile],
);

useEffect(() => () => {
  if (photoPreviewUrl) {
    URL.revokeObjectURL(photoPreviewUrl);
  }
}, [photoPreviewUrl]);
```

Extract this into a single shared hook, `frontend/assets/js/utils/usePhotoPreviewUrl.js` (alongside the existing `utils/useFormState.js`), exporting a default `usePhotoPreviewUrl(photoFile)` that returns `photoPreviewUrl` and encapsulates both the `useMemo` and the cleanup `useEffect` above, unchanged in behavior.

This step only adds the hook — steps 4 and 5 wire it into the two consuming pages.

## Files to Change

- `frontend/assets/js/utils/usePhotoPreviewUrl.js` — new shared hook, per above.
