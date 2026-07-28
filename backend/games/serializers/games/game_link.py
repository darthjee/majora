"""GameLink serializer for the games app."""

from rest_framework import serializers

from games.models import GameLink


class GameLinkSerializer(serializers.ModelSerializer):
    """Serializer for game links."""

    class Meta:
        """Metadata for the GameLinkSerializer."""

        model = GameLink
        fields = ['id', 'text', 'url', 'link_type']
