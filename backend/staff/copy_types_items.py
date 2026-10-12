"""The `items` copy type: copies a `GameItem` and links its ready cover photo."""

from games.models import GameItem

from .copy_cache_paths import items_copy_cache_paths
from .copy_photo_links import CoverPhotoLinkBuilder
from .copy_type_base import ModelCopyType
from .serializers import StaffCopyItemSerializer


class ItemsCopyType(ModelCopyType):
    """Copy type of game items; see `docs/agents/specs/game-content-copy/items.md`."""

    copied_fields = ('name', 'description', 'hidden')

    def __init__(self):
        """Configure the `items` slug over `GameItem`."""
        super().__init__('items', GameItem)

    def serializer_class(self):
        """Return the items list row serializer."""
        return StaffCopyItemSerializer

    def source_queryset(self, from_game):
        """Return the game's items, ordered by id, with their cover preloaded."""
        return super().source_queryset(from_game).select_related('photo')

    def copy_associations(self, request, source, copy):
        """Link the source's ready cover to the copy; other item photos are ignored."""
        builder = CoverPhotoLinkBuilder('game_item', request.user)
        upload = builder.build(source.photo, copy, self._photo_segments(copy))
        return [] if upload is None else [upload]

    def cache_paths(self, copy):
        """Return the target's item family and every character's `items/available.json`."""
        return items_copy_cache_paths(copy)

    @staticmethod
    def _photo_segments(copy):
        """Return the cover path segments of `copy`: `games/<target>/items/<copy-id>`."""
        return ['games', copy.game.game_slug, 'items', copy.pk]
