"""GameRecipe write (create/update) serializer for the games app."""

from rest_framework import serializers

from games.models import GameRecipe

MAX_INTEGER = 2147483647


class GameRecipeOutputField(serializers.PrimaryKeyRelatedField):
    """Flat `game_common_item_id` field restricted to the common items of the context's game.

    Hidden common items are excluded unless `context['allow_hidden_output']` is set, so an
    unknown, cross-game or (on the regular tier) hidden id all fail with `does_not_exist`.
    """

    def get_queryset(self):
        """Return the common items of the context's game allowed as a recipe output."""
        queryset = self.context['game'].common_items.all()
        if self.context.get('allow_hidden_output'):
            return queryset
        return queryset.filter(hidden=False)

    def to_internal_value(self, data):
        """Reject non-integer numbers (e.g. `1.5`) before looking the id up."""
        if isinstance(data, float):
            self.fail('incorrect_type', data_type=type(data).__name__)
        return super().to_internal_value(data)


class GameRecipeWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating (full) or updating (`partial=True`) a game recipe.

    Uses an explicit field allowlist: `game` comes from the URL and `id` is never writable.
    """

    game_common_item_id = GameRecipeOutputField(source='game_common_item')
    yield_quantity = serializers.IntegerField(
        required=False, min_value=1, max_value=MAX_INTEGER,
    )
    crafting_cost = serializers.IntegerField(
        required=False, min_value=0, max_value=MAX_INTEGER,
    )

    class Meta:
        """Metadata for the GameRecipeWriteSerializer."""

        model = GameRecipe
        fields = [
            'name', 'description', 'yield_quantity', 'crafting_time', 'crafting_cost',
            'ingredients', 'checks', 'hidden', 'game_common_item_id',
        ]
