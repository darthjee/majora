"""Character money-only update serializer for the games app."""

from rest_framework import serializers

from games.models import Character


class CharacterMoneyUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the narrow, money-only character update endpoint (issue #615)."""

    class Meta:
        """Metadata for the CharacterMoneyUpdateSerializer."""

        model = Character
        fields = ['money']
        extra_kwargs = {'money': {'required': True}}
