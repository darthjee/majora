"""Character update serializer for the games app."""

from rest_framework import serializers

from games.models import Character


class CharacterUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields a player may edit on their PC."""

    class Meta:
        model = Character
        fields = [
            'name',
            'avatar_url',
            'character_class',
            'level',
            'public_description',
            'private_description',
        ]
        extra_kwargs = {field: {'required': False} for field in fields}
