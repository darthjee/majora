"""Faction list serializer for the games app."""

from rest_framework import serializers

from games.models import Faction


class FactionListSerializer(serializers.ModelSerializer):
    """Serializer for a faction's flat shape.

    Reused for list items, the create response, the detail response, and the update
    response — there's no extra field a detail view would expose beyond this.
    """

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the FactionListSerializer."""

        model = Faction
        fields = ['id', 'name', 'photo_path']
