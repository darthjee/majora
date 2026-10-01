"""Staff photo list item serializer."""

from rest_framework import serializers


class StaffPhotoListSerializer(serializers.Serializer):
    """Serializer for one item of `GET /staff/photos/<photo_type>.json`.

    Expects a `StaffPhotoListContext.build()` context (`photo_type`, `owners`, `active_ids`).
    """

    id = serializers.IntegerField()
    path = serializers.CharField()
    ready = serializers.BooleanField()
    replace_in_progress = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()

    def get_replace_in_progress(self, photo):
        """Return True while the photo has an active upload."""
        return photo.pk in self.context['active_ids']

    def get_owner(self, photo):
        """Return the description of the photo's owner, or None."""
        owner = self.context['owners'].get(photo.pk)
        return self.context['photo_type'].describe_owner(owner)
