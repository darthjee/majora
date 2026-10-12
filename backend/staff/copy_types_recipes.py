"""The `recipes` copy type: copies a `GameRecipe`, resolving its common item in the target."""

from django.db.models import Exists, OuterRef

from games.models import GameCommonItem, GameRecipe

from .copy_recipe_common_item import RecipeCommonItemResolver
from .copy_type_base import ModelCopyType
from .serializers import StaffCopyRecipeSerializer


class RecipesCopyType(ModelCopyType):
    """Copy type of game recipes; see `docs/agents/specs/game-content-copy/recipes.md`."""

    copied_fields = (
        'name', 'description', 'yield_quantity', 'crafting_time', 'crafting_cost',
        'ingredients', 'checks', 'hidden',
    )

    def __init__(self):
        """Configure the `recipes` slug over `GameRecipe`."""
        super().__init__('recipes', GameRecipe)

    def serializer_class(self):
        """Return the recipes list row serializer."""
        return StaffCopyRecipeSerializer

    def source_queryset(self, from_game):
        """Return the game's recipes, ordered by id, with their common item preloaded."""
        return super().source_queryset(from_game).select_related('game_common_item')

    def list_queryset(self, from_game, to_game):
        """Return the listed recipes also annotated with `common_item_copied_to_target`."""
        copies = GameCommonItem.objects.filter(
            game=to_game, copied_from=OuterRef('game_common_item'),
        )
        return super().list_queryset(from_game, to_game).annotate(
            common_item_copied_to_target=Exists(copies),
        )

    def copy_result(self, request, source, target_game):
        """Resolve the common item, create the recipe, and return its uploads and extra paths."""
        resolved = RecipeCommonItemResolver(request, target_game).resolve(
            source.game_common_item,
        )
        copy = self._create_recipe(source, target_game, resolved.common_item)
        return copy, resolved.uploads, resolved.cache_paths()

    def copy_instance(self, request, source, target_game):
        """Copy `source` into `target_game` and return `(copy, uploads)`."""
        copy, uploads, _ = self.copy_result(request, source, target_game)
        return copy, uploads

    def _create_recipe(self, source, target_game, common_item):
        """Create the recipe copy in `target_game`, pointing to `common_item`."""
        return self.model.objects.create(
            game=target_game, copied_from=source, game_common_item=common_item,
            **self._copied_values(source),
        )
