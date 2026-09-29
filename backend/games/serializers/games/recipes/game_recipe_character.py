"""Character entry serializers for a game recipe's recipe → characters endpoints."""

from rest_framework import serializers

from games.models import CharacterRecipe
from games.serializers.characters._photo_path import resolve_photo_path
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class GameRecipeCharacterSerializer(serializers.ModelSerializer):
    """Serializer for a character who knows a recipe, as listed on the recipe's page.

    Serializes the `CharacterRecipe` row, but exposes the **character's** fields (the same
    shape as the faction characters list): `id` is the character id, not the row id.
    """

    id = serializers.IntegerField(source='character.id', read_only=True)
    name = serializers.CharField(source='character.name', read_only=True)
    photo_path = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the GameRecipeCharacterSerializer."""

        model = CharacterRecipe
        fields = ['id', 'name', 'photo_path', 'type']

    def get_photo_path(self, obj):
        """Return the character's photo path, or None when incognito or unset."""
        return resolve_photo_path(obj.character)

    def get_type(self, obj):
        """Return 'pc' or 'npc', matching the frontend's shortlist resource type convention."""
        return 'pc' if obj.character.is_pc else 'npc'


class GameRecipeCharacterAllSerializer(HiddenFieldMixin, GameRecipeCharacterSerializer):
    """Serializer for a character who knows a recipe, including hidden links (GameEdit only).

    Adds `hidden` — the `CharacterRecipe`'s own flag.
    """

    class Meta(GameRecipeCharacterSerializer.Meta):
        """Metadata for the GameRecipeCharacterAllSerializer."""

        fields = GameRecipeCharacterSerializer.Meta.fields + ['hidden']
