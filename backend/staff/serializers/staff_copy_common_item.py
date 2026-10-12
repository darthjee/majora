"""Staff copy common item serializer: one row of `GET staff/copies/common_items.json`."""

from rest_framework import serializers

from games.models import GameCommonItem


class StaffCopyCommonItemSerializer(serializers.ModelSerializer):
    """Serializer for a source common item of the copy page; `copied_from` is never exposed.

    `copied_to_target` reads the list queryset's annotation; `photo` is the cover's path only
    when the cover is ready; `category` is the raw choice value.
    """

    photo = serializers.SerializerMethodField()
    copied_to_target = serializers.BooleanField(read_only=True)

    class Meta:
        """Metadata for the StaffCopyCommonItemSerializer."""

        model = GameCommonItem
        fields = ['id', 'name', 'category', 'price', 'hidden', 'photo', 'copied_to_target']

    def get_photo(self, obj):
        """Return the cover photo path when the cover is ready, else None."""
        photo = obj.photo
        if photo is None or not photo.ready:
            return None
        return photo.path
