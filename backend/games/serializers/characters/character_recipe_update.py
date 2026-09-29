"""CharacterRecipe update serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterRecipe


class CharacterRecipeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the `hidden`-only PATCH of a character recipe.

    Uses an explicit single-field allowlist: every other field in the body is ignored.
    """

    class Meta:
        """Metadata for the CharacterRecipeUpdateSerializer."""

        model = CharacterRecipe
        fields = ['hidden']
        extra_kwargs = {'hidden': {'required': False}}
