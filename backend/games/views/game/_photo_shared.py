"""Factories building the parameterized PC/NPC photo view pairs (issue #690).

Split out of `_character_shared.py` — see that module's docstring for the general rationale.
"""

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated

from ...models import Game
from ._character_shared import _build_api_view
from .photos._photo_deletable import character_photo_deletable
from .photos._photo_detail import character_photo_detail
from .photos._photo_set import character_photo_set
from .photos._photo_upload import character_photo_upload
from .photos._photos import character_photos


def build_photo_upload_view(npc):
    """Build the POST photo-upload-init view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['POST'], IsAuthenticated)
    def view(request, game_slug, character_id):
        """Initialise a PC/NPC photo upload and return the upload id and token."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photo_upload(request, game, game_slug, character_id, npc=npc)

    return view


def build_photo_set_view(npc):
    """Build the PATCH photo role-set view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['PATCH'], IsAuthenticated)
    def view(request, game_slug, character_id, photo_id):
        """Update roles (e.g. profile) on a PC's/NPC's photo."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photo_set(request, game, character_id, photo_id, npc=npc)

    return view


def build_photo_detail_view(npc):
    """Build the PATCH/DELETE photo-detail view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['PATCH', 'DELETE'], IsAuthenticated)
    def view(request, game_slug, character_id, photo_id):
        """Mark a PC's/NPC's photo not-ready (PATCH), or permanently delete it (DELETE)."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photo_detail(request, game, character_id, photo_id, npc=npc)

    return view


def build_photo_deletable_view(npc):
    """Build the GET photo-deletable-check view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], IsAuthenticated)
    def view(request, game_slug, character_id, photo_id):
        """Return whether a PC's/NPC's photo may currently be deleted, plus its file path."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photo_deletable(request, game, character_id, photo_id, npc=npc)

    return view


def build_photos_view(npc):
    """Build the GET photos-list view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of ready photos for a specific PC/NPC in a game."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photos(request, game, character_id, npc=npc, check_hidden=npc)

    return view
