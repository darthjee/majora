# Apply usePhotoPreviewUrl and extract tag handling in StlModelNew

`StlModelNew` (`frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx:45`, 56 lines) has both the duplicated photo-preview-URL pair (lines 65–76, replace with step 3's `usePhotoPreviewUrl` hook, same as step 4) and its own tag-management state/handlers: `tagInput` state (line 48), `handleAddTag` (lines 84–87), and `handleRemoveTag` (line 89), all built on top of the already-exported module-level `buildTagsAfterAdd` helper (lines 18–36, keep exported as-is — it's covered by its own spec).

Extract the tag state/handlers into a new hook, `hooks/useTagsField.js` (new `hooks/` folder alongside `controllers/`, `helpers/`, `elements/`), taking `(tags, setField)` — where `setField('tags', ...)` is the existing `useFormState` setter — and returning `{ tagInput, onTagInputChange, handleAddTag, handleRemoveTag }`, internally calling the existing `buildTagsAfterAdd` (import it, do not duplicate it). `StlModelNew` then calls `useTagsField(fields.tags, setField)` and wires the returned handlers into `StlModelNewHelper.render`'s second argument in place of the current inline versions.

## Files to Change

- `frontend/assets/js/components/resources/stl_model/pages/hooks/useTagsField.js` — new hook, per above.
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx` — use `usePhotoPreviewUrl` (step 3) and `useTagsField`, removing the now-inlined equivalents.
