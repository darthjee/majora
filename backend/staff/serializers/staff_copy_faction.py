"""Staff copy faction serializer: one row of `GET staff/copies/factions.json`."""

from rest_framework import serializers

from games.models import GameFaction


class StaffCopyFactionSerializer(serializers.ModelSerializer):
    """Serializer for a source faction of the copy page; `copied_from` is never exposed.

    `copied_to_target` and `name_taken_in_target` read the list queryset's annotations; `photo`
    is the cover's path only when the cover is ready.
    """

    photo = serializers.SerializerMethodField()
    copied_to_target = serializers.BooleanField(read_only=True)
    name_taken_in_target = serializers.BooleanField(read_only=True)

    class Meta:
        """Metadata for the StaffCopyFactionSerializer."""

        model = GameFaction
        fields = ['id', 'name', 'photo', 'copied_to_target', 'name_taken_in_target']

    def get_photo(self, obj):
        """Return the cover photo path when the cover is ready, else None."""
        photo = obj.photo
        if photo is None or not photo.ready:
            return None
        return photo.path
