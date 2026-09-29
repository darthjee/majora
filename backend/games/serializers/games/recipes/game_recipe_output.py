"""GameRecipe output serializer for the games app."""

from rest_framework import serializers

from games.models import GameCommonItem


class GameRecipeOutputSerializer(serializers.ModelSerializer):
    """Serializer for the output `GameCommonItem` embedded in a recipe response."""

    photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)

    class Meta:
        """Metadata for the GameRecipeOutputSerializer."""

        model = GameCommonItem
        fields = ['id', 'name', 'photo_path', 'category']
