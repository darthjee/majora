"""The `factions` copy type: copies a `GameFaction` and links its ready cover photo."""

from django.db import IntegrityError
from django.db.models import Exists, OuterRef
from rest_framework.response import Response

from games.models import GameFaction

from .copy_cache_paths import factions_copy_cache_paths
from .copy_photo_links import CoverPhotoLinkBuilder
from .copy_type_base import ModelCopyType
from .serializers import StaffCopyFactionSerializer

_NAME_TAKEN = {'errors': {'name': ['unique']}}


class FactionsCopyType(ModelCopyType):
    """Copy type of game factions; see `docs/agents/specs/game-content-copy/factions.md`."""

    copied_fields = ('name',)

    def __init__(self):
        """Configure the `factions` slug over `GameFaction`."""
        super().__init__('factions', GameFaction)

    def serializer_class(self):
        """Return the factions list row serializer."""
        return StaffCopyFactionSerializer

    def source_queryset(self, from_game):
        """Return the game's factions, ordered by id, with their cover preloaded."""
        return super().source_queryset(from_game).select_related('photo')

    def list_queryset(self, from_game, to_game):
        """Return the listed rows also annotated with `name_taken_in_target` for `to_game`."""
        taken = GameFaction.objects.filter(game=to_game, name=OuterRef('name'))
        return super().list_queryset(from_game, to_game).annotate(
            name_taken_in_target=Exists(taken),
        )

    def copy(self, request, source, target_game):
        """Copy `source`, answering `422` (nothing created or cleared) on a name clash."""
        try:
            return super().copy(request, source, target_game)
        except IntegrityError:
            return Response(_NAME_TAKEN, status=422)

    def copy_associations(self, request, source, copy):
        """Link the source's ready cover to the copy; other faction photos are ignored."""
        builder = CoverPhotoLinkBuilder('faction', request.user)
        upload = builder.build(source.photo, copy, self._photo_segments(copy))
        return [] if upload is None else [upload]

    def cache_paths(self, copy):
        """Return the target's faction family and every character's available list."""
        return factions_copy_cache_paths(copy)

    @staticmethod
    def _photo_segments(copy):
        """Return the cover path segments of `copy`: `games/<target>/factions/<copy-id>`."""
        return ['games', copy.game.game_slug, 'factions', copy.pk]
