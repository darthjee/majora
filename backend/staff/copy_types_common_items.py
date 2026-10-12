"""The `common_items` copy type: copies a `GameCommonItem` and links its ready cover photo."""

from games.models import GameCommonItem

from .copy_cache_paths import common_items_copy_cache_paths
from .copy_photo_links import CoverPhotoLinkBuilder
from .copy_type_base import ModelCopyType
from .serializers import StaffCopyCommonItemSerializer


class CommonItemsCopyType(ModelCopyType):
    """Copy type of game common items; see `docs/agents/specs/game-content-copy/`."""

    copied_fields = ('name', 'price', 'description', 'category', 'hidden')

    def __init__(self):
        """Configure the `common_items` slug over `GameCommonItem`."""
        super().__init__('common_items', GameCommonItem)

    def serializer_class(self):
        """Return the common items list row serializer."""
        return StaffCopyCommonItemSerializer

    def source_queryset(self, from_game):
        """Return the game's common items, ordered by id, with their cover preloaded."""
        return super().source_queryset(from_game).select_related('photo')

    def copy_associations(self, request, source, copy):
        """Link the source's ready cover to the copy; other common item photos are ignored."""
        builder = CoverPhotoLinkBuilder('game_common_item', request.user)
        upload = builder.build(source.photo, copy, self._photo_segments(copy))
        return [] if upload is None else [upload]

    def cache_paths(self, copy):
        """Return the target's common item family (no `available.json`, no recipes)."""
        return common_items_copy_cache_paths(copy)

    @staticmethod
    def _photo_segments(copy):
        """Return the cover path segments: `games/<target>/common_items/<copy-id>`."""
        return ['games', copy.game.game_slug, 'common_items', copy.pk]
