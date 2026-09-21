# Shrink StlModelNew
`StlModelNew` (`StlModelNew.jsx:47`) is 54 lines and needs to lose at least 4. The three handlers (`handleSubmit`, `handleRetryPhotoUpload`, `handleSkipPhotoUpload`) and the 17-entry handlers object passed to `StlModelNewHelper.render` account for most of the body.

Suggested extraction: a `useStlModelNewHandlers({ controller, fields, setField, ... })` hook in `hooks/` (next to `useTagsField.js`) that builds `handleSubmit`, `handleRetryPhotoUpload` and `handleSkipPhotoUpload`. The `window.location.hash` redirect in `handleSkipPhotoUpload` can also become a small static on `StlModelNewController`. Alternatively, move the handlers-object assembly onto `StlModelNewHelper` as a `buildHandlers(...)` function. Either way the exported `buildTagsAfterAdd` stays exactly where it is, since existing specs import it from this file.

## Files to Change
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx` — use the new hook/helper.
- `frontend/assets/js/components/resources/stl_model/pages/hooks/useStlModelNewHandlers.js` — new hook (or `helpers/StlModelNewHelper.jsx` for the handlers-object variant).
- `frontend/specs/assets/js/components/resources/stl_model/pages/hooks/useStlModelNewHandlersSpec.js` — new spec.
