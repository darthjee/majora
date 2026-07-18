"""Serializer exposing a Player's owned PC's name and photo, for the players roster."""

from rest_framework import serializers

from games.models import Character


class PlayerCharacterSerializer(serializers.ModelSerializer):
    """Serializer for a player's owned PC, trimmed to just name and photo."""

    photo_url = serializers.CharField(
        source='profile_photo.path', default=None, read_only=True
    )

    class Meta:
        """Metadata for the PlayerCharacterSerializer."""

        model = Character
        fields = ['name', 'photo_url']
