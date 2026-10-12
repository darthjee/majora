"""Resolution of a copied recipe's required common item in the target game.

See the "Common item" section of `docs/agents/specs/game-content-copy/recipes.md`: the newest
direct copy of the source common item in the target is reused, else the common item is copied
(inside the caller's transaction) with every common-items rule.
"""

from games.models import GameCommonItem

from .copy_types_common_items import CommonItemsCopyType

_COMMON_ITEMS = CommonItemsCopyType()


class ResolvedCommonItem:
    """The target common item of a recipe copy, with what resolving it produced."""

    def __init__(self, common_item, uploads=(), copied=False):
        """Store the resolved common item, its copy-origin uploads and whether it was copied."""
        self.common_item = common_item
        self.uploads = list(uploads)
        self.copied = copied

    def cache_paths(self):
        """Return the stale paths of the common item itself: its family when it was copied."""
        return []


class RecipeCommonItemResolver:
    """Resolves a source common item into a common item of the target game."""

    def __init__(self, request, target_game):
        """Store the request (for upload ownership) and the target game."""
        self._request = request
        self._target_game = target_game

    def resolve(self, source_common_item):
        """Return the `ResolvedCommonItem` reusing a direct copy or copying the source."""
        reused = self._newest_direct_copy(source_common_item)
        if reused is not None:
            return ResolvedCommonItem(reused)
        return self._copy(source_common_item)

    def _newest_direct_copy(self, source_common_item):
        """Return the target's newest common item copied directly from the source, or None."""
        return GameCommonItem.objects.filter(
            game=self._target_game, copied_from=source_common_item,
        ).order_by('-id').first()

    def _copy(self, source_common_item):
        """Copy the source common item into the target game, linking its ready cover."""
        copy, uploads = _COMMON_ITEMS.copy_instance(
            self._request, source_common_item, self._target_game,
        )
        return ResolvedCommonItem(copy, uploads, copied=True)
