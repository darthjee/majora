"""The `possessions` copy type: copies a `GamePossession` and links its ready cover photo."""

from games.models import GamePossession

from .copy_cache_paths import possessions_copy_cache_paths
from .copy_photo_links import CoverPhotoLinkBuilder
from .copy_type_base import ModelCopyType
from .serializers import StaffCopyPossessionSerializer


class PossessionsCopyType(ModelCopyType):
    """Copy type of game possessions; see `docs/agents/specs/game-content-copy/possessions.md`."""

    copied_fields = ('name', 'description', 'hidden')

    def __init__(self):
        """Configure the `possessions` slug over `GamePossession`."""
        super().__init__('possessions', GamePossession)

    def serializer_class(self):
        """Return the possessions list row serializer."""
        return StaffCopyPossessionSerializer

    def source_queryset(self, from_game):
        """Return the game's possessions, ordered by id, with their cover preloaded."""
        return super().source_queryset(from_game).select_related('photo')

    def copy_associations(self, request, source, copy):
        """Link the source's ready cover to the copy; other possession photos are ignored."""
        builder = CoverPhotoLinkBuilder('game_possession', request.user)
        upload = builder.build(source.photo, copy, self._photo_segments(copy))
        return [] if upload is None else [upload]

    def cache_paths(self, copy):
        """Return the target's possession family and every character's available list."""
        return possessions_copy_cache_paths(copy)

    @staticmethod
    def _photo_segments(copy):
        """Return the cover path segments of `copy`: `games/<target>/possessions/<copy-id>`."""
        return ['games', copy.game.game_slug, 'possessions', copy.pk]
