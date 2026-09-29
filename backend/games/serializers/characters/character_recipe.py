"""CharacterRecipe serializers for the games app."""

from rest_framework import serializers

from games.models import CharacterRecipe
from games.serializers.games.recipes.game_recipe_output import GameRecipeOutputSerializer
from games.serializers.hidden_field_mixin import HiddenFieldMixin

MASK_HIDDEN_OUTPUT = 'mask_hidden_output'


class CharacterRecipeSerializer(serializers.ModelSerializer):
    """Serializer for a character's known recipe, as listed on the character recipe index.

    `CharacterRecipe` is a thin join — every display field is sourced straight from the linked
    `GameRecipe`. The `output` is masked to `null` (as a whole object) when the output item is
    hidden, unless the view passes `mask_hidden_output=False` in the context (only for callers
    with `GameEdit`): masking depends on the caller, not only on the endpoint.
    """

    game_recipe_id = serializers.IntegerField(source='game_recipe.id', read_only=True)
    name = serializers.CharField(source='game_recipe.name', read_only=True)
    yield_quantity = serializers.IntegerField(source='game_recipe.yield_quantity', read_only=True)
    crafting_time = serializers.CharField(source='game_recipe.crafting_time', read_only=True)
    crafting_cost = serializers.IntegerField(source='game_recipe.crafting_cost', read_only=True)
    output = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the CharacterRecipeSerializer."""

        model = CharacterRecipe
        fields = [
            'id', 'game_recipe_id', 'name', 'yield_quantity', 'crafting_time', 'crafting_cost',
            'output',
        ]

    def get_output(self, obj):
        """Return the serialized output item, or `None` when it must be masked."""
        common_item = obj.game_recipe.game_common_item
        if self._is_masked(common_item):
            return None
        return GameRecipeOutputSerializer(common_item).data

    def _is_masked(self, common_item):
        """Return whether the output item must be hidden from this caller."""
        return self.context.get(MASK_HIDDEN_OUTPUT, True) and common_item.hidden


class CharacterRecipeAllSerializer(HiddenFieldMixin, CharacterRecipeSerializer):
    """Serializer for a character's known recipe, including hidden ones (`/all.json`).

    Adds `hidden` (the `CharacterRecipe`'s own flag, never `GameRecipe.hidden`).
    """

    class Meta(CharacterRecipeSerializer.Meta):
        """Metadata for the CharacterRecipeAllSerializer."""

        fields = CharacterRecipeSerializer.Meta.fields + ['hidden']


class CharacterRecipeDetailSerializer(CharacterRecipeSerializer):
    """Serializer for a single character recipe's detail view.

    Adds the linked recipe's markdown `description`, `ingredients` and `checks`.
    """

    description = serializers.CharField(source='game_recipe.description', read_only=True)
    ingredients = serializers.CharField(source='game_recipe.ingredients', read_only=True)
    checks = serializers.CharField(source='game_recipe.checks', read_only=True)

    class Meta(CharacterRecipeSerializer.Meta):
        """Metadata for the CharacterRecipeDetailSerializer."""

        fields = CharacterRecipeSerializer.Meta.fields + ['description', 'ingredients', 'checks']


class CharacterRecipeDetailFullSerializer(HiddenFieldMixin, CharacterRecipeDetailSerializer):
    """Serializer for a single character recipe's detail view, including hidden ones.

    Used by `/full.json` and the `hidden` PATCH response — adds `hidden` on top of the detail.
    """

    class Meta(CharacterRecipeDetailSerializer.Meta):
        """Metadata for the CharacterRecipeDetailFullSerializer."""

        fields = CharacterRecipeDetailSerializer.Meta.fields + ['hidden']
