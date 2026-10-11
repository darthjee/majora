# pre_delete cleanup of copy uploads

Add `backend/uploads/signals.py` with a `pre_delete` receiver. For the instance being deleted, it deletes `Upload.objects.for_object(instance).filter(origin=Upload.ORIGIN_COPY)`. Connect it explicitly for each model in `staff.copy_links.models()`, using a `dispatch_uid` per model, from `UploadsConfig.ready()` in `backend/uploads/apps.py`. This is the first signal receiver in the project, so keep the module small and documented.

Do **not** add a `GenericRelation`: regular and staff uploads must keep surviving row deletion, which `StaffUploadFinalizer`'s `404 {cleanup_path}` relies on.

Deleting a game cascades to the photo/file rows. Django fires `pre_delete` for each cascaded row once a receiver is connected, so game deletion is covered.

Tests (`backend/uploads/tests/signals_test.py`):
- deleting a copied photo row removes its copy uploads and leaves its regular/staff uploads in place;
- deleting a `GameDocumentFile` and a `GameDocumentFilePhoto`;
- deleting the whole game removes the copy uploads of its rows;
- unrelated models are untouched.

## Files to Change
- `backend/uploads/signals.py` — the receiver and its connection helper.
- `backend/uploads/apps.py` — `ready()` connects the receivers.
- `backend/uploads/tests/signals_test.py` — new tests.
