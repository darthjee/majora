"""Staff copy recipe serializer: one row of `GET staff/copies/recipes.json`."""

from rest_framework import serializers

from games.models import GameRecipe


class StaffCopyRecipeSerializer(serializers.ModelSerializer):
    """Serializer for a source recipe of the copy page; `copied_from` is never exposed.

    `copied_to_target` reads the list queryset's annotation; `common_item` nests the source
    common item with the `common_item_copied_to_target` annotation as its `copied_to_target`.
    """

    common_item = serializers.SerializerMethodField()
    copied_to_target = serializers.BooleanField(read_only=True)

    class Meta:
        """Metadata for the StaffCopyRecipeSerializer."""

        model = GameRecipe
        fields = [
            'id', 'name', 'hidden', 'yield_quantity', 'crafting_cost', 'common_item',
            'copied_to_target',
        ]

    def get_common_item(self, obj):
        """Return `{id, name, copied_to_target}` of the recipe's common item."""
        common_item = obj.game_common_item
        return {
            'id': common_item.pk,
            'name': common_item.name,
            'copied_to_target': bool(getattr(obj, 'common_item_copied_to_target', False)),
        }
