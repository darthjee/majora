"""Character update serializer for the games app."""

from rest_framework import serializers

from games.models import Character


class CharacterUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields a player may edit on their PC."""

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
        ]
        extra_kwargs = {field: {'required': False} for field in fields}
