"""Staff copy possession serializer: one row of `GET staff/copies/possessions.json`."""

from rest_framework import serializers

from games.models import GamePossession


class StaffCopyPossessionSerializer(serializers.ModelSerializer):
    """Serializer for a source possession of the copy page; `copied_from` is never exposed.

    `copied_to_target` reads the list queryset's annotation; `photo` is the cover's path only
    when the cover is ready.
    """

    photo = serializers.SerializerMethodField()
    copied_to_target = serializers.BooleanField(read_only=True)

    class Meta:
        """Metadata for the StaffCopyPossessionSerializer."""

        model = GamePossession
        fields = ['id', 'name', 'hidden', 'photo', 'copied_to_target']

    def get_photo(self, obj):
        """Return the cover photo path when the cover is ready, else None."""
        photo = obj.photo
        if photo is None or not photo.ready:
            return None
        return photo.path
