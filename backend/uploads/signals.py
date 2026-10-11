"""Signal receivers of the uploads app.

Copy-origin uploads (hard-link jobs created by a game content copy) are tied to the copied
photo/file row through a generic foreign key, which does not cascade. `delete_copy_uploads` is
connected as a `pre_delete` receiver to every copyable model (`staff.copy_links.models()`), so
deleting a copied row -- directly or through its game's cascade -- deletes its copy uploads.

A `GenericRelation` is deliberately not used: it would also delete the row's regular and staff
uploads, which `StaffUploadFinalizer` needs to answer `404 {cleanup_path}`.
"""

from django.db.models.signals import pre_delete

from .models import Upload


def delete_copy_uploads(sender, instance, **kwargs):
    """Delete the copy-origin uploads linked to the row being deleted."""
    Upload.objects.for_object(instance).filter(origin=Upload.ORIGIN_COPY).delete()


def connect_copy_upload_cleanup(models):
    """Connect `delete_copy_uploads` as a `pre_delete` receiver of each of `models`."""
    for model in models:
        pre_delete.connect(
            delete_copy_uploads,
            sender=model,
            dispatch_uid=f'uploads.delete_copy_uploads.{model._meta.label_lower}',
        )
