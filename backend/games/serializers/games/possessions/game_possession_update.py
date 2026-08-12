"""GamePossession update serializer for the games app."""

from rest_framework import serializers

from games.models import GamePossession


class GamePossessionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields that may be edited on a game possession.

    `name` has no fallback target (unlike `CharacterItem`'s), so it stays required and
    non-blank via the default `CharField` behavior.
    """

    class Meta:
        """Metadata for the GamePossessionUpdateSerializer."""

        model = GamePossession
        fields = ['name', 'description', 'hidden']
        extra_kwargs = {field: {'required': False} for field in fields}
