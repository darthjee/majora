"""View for the game faction photo upload init endpoint."""

import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from accounts.authentication import CookieTokenAuthentication
from permissions import EndpointPermission
from uploads.photo_path import PhotoPathBuilder
from uploads.upload_initiator import UploadInitiator

from ...models import Game, GameFaction, GameFactionPhoto


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_faction_photo_upload(request, game_slug, faction_id):
    """Initialise a faction photo upload and return the upload id and token."""
    game = get_object_or_404(Game, game_slug=game_slug)
    faction = get_object_or_404(GameFaction, pk=faction_id, game=game)

    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_faction', 'regular', 'photo_upload',
    )
    if error_response:
        return error_response

    initiator = UploadInitiator(
        request,
        build_file_path=lambda filename: _build_file_path(game_slug, faction_id, filename),
        create_photo=lambda file_path, _data: _reuse_or_create_photo(faction, file_path),
        id_field='faction_id',
        id_value=faction.id,
    )
    return initiator.run()


def _build_file_path(game_slug, faction_id, filename):
    """Fixed, deterministic path — a GameFaction has at most one photo, always replaced."""
    _, ext = os.path.splitext(filename)
    segments = ['games', game_slug, 'factions', faction_id]
    return PhotoPathBuilder(segments, f'photo{ext}', use_uuid=False).build()


def _reuse_or_create_photo(faction, file_path):
    """Return the faction's existing GameFactionPhoto updated with `file_path`, or a new one."""
    if faction.photo_id is not None:
        photo = faction.photo
        photo.path = file_path
        photo.ready = False
        photo.save()
        return photo
    return GameFactionPhoto.objects.create(faction=faction, path=file_path, ready=False)
