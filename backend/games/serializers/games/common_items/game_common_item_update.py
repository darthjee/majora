"""GameCommonItem update serializer for the games app."""

from rest_framework import serializers

from games.models import GameCommonItem


class GameCommonItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields that may be edited on a game common item.

    `name` has no fallback target (unlike `CharacterItem`'s), so it stays required and
    non-blank via the default `CharField` behavior.
    """

    price = serializers.IntegerField(required=False, min_value=0)

    class Meta:
        """Metadata for the GameCommonItemUpdateSerializer."""

        model = GameCommonItem
        fields = ['name', 'description', 'price', 'category', 'hidden']
        extra_kwargs = {field: {'required': False} for field in fields if field != 'price'}
