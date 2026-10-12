"""Staff copy document serializer: one row of `GET staff/copies/documents.json`."""

from rest_framework import serializers

from games.models import GameDocument


class StaffCopyDocumentSerializer(serializers.ModelSerializer):
    """Serializer for a source document of the copy page; `copied_from` is never exposed.

    `copied_to_target` and the three counts read the list queryset's annotations; `photo` is the
    cover's path only when the cover is ready.
    """

    photo = serializers.SerializerMethodField()
    pages_count = serializers.IntegerField(read_only=True)
    photos_count = serializers.IntegerField(read_only=True)
    files_count = serializers.IntegerField(read_only=True)
    copied_to_target = serializers.BooleanField(read_only=True)

    class Meta:
        """Metadata for the StaffCopyDocumentSerializer."""

        model = GameDocument
        fields = [
            'id', 'name', 'hidden', 'photo', 'pages_count', 'photos_count', 'files_count',
            'copied_to_target',
        ]

    def get_photo(self, obj):
        """Return the cover photo path when the cover is ready, else None."""
        photo = obj.photo
        if photo is None or not photo.ready:
            return None
        return photo.path
