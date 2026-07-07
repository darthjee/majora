"""GameTreasure update serializer for the games app."""

from rest_framework import serializers

from games.models import GameTreasure


class GameTreasureUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partial updates to a game's stock cap on a shared treasure."""

    max_units = serializers.IntegerField(required=False, allow_null=True, min_value=0)

    class Meta:
        """Metadata for the GameTreasureUpdateSerializer."""

        model = GameTreasure
        fields = ['max_units']
