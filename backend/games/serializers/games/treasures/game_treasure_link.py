"""GameTreasureLink serializer for the games app."""

from rest_framework import serializers

from games.models import GameTreasure, Treasure


class GameTreasureLinkSerializer(serializers.Serializer):
    """Serializer validating a request to link an existing Treasure to a game."""

    treasure_id = serializers.PrimaryKeyRelatedField(queryset=Treasure.objects.all())
    value = serializers.IntegerField(required=True, min_value=0)
    max_units = serializers.IntegerField(required=False, allow_null=True, min_value=0)

    def validate_treasure_id(self, treasure):
        """Ensure `treasure` matches the context game's type and isn't already linked to it."""
        game = self.context['game']
        if treasure.game_type != game.game_type:
            raise serializers.ValidationError('treasure game_type does not match the game')
        if GameTreasure.objects.filter(game=game, treasure=treasure).exists():
            raise serializers.ValidationError('treasure is already linked to this game')
        return treasure
