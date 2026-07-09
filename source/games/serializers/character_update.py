"""Character update serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.character_link_write import CharacterLinksSync, CharacterLinkWriteSerializer


class CharacterUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields a player may edit on their PC."""

    links = CharacterLinkWriteSerializer(many=True, required=False)

    class Meta:
        """Metadata for the CharacterUpdateSerializer."""

        model = Character
        fields = [
            'name',
            'role',
            'public_description',
            'private_description',
            'hidden',
            'money',
            'allegiance',
            'public_allegiance',
            'links',
        ]
        extra_kwargs = {
            field: {'required': False} for field in fields if field != 'links'
        }

    def update(self, instance, validated_data):
        """Update the character's scalar fields, then sync its `links` per entry."""
        links = validated_data.pop('links', [])
        instance = super().update(instance, validated_data)
        CharacterLinksSync(instance, links).apply()
        return instance
