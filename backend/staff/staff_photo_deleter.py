"""Staff photo deletion: removes a photo row, re-pointing gallery owners to a fallback."""

from django.db import transaction
from rest_framework.response import Response

from staff.cache_clear_header import attach_photo_cache_clear
from uploads.models import Upload


def has_active_upload(photo):
    """Return True while `photo` has an in-flight (pending/uploading, not expired) upload."""
    return Upload.objects.active().for_object(photo).exists()


class StaffPhotoDeleter:
    """Deletes one photo row of a registry entry, refusing while a replace is in flight."""

    def __init__(self, photo_type, photo):
        """Store the registry entry and the photo to delete."""
        self._photo_type = photo_type
        self._photo = photo

    def run(self):
        """Delete the photo and return 204 with `X-Cache-Clear`, or 422 while uploading."""
        with transaction.atomic():
            photo = self._photo_type.model.objects.select_for_update().get(pk=self._photo.pk)
            if has_active_upload(photo):
                return Response(status=422)
            owner = self._photo_type.owner_of(photo)
            self._repoint_gallery_owner(photo)
            photo.delete()
        return attach_photo_cache_clear(Response(status=204), self._photo_type, owner)

    def _repoint_gallery_owner(self, photo):
        """Point a gallery owner whose current photo is `photo` at its fallback photo."""
        owner = self._photo_type.gallery_owner(photo)
        if owner is None or owner.photo_id != photo.pk:
            return
        owner.photo = self._photo_type.fallback_photo(owner, excluding=photo)
        owner.save(update_fields=['photo'])
