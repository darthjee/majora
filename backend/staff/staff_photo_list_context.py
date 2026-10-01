"""Per-page context for serializing a page of staff photo list items."""

from uploads.models import Upload


class StaffPhotoListContext:
    """Batch-loads the owners and active uploads of one page of photos of a photo type."""

    def __init__(self, photo_type, photos):
        """Store the registry entry and the (already paginated) photos of the page."""
        self.photo_type = photo_type
        self.photos = photos

    def build(self):
        """Return the serializer context: registry entry, owners map and active photo ids."""
        return {
            'photo_type': self.photo_type,
            'owners': self.photo_type.load_owners(self.photos),
            'active_ids': self._active_ids(),
        }

    def _active_ids(self):
        """Return the set of page photo ids with an in-flight upload (one query)."""
        ids = [photo.pk for photo in self.photos]
        if not ids:
            return set()
        uploads = Upload.objects.active().for_objects(self.photo_type.model, ids)
        return set(uploads.values_list('object_id', flat=True))
