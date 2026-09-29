"""GameRecipe list/detail serializers for the games app."""

from rest_framework import serializers

from games.models import GameRecipe
from games.serializers.games.recipes.game_recipe_output import GameRecipeOutputSerializer
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class GameRecipeListSerializer(serializers.ModelSerializer):
    """Serializer for game recipe list items, masking a hidden output item as `null`.

    The whole `output` object is masked (never individual fields), so adding output fields
    later can never leak partially. Restricted variants set `mask_hidden_output = False`.
    """

    mask_hidden_output = True

    output = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the GameRecipeListSerializer."""

        model = GameRecipe
        fields = ['id', 'name', 'yield_quantity', 'crafting_time', 'crafting_cost', 'output']

    def get_output(self, obj):
        """Return the serialized output item, or `None` when it must be masked."""
        common_item = obj.game_common_item
        if self._is_masked(common_item):
            return None
        return GameRecipeOutputSerializer(common_item).data

    def _is_masked(self, common_item):
        """Return whether the output item must be hidden from this serializer's audience."""
        return self.mask_hidden_output and common_item.hidden


class GameRecipeAllListSerializer(HiddenFieldMixin, GameRecipeListSerializer):
    """Serializer for game recipe list items including hidden ones (GameEdit only).

    Used by the `/all.json` recipe indexes — adds `hidden` and returns the real output.
    """

    mask_hidden_output = False

    class Meta(GameRecipeListSerializer.Meta):
        """Metadata for the GameRecipeAllListSerializer."""

        fields = GameRecipeListSerializer.Meta.fields + ['hidden']


class GameRecipeDetailSerializer(GameRecipeListSerializer):
    """Serializer for a single game recipe's detail view, masking a hidden output item.

    Adds `description`, `ingredients` and `checks` on top of the list fields.
    """

    class Meta(GameRecipeListSerializer.Meta):
        """Metadata for the GameRecipeDetailSerializer."""

        fields = GameRecipeListSerializer.Meta.fields + ['description', 'ingredients', 'checks']


class GameRecipeDetailFullSerializer(HiddenFieldMixin, GameRecipeDetailSerializer):
    """Serializer for a single game recipe's detail view, including hidden ones (GameEdit only).

    Adds `hidden` on top of the detail fields and returns the real output.
    """

    mask_hidden_output = False

    class Meta(GameRecipeDetailSerializer.Meta):
        """Metadata for the GameRecipeDetailFullSerializer."""

        fields = GameRecipeDetailSerializer.Meta.fields + ['hidden']
