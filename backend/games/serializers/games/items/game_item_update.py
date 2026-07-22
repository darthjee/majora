"""GameItem update serializer for the games app."""

from rest_framework import serializers

from games.models import GameItem


class GameItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields that may be edited on a game item.

    `name` has no fallback target (unlike `CharacterItem`'s), so it stays required and
    non-blank via the default `CharField` behavior.
    """

    class Meta:
        """Metadata for the GameItemUpdateSerializer."""

        model = GameItem
        fields = ['name', 'description', 'hidden']
        extra_kwargs = {field: {'required': False} for field in fields}
