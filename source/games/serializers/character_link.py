"""CharacterLink serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterLink


class CharacterLinkSerializer(serializers.ModelSerializer):
    """Serializer for character links."""

    class Meta:
        model = CharacterLink
        fields = ['id', 'text', 'url']
